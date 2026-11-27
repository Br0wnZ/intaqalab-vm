import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, Role } from '@intaqalab/core';
import {
  PlanningArmamentService,
  PlanningConditionsService,
  PlanningMunitionsService,
  PlanningSeriesService,
  PlanningTrialContextService,
} from '@intaqalab/data-access-planning';
import { type FireTrial, type TrialCreateModifyForm, TrialStatus } from '@intaqalab/models';
import { PlanningPermissionsService } from '@intaqalab/planning';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../+state/execution.store';
import { PlanningChangesService, type PlanningModification, PlanningModificationsService } from '../../data-access';
import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import {
  ClientModificationsDialog,
  type ClientModificationsDialogResult,
  PlanningModificationBlockedDialog,
  type PlanningModificationBlockedDialogResult,
} from '../dialogs/client-modifications-dialog';
import { ModifyPlanningDialog, type ModifyPlanningDialogResult } from '../dialogs/modify-planning-dialog';
import type { PlanningChange } from '../models/planning-changes.models';
import { ExecutionPageFacade } from './execution-page-facade.service';
import { WidgetStateService } from './widget-state.service';

describe('ExecutionPageFacade (planning modifications)', () => {
  const createSetup = ({
    status = TrialStatus.INTERRUPTED,
    roles = [Role.INTAQALAB_TRIAL_ENGINEER],
    changes = [],
    legacyModifications = [],
  }: {
    status?: TrialStatus;
    roles?: Role[];
    changes?: PlanningChange[];
    legacyModifications?: PlanningModification[];
  } = {}) => {
    const userRolesSignal = signal<Role[]>(roles);
    const fireTrialDataSignal = signal<Partial<FireTrial>>({
      id: 'trial-1',
      centerId: 'center-from-trial',
      trialNumber: '034A/25',
      status,
    });
    const fireTrialFormSignal = signal<TrialCreateModifyForm | null>({
      code: '034A/25',
      description: 'Test trial',
      client: 'client-1',
      clientReference: '',
      type: 'type-1',
      status,
      associatedTrial: '',
      associatedTrialView: '',
      hasAssociatedTrial: false,
      linkedTrial: '',
      linkedTrialView: '',
      hasLinkedTrial: false,
      requestedDate: '',
      observations: '',
    });

    const executionStoreMock = {
      fireTrialData: fireTrialDataSignal,
      fireTrial: fireTrialFormSignal,
      executionProgress: signal({
        series: [
          {
            seriesId: 'serie-1',
            shots: [
              { shotId: 'shot-1', status: 'FIRED', updatedAt: '2026-11-19T10:00:00Z' },
              { shotId: 'shot-2', status: 'PENDING', updatedAt: '' },
            ],
          },
        ],
      }),
      planningSeries: signal([]),
      activeSerieId: signal<string | null>(null),
      activeShotId: signal<string | null>(null),
      isExecutionStarted: signal(true),
      isLoadingExecutionState: signal(false),
      isLoadingExecutionProgress: signal(false),
      preferencesByUser: signal(null),
      equipmentSelector: signal({ serieOptions: [], disparoOptions: [], serieDisparoMap: {} }),
      setFireTrialId: vi.fn(),
      loadExecutionState: vi.fn(),
      loadPreferencesByUser: vi.fn(),
      updatePreferencesByUser: vi.fn(),
      reactivateExecution: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    const equipmentPlanningMock = {
      load: vi.fn(),
      isLoading: signal(false),
      trialMeasuresResource: { value: signal(undefined), reload: vi.fn() },
      catalog: signal([]),
    };
    const planningSeriesServiceMock = { reload: vi.fn() };
    const planningConditionsServiceMock = { reload: vi.fn() };
    const planningMunitionsServiceMock = { load: vi.fn(), reload: vi.fn() };
    const planningArmamentServiceMock = { load: vi.fn(), reload: vi.fn() };

    const dialogMock = {
      open: vi.fn(),
    };

    const planningChangesServiceMock = {
      fetch: vi.fn().mockResolvedValue(changes),
    };
    const planningModificationsServiceMock = {
      fetchModifications: vi.fn().mockResolvedValue(legacyModifications),
    };

    TestBed.configureTestingModule({
      providers: [
        ExecutionPageFacade,
        PlanningPermissionsService,
        WidgetStateService,
        { provide: MatDialog, useValue: dialogMock },
        { provide: ExecutionStore, useValue: executionStoreMock },
        { provide: EquipmentPlanningService, useValue: equipmentPlanningMock },
        { provide: PlanningChangesService, useValue: planningChangesServiceMock },
        { provide: PlanningModificationsService, useValue: planningModificationsServiceMock },
        { provide: PlanningSeriesService, useValue: planningSeriesServiceMock },
        { provide: PlanningConditionsService, useValue: planningConditionsServiceMock },
        { provide: PlanningMunitionsService, useValue: planningMunitionsServiceMock },
        { provide: PlanningArmamentService, useValue: planningArmamentServiceMock },
        {
          provide: PlanningTrialContextService,
          useValue: { context: signal({ fireTrialId: 'trial-1', centerId: 'center-99' }) },
        },
        {
          provide: AuthService,
          useValue: {
            getUserData: () => ({ preferred_username: 'engineer_user', name: 'Engineer', roles }),
            userRoles: userRolesSignal,
          },
        },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
        { provide: ToastrService, useValue: { warning: vi.fn(), success: vi.fn(), error: vi.fn() } },
      ],
    });

    const facade = TestBed.inject(ExecutionPageFacade);
    return {
      facade,
      dialogMock,
      executionStoreMock,
      equipmentPlanningMock,
      planningChangesServiceMock,
      planningSeriesServiceMock,
      planningConditionsServiceMock,
      planningMunitionsServiceMock,
      planningArmamentServiceMock,
      userRolesSignal,
      fireTrialDataSignal,
    };
  };

  beforeEach(() => {
    vi.spyOn(globalThis, 'setInterval').mockReturnValue(0 as unknown as ReturnType<typeof setInterval>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a warning when reactivation is forbidden', async () => {
    const { facade, executionStoreMock } = createSetup({ status: TrialStatus.CANCELLED });
    facade.initialize('trial-1');
    executionStoreMock.reactivateExecution.mockRejectedValue(new HttpErrorResponse({ status: 403 }));
    const toastr = TestBed.inject(ToastrService);

    await expect(facade.reactivateExecution()).resolves.toBeUndefined();

    expect(executionStoreMock.reactivateExecution).toHaveBeenCalledWith('trial-1');
    expect(toastr.warning).toHaveBeenCalledExactlyOnceWith('TRIAL_EXECUTION.ERRORS.REACTIVATE_FORBIDDEN', undefined, {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
    });
  });

  it.each([new HttpErrorResponse({ status: 500 }), new Error('Reactivation failed')])(
    'rethrows unhandled reactivation error %s without a warning',
    async (error) => {
      const { facade, executionStoreMock } = createSetup({ status: TrialStatus.CANCELLED });
      facade.initialize('trial-1');
      executionStoreMock.reactivateExecution.mockRejectedValue(error);
      const toastr = TestBed.inject(ToastrService);

      await expect(facade.reactivateExecution()).rejects.toBe(error);
      expect(toastr.warning).not.toHaveBeenCalled();
    },
  );

  it('enables canModifyPlanning only for trial engineer when trial is INTERRUPTED', () => {
    const { facade, fireTrialDataSignal, userRolesSignal } = createSetup({
      status: TrialStatus.INTERRUPTED,
      roles: [Role.INTAQALAB_TRIAL_ENGINEER],
    });

    expect(facade.canModifyPlanning()).toBe(true);

    fireTrialDataSignal.set({ id: 'trial-1', status: TrialStatus.IN_PROGRESS });
    expect(facade.canModifyPlanning()).toBe(false);

    fireTrialDataSignal.set({ id: 'trial-1', status: TrialStatus.INTERRUPTED });
    userRolesSignal.set([Role.INTAQALAB_TRIAL_CONSULTANT]);
    expect(facade.canModifyPlanning()).toBe(false);
  });

  it('opens blocked modal instead of modify dialog when pending modifications exist', async () => {
    const pendingChange: PlanningChange = {
      id: 'change-1',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: 'shot-1',
      seriesId: null,
      shotId: 'shot-1',
      field: 'elevation',
      operation: 'UPDATE',
      oldValue: '10',
      newValue: '20',
      status: 'PENDING',
      requiresApproval: true,
      requestClient: false,
      createdBy: 'user-1',
      createdAt: '2026-11-25T10:00:00Z',
      decidedBy: null,
      decidedAt: null,
    };
    const { facade, dialogMock } = createSetup({ changes: [pendingChange] });
    facade.initialize('trial-1');

    dialogMock.open.mockReturnValue({
      afterClosed: () => of<PlanningModificationBlockedDialogResult>({ action: 'close' }),
    });

    await facade.openModifyPlanning();

    expect(dialogMock.open).toHaveBeenCalledExactlyOnceWith(PlanningModificationBlockedDialog, {
      width: '520px',
      data: { allowViewPending: false },
    });
  });

  it('should fail closed when pending-change status cannot be checked', async () => {
    const { facade, dialogMock, planningChangesServiceMock } = createSetup();
    planningChangesServiceMock.fetch.mockRejectedValue(new Error('Network unavailable'));
    facade.initialize('trial-1');

    await facade.openModifyPlanning();

    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('opens ModifyPlanningDialog fullscreen and refreshes data when accepted changes are returned', async () => {
    const {
      facade,
      dialogMock,
      executionStoreMock,
      equipmentPlanningMock,
      planningSeriesServiceMock,
      planningConditionsServiceMock,
      planningMunitionsServiceMock,
      planningArmamentServiceMock,
    } = createSetup({
      changes: [],
    });
    facade.initialize('trial-1');
    executionStoreMock.setFireTrialId.mockClear();
    equipmentPlanningMock.load.mockClear();

    dialogMock.open.mockReturnValue({
      afterClosed: () =>
        of<ModifyPlanningDialogResult>({
          saved: true,
          hasAcceptedChanges: true,
          hasPendingChanges: false,
        }),
    });

    await facade.openModifyPlanning();

    expect(dialogMock.open).toHaveBeenCalledWith(ModifyPlanningDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog',
      disableClose: true,
      data: expect.objectContaining({
        fireTrialId: 'trial-1',
        executedShotIds: expect.any(Function),
        executionProgressReady: expect.any(Function),
      }),
    });
    expect(executionStoreMock.setFireTrialId).toHaveBeenCalledWith('trial-1');
    expect(equipmentPlanningMock.load).toHaveBeenCalledWith('trial-1');
    expect(planningSeriesServiceMock.reload).toHaveBeenCalledOnce();
    expect(planningConditionsServiceMock.reload).toHaveBeenCalledOnce();
    expect(planningMunitionsServiceMock.load).toHaveBeenCalledWith('trial-1');
    expect(planningMunitionsServiceMock.reload).toHaveBeenCalledOnce();
    expect(planningArmamentServiceMock.load).toHaveBeenCalledWith('trial-1');
    expect(planningArmamentServiceMock.reload).toHaveBeenCalledOnce();
    expect(equipmentPlanningMock.trialMeasuresResource.reload).toHaveBeenCalledOnce();
  });

  it('should use only the endpoint base center when checking and opening planning changes', async () => {
    const { facade, dialogMock, planningChangesServiceMock } = createSetup();
    facade.initialize('trial-1');
    dialogMock.open.mockReturnValue({ afterClosed: () => of<ModifyPlanningDialogResult | undefined>(undefined) });

    await facade.openModifyPlanning();

    expect(planningChangesServiceMock.fetch).toHaveBeenCalledWith('trial-1');
    expect(dialogMock.open).toHaveBeenCalledWith(
      ModifyPlanningDialog,
      expect.objectContaining({
        data: expect.objectContaining({ fireTrialId: 'trial-1' }),
      }),
    );
  });

  it('enables canViewModifications for client role and opens ClientModificationsDialog with review enabled', async () => {
    const { facade, dialogMock, executionStoreMock, equipmentPlanningMock } = createSetup({
      status: TrialStatus.IN_PROGRESS,
      roles: [Role.INTAQALAB_TRIAL_CONSULTANT],
      changes: [],
    });
    facade.initialize('trial-1');
    executionStoreMock.setFireTrialId.mockClear();
    equipmentPlanningMock.load.mockClear();

    expect(facade.canViewModifications()).toBe(true);

    dialogMock.open.mockReturnValue({
      afterClosed: () =>
        of<ClientModificationsDialogResult>({
          hasAcceptedChanges: true,
          hasDecisions: true,
        }),
    });

    await facade.openClientModifications();

    expect(dialogMock.open).toHaveBeenCalledWith(ClientModificationsDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        fireTrialId: 'trial-1',
        centerId: 'center-99',
        allowReview: true,
      },
    });
    expect(executionStoreMock.setFireTrialId).toHaveBeenCalledWith('trial-1');
    expect(equipmentPlanningMock.load).toHaveBeenCalledWith('trial-1');
  });

  it('enables canViewModifications for engineer only when modifications exist and disables review actions', async () => {
    const acceptedModification: PlanningModification = {
      id: 'mod-2',
      parameter: 'Temperatura',
      action: 'Modificación',
      previousValue: 20,
      newValue: 25,
      affectedShots: ['D2'],
      status: 'ACEPTADO',
      classification: 'none',
    };
    const { facade, dialogMock } = createSetup({
      roles: [Role.INTAQALAB_TRIAL_ENGINEER],
      legacyModifications: [acceptedModification],
    });

    expect(facade.canViewModifications()).toBe(false);

    facade.initialize('trial-1');
    await Promise.resolve();

    expect(facade.canViewModifications()).toBe(true);

    dialogMock.open.mockReturnValue({
      afterClosed: () =>
        of<ClientModificationsDialogResult>({
          hasAcceptedChanges: false,
          hasDecisions: false,
        }),
    });

    await facade.openClientModifications();

    expect(dialogMock.open).toHaveBeenCalledWith(ClientModificationsDialog, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        fireTrialId: 'trial-1',
        centerId: 'center-99',
        allowReview: false,
      },
    });
  });
});
