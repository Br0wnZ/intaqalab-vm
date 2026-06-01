import type { TrialStatus } from '@intaqalab/models';

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
  statusReason?: string;
}
