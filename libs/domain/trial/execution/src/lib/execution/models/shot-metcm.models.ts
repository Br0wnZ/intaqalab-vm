export interface ShotMetcmResponse {
  metcmData: {
    blockText: string;
  };
}

export interface FireTrialMetcmDocumentsResponse {
  items: Array<{
    id: string;
    type: { id: string };
    status: 'ACTIVE' | 'OBSOLETE';
  }>;
  page: number;
  pageSize: number;
  totalElements: number;
}
