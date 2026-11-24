import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, Role } from '@intaqalab/core';
import { PlanningTrialContextService } from '@intaqalab/data-access-planning';
import { type FireTrial, type TrialCreateModifyForm, TrialStatus } from '@intaqalab/models';
import { PlanningPermissionsService } from '@intaqalab/planning';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../+state/execution.store';
import type { PlanningModification } from '../../data-access';
import { PlanningModificationsService } from '../../data-access';
import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import {
  ClientModificationsDialog,
  type ClientModificationsDialogResult,
  PlanningModificationBlockedDialog,
  type PlanningModificationBlockedDialogResult,
} from '../dialogs/client-modifications-dialog';
import { ModifyPlanningDialog, type ModifyPlanningDialogResult } from '../dialogs/modify-planning-dialog';
import { ExecutionPageFacade } from './execution-page-facade.service';
import { WidgetStateService } from './widget-state.service';

describe('ExecutionPageFacade (planning modifications)', () => {
  const createSetup = ({
    status = TrialStatus.INTERRUPTED,
    roles = [Role.INTAQALAB_TRIAL_ENGINEER],
    modifications = [],
  }: {
    status?: TrialStatus;
    roles?: Role[];
    modifications?: PlanningModification[];
  } = {}) => {
    const userRolesSignal = signal<Role[]>(roles);
    const fireTrialDataSignal = signal<Partial<FireTrial>>({
      id: 'trial-1',
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
    };

    const equipmentPlanningMock = {
      load: vi.fn(),
      isLoading: signal(false),
      trialMeasuresResource: { value: signal(undefined) },
      catalog: signal([]),
    };

    const dialogMock = {
      open: vi.fn(),
    };

    const modificationsServiceMock = {
      fetchModifications: vi.fn().mockResolvedValue(modifications),
    };

    TestBed.configureTestingModule({
      providers: [
        ExecutionPageFacade,
        PlanningPermissionsService,
        WidgetStateService,
        { provide: MatDialog, useValue: dialogMock },
        { provide: ExecutionStore, useValue: executionStoreMock },
        { provide: EquipmentPlanningService, useValue: equipmentPlanningMock },
        { provide: PlanningModificationsService, useValue: modificationsServiceMock },
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
      modificationsServiceMock,
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
    const pendingMod: PlanningModification = {
      id: 'mod-1',
      parameter: 'Elevación',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
      status: 'PENDIENTE',
      classification: 'acepta',
    };
    const { facade, dialogMock } = createSetup({ modifications: [pendingMod] });
    facade.initialize('trial-1');

    dialogMock.open.mockReturnValue({
      afterClosed: () => of<PlanningModificationBlockedDialogResult>({ action: 'close' }),
    });

    await facade.openModifyPlanning();

    expect(dialogMock.open).toHaveBeenCalledExactlyOnceWith(PlanningModificationBlockedDialog, { width: '520px' });
  });

  it('opens ModifyPlanningDialog fullscreen and refreshes data when accepted changes are returned', async () => {
    const { facade, dialogMock, executionStoreMock, equipmentPlanningMock } = createSetup({
      modifications: [],
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
        centerId: 'center-99',
        executedShotIds: ['shot-1'],
      }),
    });
    expect(executionStoreMock.setFireTrialId).toHaveBeenCalledWith('trial-1');
    expect(equipmentPlanningMock.load).toHaveBeenCalledWith('trial-1');
  });

  it('enables canViewModifications for client role and opens ClientModificationsDialog with review enabled', async () => {
    const { facade, dialogMock, executionStoreMock, equipmentPlanningMock } = createSetup({
      status: TrialStatus.IN_PROGRESS,
      roles: [Role.INTAQALAB_TRIAL_CONSULTANT],
      modifications: [],
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
    const acceptedMod: PlanningModification = {
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
      modifications: [acceptedMod],
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
