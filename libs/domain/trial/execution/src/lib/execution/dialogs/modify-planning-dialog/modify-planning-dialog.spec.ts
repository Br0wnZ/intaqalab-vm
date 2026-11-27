import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTabHarness } from '@angular/material/tabs/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { PlanningSeriesService } from '@intaqalab/data-access-planning';
import { type FireTrial, type TrialCreateModifyForm, TrialStatus } from '@intaqalab/models';
import {
  FeaturePlanningGeneralDataShellComponent,
  type PlanningFormSnapshotEvent,
  type PlanningShellMode,
} from '@intaqalab/planning';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ApplyPlanningChangesRequest,
  type CreatePlanningChangesRequest,
  PlanningChangesService,
  PlanningChangesStore,
} from '../../../data-access/planning-modifications';
import type { PlanningChange } from '../../models/planning-changes.models';
import { ModifyPlanningDialog } from './modify-planning-dialog';
import type { ModifyPlanningDialogData } from './modify-planning-dialog.models';

@Component({
  selector: 'inta-feature-planning-general-data-shell',
  template: '<div data-testid="planning-shell-stub">{{ mode() }}</div>',
})
class PlanningShellStub {
  readonly trial = input<TrialCreateModifyForm>();
  readonly trialId = input<FireTrial['id']>();
  readonly mode = input<PlanningShellMode>('planning');
  readonly executedShotIds = input<ReadonlyArray<string>>([]);
  readonly forcedReadonly = input(false);
  readonly planningFormChanged = output<PlanningFormSnapshotEvent>();
}

const mockTrial: TrialCreateModifyForm = {
  code: 'PT-2026-001',
  hasAssociatedTrial: false,
  hasLinkedTrial: false,
  associatedTrial: '',
  associatedTrialView: '',
  linkedTrial: '',
  linkedTrialView: '',
  description: 'Initial description',
  type: 'type-1',
  client: 'client-1',
  clientReference: 'REF-01',
  requestedDate: '2026-11-19',
  observations: '',
  status: TrialStatus.INTERRUPTED,
};

const defaultDialogData: ModifyPlanningDialogData = {
  fireTrialId: 'trial-123',
  fireTrial: mockTrial,
  executedShotIds: signal<ReadonlyArray<string>>(['shot-1']),
  executionProgressReady: signal(true),
};

const createdChange: PlanningChange = {
  id: 'change-1',
  resourceType: 'PLANNING_INFO',
  resourceId: 'trial-123',
  seriesId: null,
  shotId: null,
  field: 'goal',
  operation: 'UPDATE',
  oldValue: 'Initial goal',
  newValue: 'Updated goal',
  status: 'DRAFT',
  requiresApproval: false,
  requestClient: false,
  createdBy: 'user-1',
  createdAt: '2026-11-25T10:00:00Z',
  decidedBy: null,
  decidedAt: null,
};

function snapshots(goal = 'Updated goal', valid = true): PlanningFormSnapshotEvent[] {
  const baseline = {
    model: {
      goal: 'Initial goal',
      observations: '',
      requeriments: 'Requirements',
      additionalInfo: '',
      maxEmissionDates: 20,
      percentageTechnicalUnits: 40,
      percentageEndTrial: 60,
      daysSignReport: 1,
      hypochelometricReviewBefore: false,
      hypochelometricReviewAfter: false,
    },
    ratingCriteria: {},
    ratingCriteriaUnits: {},
  };
  const current = structuredClone(baseline);
  current.model.goal = goal;

  return [
    { section: 'general-data', baseline, current, valid },
    { section: 'series-and-shots', baseline: [], current: [], valid: true },
    {
      section: 'shooting-conditions',
      baseline: { series: [], units: {} },
      current: { series: [], units: {} },
      valid: true,
    },
    {
      section: 'munitions',
      baseline: { series: [], persistedConfigurationIds: [] },
      current: { series: [], persistedConfigurationIds: [] },
      valid: true,
    },
    { section: 'armament', baseline: [], current: [], valid: true },
    {
      section: 'measures',
      baseline: { series: [], seriesConfiguration: false },
      current: { series: [], seriesConfiguration: false },
      valid: true,
    },
  ];
}

