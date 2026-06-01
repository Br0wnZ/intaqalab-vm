import type { TrialStatus } from './trial-status.enum';

export interface TrialCreateModifyForm {
  code?: string;
  hasAssociatedTrial: boolean;
  hasLinkedTrial: boolean;
  associatedTrial: string;
  associatedTrialView: string;
  linkedTrial: string;
  linkedTrialView: string;
  description: string;
  type: string;
  client: string;
  clientReference: string;
  requestedDate: string;
  observations: string;
  status: TrialStatus;
}
