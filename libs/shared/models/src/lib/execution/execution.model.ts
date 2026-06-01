export type ExecutionStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'INTERRUPTED'
  | 'PAUSED'
  | 'CANCELED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

export interface TransitionWithReasonRequest {
  reason: string;
}

export interface ExecutionFinishResponse {
  finishedAt: string;
}

/** Acciones de transición de estado para un FireTrial en gestión */
export type TrialTransitionAction = 'cancel' | 'void' | 'close' | 'reopen' | 'reactivate' | 'delete';
