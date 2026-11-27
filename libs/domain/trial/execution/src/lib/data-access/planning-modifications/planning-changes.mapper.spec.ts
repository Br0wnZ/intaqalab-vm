import { describe, expect, it } from 'vitest';

import type { PlanningDetectedChange } from '../../execution/models/planning-changes.models';
import {
  serializePlanningChangeValue,
  toApplyPlanningChangesRequest,
  toCreatePlanningChangesRequest,
} from './planning-changes.mapper';

function makeChange(overrides: Partial<PlanningDetectedChange> = {}): PlanningDetectedChange {
  return {
    id: 'key-1',
    key: 'key-1',
    section: 'general-data',
    resourceType: 'PLANNING_INFO',
    resourceId: 'trial-1',
    field: 'goal',
    parameter: 'goal',
    operation: 'UPDATE',
    action: 'Modificación',
    previousValue: 'Old',
    newValue: 'New',
    affectedShots: [],
    persistable: true,
    status: 'READY',
    classification: 'none',
    requiresApproval: false,
    requestClient: false,
    ...overrides,
  };
}

describe('planning changes mapper', () => {
  it('should serialize exact scalar values as canonical wire strings', () => {
    expect(serializePlanningChangeValue(3.456789)).toBe('3.456789');
    expect(serializePlanningChangeValue(false)).toBe('false');
    expect(serializePlanningChangeValue(null)).toBeNull();
    expect(serializePlanningChangeValue(['id-1', 'id-2'])).toBe('["id-1","id-2"]');
  });

  it('should build create requests with oldValue and newValue even when either is null', () => {
    expect(toCreatePlanningChangesRequest([makeChange({ previousValue: null, newValue: null })])).toEqual({
      changes: [
        {
          resourceType: 'PLANNING_INFO',
          resourceId: 'trial-1',
          field: 'goal',
          operation: 'UPDATE',
          oldValue: null,
          newValue: null,
        },
      ],
    });
  });

  it('should reject local-only changes and empty create batches', () => {
    expect(() => toCreatePlanningChangesRequest([makeChange({ persistable: false, resourceType: null })])).toThrow(
      'cannot be serialized',
    );
    expect(() => toCreatePlanningChangesRequest([])).toThrow('empty planning-changes batch');
  });

  it('should apply remote ids and mutually exclusive classification flags', () => {
    expect(
      toApplyPlanningChangesRequest(
        [
          {
            id: 'remote-1',
            resourceType: 'PLANNING_INFO',
            resourceId: 'trial-1',
            seriesId: null,
            shotId: null,
            field: 'goal',
            operation: 'UPDATE',
            oldValue: 'Old',
            newValue: 'New',
            status: 'DRAFT',
            requiresApproval: false,
            requestClient: false,
            createdBy: 'user-1',
            createdAt: '2026-11-25T10:00:00Z',
            decidedBy: null,
            decidedAt: null,
          },
        ],
        [makeChange({ requiresApproval: true })],
      ),
    ).toEqual({ changes: [{ id: 'remote-1', requiresApproval: true, requestClient: false }] });
  });
});
