export type PaginatedApiResponse<T> = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
};

export interface RequestPaginationParams {
  pageSize: number;
  page: number;
}

export type DictionaryResponses<T> = {
  id: string;
  response: T;
}[];

export type FireTrial = {
  id: string;
  centerId: string;
  trialNumber: string;
  status: string;
  statusReason: string;
  linkedTrial: LinkedTrial;
  associatedTrial: LinkedTrial;
  fireTrialType: FireTrialType;
  client: FireTrialType;
  clientReference: string;
  requestedDate: string;
  description: string;
  observations: string;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
};

interface FireTrialType {
  id: string;
  name: string;
}

interface LinkedTrial {
  id: string;
  trialNumber: string;
  description: string;
}

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
