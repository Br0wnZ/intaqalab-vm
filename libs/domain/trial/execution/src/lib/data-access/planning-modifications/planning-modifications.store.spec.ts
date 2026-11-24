import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PlanningChange,
  PlanningModification,
  SubmitPlanningModificationsResponse,
} from './models/planning-modification.models';
import { PlanningModificationsService } from './planning-modifications.service';
import { PlanningModificationsStore } from './planning-modifications.store';

function createModification(overrides: Partial<PlanningModification> = {}): PlanningModification {
  return {
    id: 'mod-1',
    key: 'conditions:shot-2:elevation',
    parameter: 'elevation',
    action: 'Modificación',
    previousValue: 10,
    newValue: 20,
    affectedShots: ['D2'],
    status: 'BORRADOR',
    classification: 'none',
    ...overrides,
  };
}

function createMockService() {
  return {
    fetchModifications: vi.fn<() => Promise<PlanningModification[]>>().mockResolvedValue([]),
    submitModifications: vi.fn<() => Promise<SubmitPlanningModificationsResponse>>(),
    approveModification: vi.fn<() => Promise<PlanningModification>>(),
    rejectModification: vi.fn<() => Promise<PlanningModification>>(),
    saveDraft: vi.fn<() => Promise<PlanningModification[]>>().mockResolvedValue([]),
    updateClassification: vi.fn<() => Promise<PlanningModification>>(),
    applyChanges: vi.fn<() => Promise<PlanningChange[]>>().mockResolvedValue([]),
    loadChanges: vi.fn(),
    reloadChanges: vi.fn(),
    changesResource: {
      value: vi.fn().mockReturnValue([]),
      isLoading: vi.fn().mockReturnValue(false),
      error: vi.fn().mockReturnValue(null),
      reload: vi.fn(),
    },
  };
}

