import { TestBed } from '@angular/core/testing';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PlanningChange,
  PlanningChangeSection,
  PlanningDetectedChange,
} from '../../execution/models/planning-changes.models';
import { PlanningChangesService } from './planning-changes.service';
import { PlanningChangesStore } from './planning-changes.store';

const REQUIRED_SECTIONS: ReadonlyArray<PlanningChangeSection> = [
  'general-data',
  'series-and-shots',
  'shooting-conditions',
  'munitions',
  'armament',
  'measures',
];

const readyChange: PlanningDetectedChange = {
  id: 'PLANNING_INFO:trial-1:goal',
  key: 'PLANNING_INFO:trial-1:goal',
  section: 'general-data',
  resourceType: 'PLANNING_INFO',
  resourceId: 'trial-1',
  field: 'goal',
  parameter: 'goal',
  operation: 'UPDATE',
  action: 'Modificación',
  previousValue: 'Initial goal',
  newValue: 'Updated goal',
  affectedShots: [],
  persistable: true,
  status: 'READY',
  classification: 'none',
  requiresApproval: false,
  requestClient: false,
};

const createdChange: PlanningChange = {
  id: 'change-1',
  resourceType: 'PLANNING_INFO',
  resourceId: 'trial-1',
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

function makeServiceMock() {
  return {
    resource: createMockResource<PlanningChange[]>([]),
    load: vi.fn(),
    reload: vi.fn(),
    create: vi.fn<(trialId: string, request: unknown) => Promise<PlanningChange[]>>(),
    apply: vi.fn<(trialId: string, request: unknown) => Promise<PlanningChange[]>>(),
  };
}

describe('PlanningChangesStore', () => {
  let service: ReturnType<typeof makeServiceMock>;
  let store: InstanceType<typeof PlanningChangesStore>;

  beforeEach(() => {
    service = makeServiceMock();
    TestBed.configureTestingModule({
      providers: [PlanningChangesStore, { provide: PlanningChangesService, useValue: service }],
    });
    store = TestBed.inject(PlanningChangesStore);
    store.load('trial-1');
  });

  function markAllSectionsHydrated(): void {
    for (const section of REQUIRED_SECTIONS) {
      store.replaceSectionChanges(section, [], true);
    }
  }

  it('should block save until all form sections are hydrated', () => {
    store.replaceSectionChanges('general-data', [readyChange], true);

    expect(store.isReady()).toBe(false);
    expect(store.canEdit()).toBe(true);
    expect(store.canSave()).toBe(false);
  });

  it('should refuse to serialize changes that do not have a supported endpoint', () => {
    markAllSectionsHydrated();
    const localOnly: PlanningDetectedChange = {
      ...readyChange,
      id: 'measure-1',
      key: 'measure-1',
      section: 'measures',
      resourceType: null,
      resourceId: 'measure-1',
      persistable: false,
      status: 'LOCAL_ONLY',
    };
    store.replaceSectionChanges('measures', [localOnly], true);

    expect(store.hasUnpersistableChanges()).toBe(true);
    expect(store.validationErrors()).toContain('TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.UNSUPPORTED_CHANGES');
    expect(store.canSave()).toBe(false);
  });

  it('should report executed-shot restrictions separately from missing API contracts', () => {
    markAllSectionsHydrated();
    store.replaceSectionChanges(
      'shooting-conditions',
      [
        {
          ...readyChange,
          id: 'SHOT_CONDITIONS:shot-fired:elevation',
          key: 'SHOT_CONDITIONS:shot-fired:elevation',
          section: 'shooting-conditions',
          resourceType: 'SHOT_CONDITIONS',
          resourceId: 'shot-fired',
          field: 'elevation',
          localOnlyReason: 'EXECUTED_SHOT',
          persistable: false,
          status: 'LOCAL_ONLY',
          affectedShots: ['shot-fired'],
        },
      ],
      true,
    );

    expect(store.validationErrors()).toContain(
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.EXECUTED_SHOT_CHANGES',
    );
    expect(store.validationErrors()).not.toContain(
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.UNSUPPORTED_CHANGES',
    );
  });

  it('should create and apply a single typed change using the returned remote id', async () => {
    markAllSectionsHydrated();
    store.replaceSectionChanges('general-data', [readyChange], true);
    service.create.mockResolvedValue([createdChange]);
    service.apply.mockResolvedValue([{ ...createdChange, status: 'ACCEPTED', decidedBy: 'user-1' }]);

    const result = await store.save();

    expect(service.create).toHaveBeenCalledWith('trial-1', {
      changes: [
        {
          resourceType: 'PLANNING_INFO',
          resourceId: 'trial-1',
          field: 'goal',
          operation: 'UPDATE',
          oldValue: 'Initial goal',
          newValue: 'Updated goal',
        },
      ],
    });
    expect(service.apply).toHaveBeenCalledWith('trial-1', {
      changes: [{ id: 'change-1', requiresApproval: false, requestClient: false }],
    });
    expect(result?.acceptedCount).toBe(1);
    expect(store.localChanges()).toEqual([]);
    expect(service.reload).toHaveBeenCalledOnce();
  });

  it('should retry a failed apply without creating duplicate drafts', async () => {
    markAllSectionsHydrated();
    store.replaceSectionChanges('general-data', [readyChange], true);
    service.create.mockResolvedValue([createdChange]);
    service.apply
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ ...createdChange, status: 'ACCEPTED', decidedBy: 'user-1' }]);

    expect(await store.save()).toBeNull();
    expect(store.savePhase()).toBe('recovery-required');
    expect(service.create).toHaveBeenCalledOnce();

    const result = await store.retryApply();

    expect(result?.acceptedCount).toBe(1);
    expect(service.create).toHaveBeenCalledOnce();
    expect(service.apply).toHaveBeenCalledTimes(2);
  });

  it('should apply only explicitly selected remote drafts without creating new changes', async () => {
    service.resource._setValue([createdChange]);
    markAllSectionsHydrated();
    store.toggleRemoteApply('change-1', true);
    store.updateClassification('change-1', 'solicita');
    service.apply.mockResolvedValue([{ ...createdChange, status: 'PENDING', requestClient: true, decidedBy: null }]);

    expect(store.canSave()).toBe(true);
    const result = await store.save();

    expect(service.create).not.toHaveBeenCalled();
    expect(service.apply).toHaveBeenCalledWith('trial-1', {
      changes: [{ id: 'change-1', requiresApproval: false, requestClient: true }],
    });
    expect(result?.pendingCount).toBe(1);
    expect(store.hasPendingChanges()).toBe(true);
  });

  it('should retain only unprocessed change ids after a partial apply response', async () => {
    markAllSectionsHydrated();
    const secondLocalChange: PlanningDetectedChange = {
      ...readyChange,
      id: 'PLANNING_INFO:trial-1:observations',
      key: 'PLANNING_INFO:trial-1:observations',
      field: 'observations',
      parameter: 'observations',
      previousValue: 'Old notes',
      newValue: 'New notes',
    };
    const secondCreatedChange: PlanningChange = {
      ...createdChange,
      id: 'change-2',
      field: 'observations',
      oldValue: 'Old notes',
      newValue: 'New notes',
    };
    store.replaceSectionChanges('general-data', [readyChange, secondLocalChange], true);
    service.create.mockResolvedValue([createdChange, secondCreatedChange]);
    service.apply
      .mockResolvedValueOnce([{ ...createdChange, status: 'ACCEPTED', decidedBy: 'user-1' }])
      .mockResolvedValueOnce([{ ...secondCreatedChange, status: 'ACCEPTED', decidedBy: 'user-1' }]);

    await store.save();

    expect(store.savePhase()).toBe('recovery-required');
    expect(store.createdChanges().map((change) => change.id)).toEqual(['change-2']);
    expect(store.localChanges().map((change) => change.field)).toEqual(['observations']);

    const retried = await store.retryApply();
    expect(retried?.acceptedCount).toBe(1);
    expect(service.create).toHaveBeenCalledOnce();
    expect(service.apply).toHaveBeenCalledTimes(2);
    expect(service.apply).toHaveBeenLastCalledWith('trial-1', {
      changes: [{ id: 'change-2', requiresApproval: false, requestClient: false }],
    });
  });
});
