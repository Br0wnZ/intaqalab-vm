import type { TrialStatus } from './trial-status.enum';

export type FireTrialScheduleItem = {
  date: string;
  lineOfShootId: string;
};

export type FireTrial = {
  id: string;
  centerId: string;
  trialNumber: string;
  status: TrialStatus;
  statusReason?: string;
  linkedTrial?: LinkedTrial;
  associatedTrial?: AssociatedTrial;
  fireTrialType?: FireTrialType;
  client?: FireTrialClient;
  clientReference?: string;
  requestedDate?: string;
  description?: string;
  observations?: string;
  schedule?: FireTrialScheduleItem[];
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  validated?: boolean;
  planningUsers?: { id: string; fullname: string; username: string }[];
};

export type FireTrialType = {
  id: string;
  name: string;
  label?: string;
  active?: boolean;
};

export type LinkedTrial = {
  id: string;
  trialNumber: string;
  description: string;
};

export type AssociatedTrial = {
  id: string;
  trialNumber: string;
  description: string;
};

export type FireTrialClient = {
  id: string;
  name: string;
};