describe('PlanningModificationsStore', () => {
  let store: InstanceType<typeof PlanningModificationsStore>;
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    mockService = createMockService();

    TestBed.configureTestingModule({
      providers: [PlanningModificationsStore, { provide: PlanningModificationsService, useValue: mockService }],
    });

    store = TestBed.inject(PlanningModificationsStore);
  });

  it('initializes with empty state and canSave false', () => {
    expect(store.modifications()).toEqual([]);
    expect(store.hasPendingModifications()).toBe(false);
    expect(store.validationErrors()).toEqual([]);
    expect(store.isSaving()).toBe(false);
    expect(store.isValidating()).toBe(false);
    expect(store.canSave()).toBe(false);
    expect(store.draftModifications()).toEqual([]);
    expect(store.pendingModifications()).toEqual([]);
  });

  it('adds a draft modification and enables canSave', () => {
    const mod = createModification();
    store.addModification(mod);

    expect(store.modifications()).toEqual([mod]);
    expect(store.draftModifications()).toEqual([mod]);
    expect(store.canSave()).toBe(true);
  });

  it('updates an existing modification in place when key matches', () => {
    store.addModification(createModification({ id: 'mod-1', key: 'k1', newValue: 20 }));
    store.addModification(createModification({ id: 'mod-1', key: 'k1', newValue: 30 }));

    expect(store.modifications()).toHaveLength(1);
    expect(store.modifications()[0]?.newValue).toBe(30);
  });

  it('removes a modification by key or id', () => {
    store.addModification(createModification({ id: 'mod-1', key: 'k1' }));
    store.addModification(createModification({ id: 'mod-2', key: 'k2' }));

    store.removeModificationByKey('k1');
    expect(store.modifications().map((m) => m.id)).toEqual(['mod-2']);

    store.removeModificationByKey('mod-2');
    expect(store.modifications()).toEqual([]);
    expect(store.canSave()).toBe(false);
  });

  it('updates modification classification locally', () => {
    store.addModification(createModification({ id: 'mod-1', classification: 'none' }));
    store.updateClassification('mod-1', 'solicita');

    expect(store.modifications()[0]?.classification).toBe('solicita');
  });

  it('disables canSave when validationErrors are present', () => {
    store.addModification(createModification());
    store.setValidationErrors(['Missing required armament']);

    expect(store.canSave()).toBe(false);
  });

  it('loads modifications and computes hasPendingModifications', async () => {
    const loaded = [
      createModification({ id: 'm1', status: 'ACEPTADO' }),
      createModification({ id: 'm2', status: 'PENDIENTE', classification: 'solicita' }),
    ];
    mockService.fetchModifications.mockResolvedValueOnce(loaded);

    const result = await store.loadModifications('trial-1', 'center-1');

    expect(mockService.fetchModifications).toHaveBeenCalledWith('trial-1', 'center-1');
    expect(result).toEqual(loaded);
    expect(store.modifications()).toEqual(loaded);
    expect(store.hasPendingModifications()).toBe(true);
    expect(store.pendingModifications()).toHaveLength(1);
    expect(store.isLoading()).toBe(false);
  });

  it('checks pending modifications and returns false when none are pending', async () => {
    mockService.fetchModifications.mockResolvedValueOnce([createModification({ id: 'm1', status: 'ACEPTADO' })]);

    const hasPending = await store.checkHasPendingModifications('trial-1');

    expect(hasPending).toBe(false);
    expect(store.hasPendingModifications()).toBe(false);
  });

  it('validates and submits draft modifications, updating statuses and pending flag', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      centerId: 'center-1',
      modifications: [
        createModification({ id: 'm-old', status: 'ACEPTADO' }),
        createModification({ id: 'm-draft-1', key: 'k1', status: 'BORRADOR', classification: 'none' }),
        createModification({ id: 'm-draft-2', key: 'k2', status: 'BORRADOR', classification: 'acepta' }),
      ],
    });

    const submitResponse: SubmitPlanningModificationsResponse = {
      modifications: [
        createModification({ id: 'm-draft-1', status: 'ACEPTADO', classification: 'none' }),
        createModification({ id: 'm-draft-2', status: 'PENDIENTE', classification: 'acepta' }),
      ],
      acceptedCount: 1,
      pendingCount: 1,
    };
    mockService.submitModifications.mockResolvedValueOnce(submitResponse);

    const result = await store.validateAndSave(async () => []);

    expect(result).toEqual({
      modifications: [
        createModification({ id: 'm-old', status: 'ACEPTADO' }),
        createModification({ id: 'm-draft-1', status: 'ACEPTADO', classification: 'none' }),
        createModification({ id: 'm-draft-2', status: 'PENDIENTE', classification: 'acepta' }),
      ],
      acceptedCount: 1,
      pendingCount: 1,
    });
    expect(mockService.submitModifications).toHaveBeenCalledTimes(1);
    expect(store.draftModifications()).toEqual([]);
    expect(store.pendingModifications()).toHaveLength(1);
    expect(store.hasPendingModifications()).toBe(true);
    expect(store.isSaving()).toBe(false);
  });

  it('blocks submit when validator returns errors', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      modifications: [createModification({ id: 'm-draft-1', status: 'BORRADOR' })],
    });

    const result = await store.validateAndSave(async () => ['Invalid shot elevation']);

    expect(result).toBeNull();
    expect(store.validationErrors()).toEqual(['Invalid shot elevation']);
    expect(mockService.submitModifications).not.toHaveBeenCalled();
    expect(store.isValidating()).toBe(false);
  });

  it('approves a pending modification and clears hasPendingModifications when last pending resolves', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      centerId: 'center-1',
      modifications: [createModification({ id: 'mod-1', status: 'PENDIENTE', classification: 'solicita' })],
      hasPendingModifications: true,
    });

    const approved = createModification({ id: 'mod-1', status: 'ACEPTADO', classification: 'solicita' });
    mockService.approveModification.mockResolvedValueOnce(approved);

    const result = await store.approveModification('mod-1', 'Looks good');

    expect(mockService.approveModification).toHaveBeenCalledWith(
      'trial-1',
      'mod-1',
      { comment: 'Looks good' },
      'center-1',
    );
    expect(result).toEqual(approved);
    expect(store.modifications()[0]?.status).toBe('ACEPTADO');
    expect(store.hasPendingModifications()).toBe(false);
    expect(store.isSaving()).toBe(false);
  });

  it('rejects a pending modification and updates state', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      modifications: [createModification({ id: 'mod-1', status: 'PENDIENTE', classification: 'acepta' })],
      hasPendingModifications: true,
    });

    const rejected = createModification({ id: 'mod-1', status: 'RECHAZADO', classification: 'acepta' });
    mockService.rejectModification.mockResolvedValueOnce(rejected);

    const result = await store.rejectModification('mod-1', 'Rejected');

    expect(mockService.rejectModification).toHaveBeenCalledWith('trial-1', 'mod-1', { comment: 'Rejected' }, undefined);
    expect(result).toEqual(rejected);
    expect(store.modifications()[0]?.status).toBe('RECHAZADO');
    expect(store.hasPendingModifications()).toBe(false);
  });

  it('records error state when loadModifications fails', async () => {
    mockService.fetchModifications.mockRejectedValueOnce(new Error('Network failure'));

    const result = await store.loadModifications('trial-1');

    expect(result).toEqual([]);
    expect(store.error()).toBe('Network failure');
    expect(store.isLoading()).toBe(false);
  });

  it('applies draft planning changes via applyChanges', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      centerId: 'center-1',
    });

    const draftChange: PlanningChange = {
      id: 'ch-1',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: 'res-1',
      seriesId: null,
      shotId: null,
      field: 'temperature',
      operation: 'UPDATE',
      oldValue: '20',
      newValue: '22',
      status: 'DRAFT',
      requiresApproval: false,
      requestClient: false,
      createdBy: 'u1',
      createdAt: '2026-11-20T10:00:00Z',
      decidedBy: null,
      decidedAt: null,
    };

    mockService.changesResource.value.mockReturnValue([draftChange]);
    mockService.applyChanges.mockResolvedValueOnce([{ ...draftChange, status: 'ACCEPTED' }]);

    const result = await store.applyChanges();

    expect(mockService.applyChanges).toHaveBeenCalledWith(
      'trial-1',
      { changes: [{ id: 'ch-1', requiresApproval: false, requestClient: false }] },
      'center-1',
    );
    expect(result).toHaveLength(1);
    expect(mockService.reloadChanges).toHaveBeenCalledTimes(1);
  });

  it('validates and saves applying draft changes when draft changes exist', async () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      centerId: 'center-1',
    });

    const draftChange: PlanningChange = {
      id: 'ch-2',
      resourceType: 'MUNITION',
      resourceId: 'res-2',
      seriesId: null,
      shotId: null,
      field: 'projectileLot',
      operation: 'UPDATE',
      oldValue: 'A',
      newValue: 'B',
      status: 'DRAFT',
      requiresApproval: true,
      requestClient: false,
      createdBy: 'u1',
      createdAt: '2026-11-20T10:00:00Z',
      decidedBy: null,
      decidedAt: null,
    };

    mockService.changesResource.value.mockReturnValue([draftChange]);
    mockService.applyChanges.mockResolvedValueOnce([{ ...draftChange, status: 'PENDING' }]);

    const result = await store.validateAndSave();

    expect(result).toEqual({
      modifications: [],
      acceptedCount: 0,
      pendingCount: 1,
    });
    expect(mockService.applyChanges).toHaveBeenCalledWith(
      'trial-1',
      { changes: [{ id: 'ch-2', requiresApproval: true, requestClient: false }] },
      'center-1',
    );
    expect(mockService.reloadChanges).toHaveBeenCalledTimes(1);
  });

  it('resets state back to initial values', () => {
    patchState(unprotected(store), {
      fireTrialId: 'trial-1',
      modifications: [createModification()],
      hasPendingModifications: true,
      validationErrors: ['Some error'],
      error: 'Boom',
    });

    store.reset();

    expect(store.fireTrialId()).toBeNull();
    expect(store.modifications()).toEqual([]);
    expect(store.hasPendingModifications()).toBe(false);
    expect(store.validationErrors()).toEqual([]);
    expect(store.error()).toBeNull();
  });
});
