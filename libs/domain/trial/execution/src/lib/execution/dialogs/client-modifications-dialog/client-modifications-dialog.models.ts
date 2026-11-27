export type ClientModificationFilter = 'ALL' | 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';

export interface ClientModificationsDialogData {
  fireTrialId: string;
  centerId?: string;
  allowReview?: boolean;
}

export interface ClientModificationsDialogResult {
  hasAcceptedChanges: boolean;
  hasDecisions: boolean;
}

export interface PlanningModificationBlockedDialogData {
  allowViewPending?: boolean;
}

export type PlanningModificationBlockedDialogResult = { action: 'close' } | { action: 'viewPending' };
