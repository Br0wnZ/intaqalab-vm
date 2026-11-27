export type PlanningChangeResourceType =
  'PLANNING_INFO' | 'SHOT_CONDITIONS' | 'MUNITION' | 'MUNITION_COMPONENT' | 'ARMAMENT';

export type PlanningChangeStatus = 'DRAFT' | 'ACCEPTED' | 'PENDING' | 'REJECTED';

export type PlanningChangeOperation = 'UPDATE';

export type PlanningChangeSection =
  'general-data' | 'series-and-shots' | 'shooting-conditions' | 'munitions' | 'armament' | 'measures';

export type PlanningChangeValue = string | number | boolean | null | ReadonlyArray<string>;

export type PlanningChangeClassification = 'none' | 'requires-approval' | 'requested-by-client';

export type PlanningChangeLocalOnlyReason = 'EXECUTED_SHOT' | 'UNSUPPORTED_CONTRACT';

export type PlanningChangeLocalStatus = 'LOCAL_ONLY' | 'READY' | PlanningChangeStatus;

/** Local form diff. `resourceId` is absent until a persisted backend identity exists. */
export interface PlanningDetectedChange {
  id: string;
  key: string;
  section: PlanningChangeSection;
  resourceType: PlanningChangeResourceType | null;
  resourceId: string | null;
  field: string;
  parameter: string;
  operation: PlanningChangeOperation | 'ADD' | 'REMOVE';
  action: 'Alta' | 'Baja' | 'Modificación';
  previousValue: PlanningChangeValue;
  newValue: PlanningChangeValue;
  affectedShots: ReadonlyArray<string>;
  persistable: boolean;
  status: PlanningChangeLocalStatus;
  localOnlyReason?: PlanningChangeLocalOnlyReason;
  classification: PlanningChangeClassification;
  remoteId?: string;
  requiresApproval: boolean;
  requestClient: boolean;
}

/** Create DTO from `planning-changes-openapi.json`. Values are wire strings or null. */
export interface CreatePlanningChange {
  resourceType: PlanningChangeResourceType;
  resourceId: string;
  field: string;
  operation: PlanningChangeOperation;
  oldValue: string | null;
  newValue: string | null;
}

export interface CreatePlanningChangesRequest {
  changes: ReadonlyArray<CreatePlanningChange>;
}

export interface PlanningChange {
  id: string;
  resourceType: PlanningChangeResourceType;
  resourceId: string;
  seriesId: string | null;
  shotId: string | null;
  field: string;
  operation: PlanningChangeOperation;
  oldValue: string | null;
  newValue: string | null;
  status: PlanningChangeStatus;
  requiresApproval: boolean;
  requestClient: boolean;
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface PlanningChangeRow extends PlanningChange {
  section: PlanningChangeSection;
  selectedForApply: boolean;
}

export interface ApplyPlanningChange {
  id: string;
  requiresApproval: boolean;
  requestClient: boolean;
}

export interface ApplyPlanningChangesRequest {
  changes: ReadonlyArray<ApplyPlanningChange>;
}

export type PlanningChangesResponse = ReadonlyArray<PlanningChange>;

export type PlanningChangesSaveResult = {
  changes: PlanningChangesResponse;
  acceptedCount: number;
  pendingCount: number;
};
