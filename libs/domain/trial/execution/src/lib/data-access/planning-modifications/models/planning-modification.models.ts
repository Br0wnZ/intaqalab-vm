export type ModificationAction = 'Alta' | 'Baja' | 'Modificación';

export type ModificationStatus = 'BORRADOR' | 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export type ModificationClassification = 'acepta' | 'solicita' | 'none';

export type PlanningConditionsRevision = 'current' | 'baseline';

export interface PlanningModificationTarget {
  fireTrialId: string;
  centerId?: string;
}

export interface PlanningModification {
  id: string;
  parameter: string;
  action: ModificationAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
  status: ModificationStatus;
  classification: ModificationClassification;
  key?: string;
  updatedAt?: string;
  comment?: string;
}

export interface PlanningModificationEvent {
  key: string;
  parameter: string;
  action: ModificationAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
}

export interface PlanningModificationDraftItem {
  id?: string;
  parameter: string;
  action: ModificationAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
  classification: ModificationClassification;
}

export interface SavePlanningModificationsRequest {
  modifications: PlanningModificationDraftItem[];
}

export interface UpdateModificationClassificationRequest {
  classification: ModificationClassification;
}

export interface SubmitPlanningModificationsRequest {
  modifications: PlanningModificationDraftItem[];
}

export interface SubmitPlanningModificationsResponse {
  modifications: PlanningModification[];
  acceptedCount: number;
  pendingCount: number;
}

export interface ReviewModificationRequest {
  comment?: string;
}

// --- Planning Changes (GET /planning/changes) ---

export type PlanningChangeResourceType =
  | 'PLANNING_INFO'
  | 'SHOT_CONDITIONS'
  | 'MUNITION'
  | 'MUNITION_COMPONENT'
  | 'ARMAMENT';

export type PlanningChangeStatus = 'DRAFT' | 'ACCEPTED' | 'PENDING' | 'REJECTED';

export type PlanningChangeOperation = 'UPDATE';

export interface PlanningChange {
  id: string;
  resourceType: PlanningChangeResourceType;
  resourceId: string;
  seriesId: string | null;
  shotId: string | null;
  field: string;
  parameter?: string;
  operation: PlanningChangeOperation;
  oldValue: string | null;
  newValue: string | null;
  affectedShots?: string[] | null;
  status: PlanningChangeStatus;
  requiresApproval: boolean;
  requestClient: boolean;
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export type PlanningChangesResponse = PlanningChange[];

export interface ApplyChangeItem {
  id: string;
  requiresApproval: boolean;
  requestClient: boolean;
}

export interface ApplyChangesRequest {
  changes: ApplyChangeItem[];
}
