import type {
  ApplyPlanningChangesRequest,
  CreatePlanningChangesRequest,
  PlanningChange,
  PlanningChangeValue,
  PlanningDetectedChange,
} from '../../execution/models/planning-changes.models';

export function serializePlanningChangeValue(value: PlanningChangeValue): string | null {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Planning changes require finite numeric values');
    }
    return String(value);
  }
  return JSON.stringify(value) ?? '[]';
}

export function toCreatePlanningChangesRequest(
  changes: ReadonlyArray<PlanningDetectedChange>,
): CreatePlanningChangesRequest {
  if (changes.length === 0) {
    throw new Error('Cannot create an empty planning-changes batch');
  }

  return {
    changes: changes.map((change) => {
      if (!change.persistable || !change.resourceType || !change.resourceId || change.operation !== 'UPDATE') {
        throw new Error(`Planning change ${change.key} cannot be serialized by the current API`);
      }

      return {
        resourceType: change.resourceType,
        resourceId: change.resourceId,
        field: change.field,
        operation: 'UPDATE',
        oldValue: serializePlanningChangeValue(change.previousValue),
        newValue: serializePlanningChangeValue(change.newValue),
      };
    }),
  };
}

export function toApplyPlanningChangesRequest(
  createdChanges: ReadonlyArray<PlanningChange>,
  localChanges: ReadonlyArray<PlanningDetectedChange>,
): ApplyPlanningChangesRequest {
  const byIdentity = new Map(
    localChanges.map((change) => [`${change.resourceType}:${change.resourceId}:${change.field}`, change]),
  );

  return {
    changes: createdChanges.map((created) => {
      const local = byIdentity.get(`${created.resourceType}:${created.resourceId}:${created.field}`);
      if (!local) {
        throw new Error(`Created planning change ${created.id} does not match local edit`);
      }
      if (local.requiresApproval && local.requestClient) {
        throw new Error(`Planning change ${local.key} cannot request approval and client review together`);
      }
      return {
        id: created.id,
        requiresApproval: local.requiresApproval,
        requestClient: local.requestClient,
      };
    }),
  };
}
