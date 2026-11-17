import type { FireTrialClient } from '@intaqalab/models';

export type AssociatedTrialForm = {
  year: string | null;
  clientId: FireTrialClient['id'];
  searchTerm: string;
  trialId: string;
};