describe('ModifyPlanningDialog', () => {
  type CreateMock = (fireTrialId: string, body: CreatePlanningChangesRequest) => Promise<PlanningChange[]>;
  type ApplyMock = (fireTrialId: string, body: ApplyPlanningChangesRequest) => Promise<PlanningChange[]>;

  let resource: ReturnType<typeof createMockResource<PlanningChange[]>>;
  let service: {
    resource: typeof resource;
    load: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn<CreateMock>>;
    apply: ReturnType<typeof vi.fn<ApplyMock>>;
  };
  let closeMock: ReturnType<typeof vi.fn>;
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let successMock: ReturnType<typeof vi.fn>;
  let errorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resource = createMockResource<PlanningChange[]>([]);
    service = {
      resource,
      load: vi.fn(),
      reload: vi.fn(),
      create: vi.fn<CreateMock>(),
      apply: vi.fn<ApplyMock>(),
    };
    closeMock = vi.fn();
    dialogMock = { open: vi.fn().mockReturnValue({ afterClosed: () => of(false) }) };
    successMock = vi.fn();
    errorMock = vi.fn();
  });

  const setup = async (data: ModifyPlanningDialogData = defaultDialogData) => {
    TestBed.overrideComponent(ModifyPlanningDialog, {
      remove: { imports: [FeaturePlanningGeneralDataShellComponent] },
      add: { imports: [PlanningShellStub] },
    });

    const view = await render(ModifyPlanningDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: PlanningChangesService, useValue: service },
        { provide: PlanningSeriesService, useValue: { seriesResource: createMockResource([]) } },
        { provide: ToastrService, useValue: { success: successMock, error: errorMock } },
        provideTranslateService(),
        provideTestingEnvironment(),
      ],
      componentProviders: [{ provide: MatDialog, useValue: dialogMock }],
    });
    return { view };
  };

  function sendSnapshots(instance: ModifyPlanningDialog, goal = 'Updated goal', valid = true): void {
    for (const event of snapshots(goal, valid)) instance.onPlanningFormChanged(event);
  }

  it('should load changes and embed planning shell in execution-modification mode', async () => {
    await setup();

    expect(service.load).toHaveBeenCalledWith('trial-123');
    expect(screen.getByTestId('planning-shell-stub')).toHaveTextContent('execution-modification');
    expect(screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TITLE_WITH_CODE')).toBeInTheDocument();
  });

  it('should display reference names from planning snapshots in existing remote changes', async () => {
    resource._setValue([
      { ...createdChange, resourceType: 'ARMAMENT', field: 'weaponExternalId', oldValue: '12', newValue: '19' },
    ]);
    const { view } = await setup();
    view.fixture.componentInstance.onPlanningFormChanged({
      section: 'armament',
      baseline: [{ shots: [{ armament: { weaponExternalId: '12', weaponName: 'Original weapon' } }] }],
      current: [],
      valueReferences: { weaponExternalId: [{ id: 19, name: 'Selected weapon' }] },
    });
    view.fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const tabs = await loader.getAllHarnesses(MatTabHarness);
    await tabs[1].select();

    expect(screen.getByRole('cell', { name: 'Original weapon' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Selected weapon' })).toBeInTheDocument();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('should keep shot forms locked until execution progress identifies executed shots', async () => {
    const executionProgressReady = signal(false);
    const executedShotIds = signal<ReadonlyArray<string>>([]);
    const { view } = await setup({
      ...defaultDialogData,
      executionProgressReady,
      executedShotIds,
    });
    const instance = view.fixture.componentInstance;

    expect(instance['isLocked']()).toBe(true);

    executedShotIds.set(['shot-1']);
    executionProgressReady.set(true);
    view.fixture.detectChanges();

    expect(instance['isLocked']()).toBe(false);
    expect(instance['executedShotIds']()).toEqual(['shot-1']);
  });

  it('should derive net changes from form snapshots and send wire string values', async () => {
    const { view } = await setup();
    const instance = view.fixture.componentInstance;
    sendSnapshots(instance);
    view.fixture.detectChanges();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(instance['canSave']()).toBe(true);
    const changesStore = view.fixture.debugElement.injector.get(PlanningChangesStore);
    expect(changesStore.fireTrialId()).toBe('trial-123');
    expect(changesStore.canSave()).toBe(true);
    expect(changesStore.savePhase()).toBe('idle');

    service.create.mockResolvedValue([createdChange]);
    service.apply.mockResolvedValue([
      { ...createdChange, status: 'ACCEPTED', decidedBy: 'user-1', decidedAt: '2026-11-25T10:01:00Z' },
    ]);
    await instance.onSaveChanges();
    expect(changesStore.error()).toBeNull();

    expect(service.create).toHaveBeenCalledWith('trial-123', {
      changes: [
        {
          resourceType: 'PLANNING_INFO',
          resourceId: 'trial-123',
          field: 'goal',
          operation: 'UPDATE',
          oldValue: 'Initial goal',
          newValue: 'Updated goal',
        },
      ],
    });
    expect(service.apply).toHaveBeenCalledWith('trial-123', {
      changes: [{ id: 'change-1', requiresApproval: false, requestClient: false }],
    });
    expect(successMock).toHaveBeenCalledOnce();
    expect(closeMock).not.toHaveBeenCalled();
  });

  it('should keep unsupported local changes visible and prevent them from being sent to the changes API', async () => {
    const { view } = await setup();
    const instance = view.fixture.componentInstance;
    sendSnapshots(instance, 'Initial goal');
    instance.onPlanningFormChanged({
      section: 'measures',
      baseline: {
        series: [{ id: 'series-1', topografia: [{ id: 'measure-1', minLimit: 1 }] }],
        seriesConfiguration: false,
      },
      current: {
        series: [{ id: 'series-1', topografia: [{ id: 'measure-1', minLimit: 2 }] }],
        seriesConfiguration: false,
      },
      valid: true,
    });
    view.fixture.detectChanges();

    const changesStore = view.fixture.debugElement.injector.get(PlanningChangesStore);
    expect(changesStore.validationErrors()).toContain(
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.UNSUPPORTED_CHANGES',
    );
    expect(instance['canSave']()).toBe(false);
    await instance.onSaveChanges();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('should lock editing when the loaded changes contain a pending item', async () => {
    resource._setValue([{ ...createdChange, id: 'pending-1', status: 'PENDING' }]);
    const { view } = await setup();
    const instance = view.fixture.componentInstance;
    sendSnapshots(instance);
    view.fixture.detectChanges();

    expect(instance['isLocked']()).toBe(true);
    expect(instance['canSave']()).toBe(false);
  });

  it('should request confirmation before discarding local form changes', async () => {
    const { view } = await setup();
    const instance = view.fixture.componentInstance;
    sendSnapshots(instance);
    dialogMock.open.mockReturnValue({ afterClosed: () => of(false) });
    await instance.onClose();
    expect(dialogMock.open).toHaveBeenCalledOnce();
    expect(closeMock).not.toHaveBeenCalled();

    dialogMock.open.mockReturnValue({ afterClosed: () => of(true) });
    await instance.onClose();
    expect(closeMock).toHaveBeenCalledWith({ saved: false, hasAcceptedChanges: false, hasPendingChanges: false });
  });
});
