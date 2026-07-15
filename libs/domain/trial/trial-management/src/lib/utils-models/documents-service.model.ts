import type { DocumentSubtype } from '@intaqalab/models';

export type DocumentStatus = 'ALL' | 'ACTIVE' | 'OBSOLETE';
export type DocumentCategory = 'GENERAL' | 'SPECIFIC';

export type FireTrialDocument = {
  id: string;
  name: string;
  fileName?: string;
  category: DocumentCategory;
  type: DocumentSubtype;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentsResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: FireTrialDocument[];
};

export type DocumentsQueryParams = {
  type?: string;
  status?: DocumentStatus;
  page?: number;
  pageSize?: number;
  sort?: string[];
};

export type GetDocumentsParams = {
  fireTrialId: string;
  filters?: DocumentsQueryParams;
};

export type UploadDocumentParams = {
  fireTrialId: string;
  file: File;
  name: string;
  documentTypeId: string;
  category: DocumentCategory;
};

export type UploadNewDocumentVersionParams = {
  documentId: string;
  file: File;
};

export type DeleteDocumentParams = {
  fireTrialId: string;
  documentId: string;
};

export type DocumentTypesResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: DocumentSubtype[];
};

export type DocumentVersion = {
  id: string;
  versionTag: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
};

export type DocumentDetail = {
  id: string;
  centerId: string;
  name: string;
  category: DocumentCategory;
  type: Type;
  versions: Version[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Version = {
  id: string;
  versionTag: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
};

export type Type = {
  id: string;
  name: Name;
  label: string;
  active: boolean;
  category: string;
};

interface Name {
  es: string;
  en: string;
}

export type GetDocumentDetailParams = {
  documentId: string;
};

export type SetDocumentVersionActiveParams = {
  documentId: string;
  versionId: string;
};

export type UpdateDocumentInfoParams = {
  documentId: string;
  name: string;
  category: DocumentCategory;
  typeId: string;
};

export type DocumentObservations = {
  id: string;
  description: string;
  createdBy: string;
  createdAt: string;
}[];

export type FireTrialLink = {
  id?: string;
  trialNumber: string;
  createdByUsername: string;
  createdAt: string;
};

export type DocumentFireTrialSync = FireTrialLink[];

export type AssociateDocToExistingTrialRequest = {
  documentId: string;
  fireTrialIds: string[];
};

export type CenterDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
  type: DocumentSubtype;
  activeVersion: string;
  updatedAt: string;
};

export type CenterDocumentsResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: CenterDocument[];
};

export type CenterDocumentsQueryParams = {
  category?: DocumentCategory;
  typeId?: string;
  page?: number;
  pageSize?: number;
  sort?: string[];
};

export type GetCenterDocumentsParams = {
  filters?: CenterDocumentsQueryParams;
};

export type DocumentTypeI18nName = Record<string, string>;

export type DocumentTypeCreateRequest = {
  name: DocumentTypeI18nName;
  active?: boolean;
  category: DocumentCategory;
};

export type UpdateDocumentTypeParams = {
  documentTypeId: string;
  name: DocumentTypeI18nName;
  active?: boolean;
  category: DocumentCategory;
};

export type DeleteDocumentTypeParams = {
  documentTypeId: string;
};

export type DocumentObservationItem = {
  id: string;
  description: string;
  createdBy: string;
  createdAt: string;
};

export type CreateObservationParams = {
  documentId: string;
  description: string;
};

export type UpdateObservationParams = {
  documentId: string;
  observationId: string;
  description: string;
};

export type DeleteObservationParams = {
  documentId: string;
  observationId: string;
};
