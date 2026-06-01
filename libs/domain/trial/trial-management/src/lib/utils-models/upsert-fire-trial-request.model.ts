import type { AssociatedTrial, FireTrial, FireTrialClient, FireTrialType, LinkedTrial } from '@intaqalab/models';

export type UpsertFireTrial = {
  associatedTrialId?: AssociatedTrial['id'];
  linkedTrialId?: LinkedTrial['id'];
  description?: FireTrial['description'];
  fireTrialTypeId: FireTrialType['id'];
  clientId: FireTrialClient['id'];
  clientReference?: FireTrial['clientReference'];
  requestedDate?: FireTrial['requestedDate'];
  observations?: FireTrial['observations'];
};
