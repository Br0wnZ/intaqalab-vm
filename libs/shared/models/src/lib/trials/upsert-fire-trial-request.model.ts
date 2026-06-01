export type UpsertFireTrial = {
  associatedTrialId?: string;
  linkedTrialId?: string;
  description?: string;
  fireTrialTypeId: string;
  clientId: string;
  clientReference?: string;
  requestedDate?: string;
  observations?: string;
};
