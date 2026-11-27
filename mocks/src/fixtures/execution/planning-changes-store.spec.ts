import { describe, expect, it } from 'vitest';

import { applyPlanningChanges, createPlanningChanges, getPlanningChanges } from './planning-changes-store';

describe('planning changes fixture store', () => {
  it('should preserve configuration and armament resource IDs without replacing them with shot IDs', () => {
    const created = createPlanningChanges('trial-resource-identities', [
      {
        resourceType: 'MUNITION',
        resourceId: 'configuration-2',
        field: 'batch',
        operation: 'UPDATE',
        oldValue: 'A',
        newValue: 'B',
      },
      {
        resourceType: 'ARMAMENT',
        resourceId: 'armament-2',
        field: 'observations',
        operation: 'UPDATE',
        oldValue: 'Original',
        newValue: 'Updated',
      },
    ]);

    expect(
      created?.map((change) => ({
        resourceType: change.resourceType,
        resourceId: change.resourceId,
        shotId: change.shotId,
      })),
    ).toEqual([
      { resourceType: 'MUNITION', resourceId: 'configuration-2', shotId: null },
      { resourceType: 'ARMAMENT', resourceId: 'armament-2', shotId: null },
    ]);
  });

  it('should atomically create draft field changes with the supplied resource identity and old/new values', () => {
    const trialId = 'trial-create-atomic';
    const created = createPlanningChanges(trialId, [
      {
        resourceType: 'PLANNING_INFO',
        resourceId: trialId,
        field: 'goal',
        operation: 'UPDATE',
        oldValue: 'Initial',
        newValue: 'Updated',
      },
      {
        resourceType: 'SHOT_CONDITIONS',
        resourceId: 'shot-1',
        field: 'elevation',
        operation: 'UPDATE',
        oldValue: '10',
        newValue: '12.3456789',
      },
    ]);

    expect(created).toHaveLength(2);
    expect(created?.[0]).toMatchObject({
      resourceType: 'PLANNING_INFO',
      resourceId: trialId,
      field: 'goal',
      oldValue: 'Initial',
      newValue: 'Updated',
      status: 'DRAFT',
    });
    expect(created?.[1]).toMatchObject({
      resourceType: 'SHOT_CONDITIONS',
      resourceId: 'shot-1',
      shotId: 'shot-1',
      field: 'elevation',
      oldValue: '10',
      newValue: '12.3456789',
      status: 'DRAFT',
    });
    expect(getPlanningChanges(trialId)).toHaveLength(2);
  });

  it('should reject duplicate resource-field entries without partially creating the batch', () => {
    const trialId = 'trial-duplicate-fields';
    const duplicate = {
      resourceType: 'PLANNING_INFO' as const,
      resourceId: trialId,
      field: 'goal',
      operation: 'UPDATE' as const,
      oldValue: 'Initial',
      newValue: 'Updated',
    };

    expect(createPlanningChanges(trialId, [duplicate, { ...duplicate, newValue: 'Another value' }])).toBeNull();
    expect(getPlanningChanges(trialId)).toEqual([]);
  });

  it('should process only selected draft ids and return accepted or pending status from classification', () => {
    const trialId = 'trial-apply-selection';
    const created = createPlanningChanges(trialId, [
      {
        resourceType: 'PLANNING_INFO',
        resourceId: trialId,
        field: 'goal',
        operation: 'UPDATE',
        oldValue: 'Initial',
        newValue: 'Accepted',
      },
      {
        resourceType: 'PLANNING_INFO',
        resourceId: trialId,
        field: 'observations',
        operation: 'UPDATE',
        oldValue: 'Old notes',
        newValue: 'Pending notes',
      },
    ]);
    const first = created?.[0];
    const second = created?.[1];
    if (!first || !second) throw new Error('Expected created changes');

    const processed = applyPlanningChanges(trialId, [
      { id: first.id, requiresApproval: false, requestClient: false },
      { id: second.id, requiresApproval: false, requestClient: true },
    ]);

    expect(processed.map((change) => change.status)).toEqual(['ACCEPTED', 'PENDING']);
  });
});
