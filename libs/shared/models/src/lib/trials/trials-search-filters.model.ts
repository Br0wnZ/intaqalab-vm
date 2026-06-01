import type { TrialStatus } from './trial-status.enum';
import type { FireTrial, FireTrialClient, FireTrialType } from './trial.model';

export type TrialSearchFilters = {
  trialNumber: FireTrial['trialNumber'];
  year?: string;
  clientId: FireTrialClient['id'];
  description: string;
  status: TrialStatus[];
  fireTrialTypeId: FireTrialType['id'];
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
};
