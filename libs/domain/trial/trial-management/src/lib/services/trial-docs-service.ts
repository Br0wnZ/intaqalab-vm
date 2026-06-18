import { HttpClient, HttpContext, type HttpStatusCode, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SKIP_CENTER_INTERCEPTOR, injectDocumentsEndpoint } from '@intaqalab/config';
import { TOAST_FEEDBACK } from '@intaqalab/config';

import type {
  AssociateDocToExistingTrialRequest,
  CenterDocumentsQueryParams,
  CenterDocumentsResponse,
  CreateObservationParams,
  DeleteDocumentParams,
  DeleteDocumentTypeParams,
  DeleteObservationParams,
  DocumentCategory,
  DocumentDetail,
  DocumentFireTrialSync,
  DocumentObservationItem,
  DocumentObservations,
  DocumentTypeCreateRequest,
  DocumentTypesResponse,
  DocumentVersion,
  DocumentsQueryParams,
  DocumentsResponse,
  GetCenterDocumentsParams,
  GetDocumentDetailParams,
  GetDocumentsParams,
  SetDocumentVersionActiveParams,
  UpdateDocumentInfoParams,
  UpdateDocumentTypeParams,
  UpdateObservationParams,
  UploadDocumentParams,
  UploadNewDocumentVersionParams,
} from '../utils-models/documents-service.model';

@Injectable({
  providedIn: 'root',
})
export class TrialDocsService {
  readonly #httpClient = inject(HttpClient);

  readonly #documentsParams = signal<GetDocumentsParams | null>(null);
  readonly #uploadParams = signal<UploadDocumentParams | null>(null);
  readonly #deleteParams = signal<(DeleteDocumentParams & { _version: number }) | null>(null);
  #deleteVersion = 0;
  readonly #deleteAssociatedDocumentParams = signal<GetDocumentDetailParams | null>(null);
  readonly #documentDetailParams = signal<GetDocumentDetailParams | null>(null);
  readonly #documentObservationsParams = signal<GetDocumentDetailParams | null>(null);
  readonly #documentVersionsParams = signal<GetDocumentDetailParams | null>(null);
  readonly #updateDocumentVersionsParams = signal<SetDocumentVersionActiveParams | null>(null);
  readonly #updateDocumentInfoParams = signal<UpdateDocumentInfoParams | null>(null);
  readonly #documentAssociatedTrialsParams = signal<GetDocumentDetailParams | null>(null);
  readonly #associateDocToExistingTrialParams = signal<AssociateDocToExistingTrialRequest | null>(null);
  readonly #newDocumentVersionParams = signal<UploadNewDocumentVersionParams | null>(null);
  readonly #downloadDocumentParams = signal<GetDocumentDetailParams | null>(null);
  readonly #viewDocumentParams = signal<GetDocumentDetailParams | null>(null);
  readonly #typesRefreshTrigger = signal<number>(0);
  readonly #centerDocumentsParams = signal<GetCenterDocumentsParams | null>(null);
  readonly #createDocumentTypeParams = signal<DocumentTypeCreateRequest | null>(null);
  readonly #updateDocumentTypeParams = signal<UpdateDocumentTypeParams | null>(null);
  readonly #deleteDocumentTypeParams = signal<DeleteDocumentTypeParams | null>(null);
  readonly #createObservationParams = signal<CreateObservationParams | null>(null);
  readonly #updateObservationParams = signal<UpdateObservationParams | null>(null);
  readonly #deleteObservationParams = signal<DeleteObservationParams | null>(null);

  readonly #documentsUrl = injectDocumentsEndpoint();
  readonly #fireTrialId = signal<string | null>(null);
  readonly fireTrialId = this.#fireTrialId.asReadonly();

  setFireTrialId(fireTrialId: string): void {
    this.#fireTrialId.set(fireTrialId);
  }

  readonly documentsResource = httpResource<DocumentsResponse>(() => {
    const params = this.#documentsParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params.filters, true);
    const encodedTrialId = encodeURIComponent(params.fireTrialId);

    return {
      url: `${this.#documentsUrl}/fire-trials/${encodedTrialId}/documents${queryParams}`,
    };
  });

  readonly documentDetailResource = httpResource<DocumentDetail>(() => {
    const params = this.#documentDetailParams();
    const fireTrialId = this.#fireTrialId();
    if (!params || !fireTrialId) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}`,
      method: 'GET',
    };
  });

  readonly documentObservationsResource = httpResource<DocumentObservations>(() => {
    const params = this.#documentObservationsParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/observations`,
      method: 'GET',
    };
  });

  readonly documentVersionsResource = httpResource<DocumentVersion[]>(() => {
    const params = this.#documentVersionsParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/versions`,
      method: 'GET',
    };
  });

  readonly documentAssociatedTrialsResource = httpResource<DocumentFireTrialSync>(() => {
    const params = this.#documentAssociatedTrialsParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/fire-trials`,
      method: 'GET',
    };
  });

  readonly associateDocResource = httpResource(() => {
    const params = this.#associateDocToExistingTrialParams();

    if (!params) return undefined;

    const { documentId, ...body } = params;

    return {
      url: `${this.#documentsUrl}/documents/${documentId}/fire-trials`,
      method: 'PUT',
      body,
    };
  });

  readonly setDocumentVersionActiveResource = httpResource<DocumentVersion[]>(() => {
    const params = this.#updateDocumentVersionsParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/versions/${params.versionId}/set-active`,
      method: 'POST',
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.VERSION_SET_ACTIVE_SUCCESS' }),
    };
  });

  readonly updateDocumentInfoResource = httpResource<DocumentDetail>(() => {
    const params = this.#updateDocumentInfoParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}`,
      method: 'PUT',
      body: {
        name: params.name,
        category: params.category,
        typeId: params.typeId,
      },
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.UPDATE_SUCCESS' }),
    };
  });

  readonly uploadDocumentResource = httpResource(() => {
    const params = this.#uploadParams();
    if (!params) return undefined;

    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('documentTypeId', params.documentTypeId);
    formData.append('category', params.category);
    formData.append('name', params.name);
    const encodedTrialId = encodeURIComponent(params.fireTrialId);

    return {
      url: `${this.#documentsUrl}/fire-trials/${encodedTrialId}/documents`,
      method: 'POST',
      body: formData,
      reportProgress: true,
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.UPLOAD_SUCCESS' }),
    };
  });

  readonly uploadNewDocumentVersionResource = httpResource(() => {
    const params = this.#newDocumentVersionParams();
    if (!params) return undefined;

    const formData = new FormData();
    formData.append('file', params.file);

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/versions`,
      method: 'POST',
      body: formData,
      reportProgress: true,
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.UPLOAD_NEW_VERSION_SUCCESS' }),
    };
  });

  readonly deleteDocumentResource = httpResource<{ code: HttpStatusCode }>(() => {
    const params = this.#deleteParams();
    if (!params) return undefined;

    const encodedTrialId = encodeURIComponent(params.fireTrialId);

    return {
      url: `${this.#documentsUrl}/fire-trials/${encodedTrialId}/documents/${params.documentId}`,
      method: 'DELETE',
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.DELETE_SUCCESS' }),
    };
  });

  readonly deleteAssociatedDocumentResource = httpResource<{ code: HttpStatusCode }>(() => {
    const params = this.#deleteAssociatedDocumentParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}`,
      method: 'DELETE',
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.DELETE_SUCCESS' }),
    };
  });

  readonly downloadDocumentResource = rxResource({
    params: () => this.#downloadDocumentParams() ?? undefined,
    stream: ({ params }) =>
      this.#httpClient.get(`${this.#documentsUrl}/documents/${params.documentId}/file`, {
        responseType: 'blob' as const,
      }),
  });

  readonly viewDocumentResource = rxResource({
    params: () => this.#viewDocumentParams() ?? undefined,
    stream: ({ params }) =>
      this.#httpClient.get(`${this.#documentsUrl}/documents/${params.documentId}/file`, {
        responseType: 'blob' as const,
      }),
  });

  readonly documentTypesResource = httpResource<DocumentTypesResponse>(() => {
    const trigger = this.#typesRefreshTrigger();
    if (trigger === 0) return undefined;

    return {
      url: `${this.#documentsUrl}/document-types?pageSize=100&active=true`,
      context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
    };
  });

  readonly centerDocumentsResource = httpResource<CenterDocumentsResponse>(() => {
    const params = this.#centerDocumentsParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params.filters, true);

    return {
      url: `${this.#documentsUrl}/documents${queryParams}`,
      method: 'GET',
    };
  });

  readonly createDocumentTypeResource = httpResource<DocumentTypesResponse['items'][0]>(() => {
    const params = this.#createDocumentTypeParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/document-types`,
      method: 'POST',
      body: params,
      context: new HttpContext()
        .set(SKIP_CENTER_INTERCEPTOR, true)
        .set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.DOCUMENT_TYPE_CREATE_SUCCESS' }),
    };
  });

  readonly updateDocumentTypeResource = httpResource<DocumentTypesResponse['items'][0]>(() => {
    const params = this.#updateDocumentTypeParams();
    if (!params) return undefined;

    const { documentTypeId, ...body } = params;

    return {
      url: `${this.#documentsUrl}/document-types/${documentTypeId}`,
      method: 'PUT',
      body,
      context: new HttpContext()
        .set(SKIP_CENTER_INTERCEPTOR, true)
        .set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.DOCUMENT_TYPE_UPDATE_SUCCESS' }),
    };
  });

  readonly deleteDocumentTypeResource = httpResource(() => {
    const params = this.#deleteDocumentTypeParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/document-types/${params.documentTypeId}`,
      method: 'DELETE',
      context: new HttpContext()
        .set(SKIP_CENTER_INTERCEPTOR, true)
        .set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.DOCUMENT_TYPE_DELETE_SUCCESS' }),
    };
  });

  readonly createObservationResource = httpResource<DocumentObservationItem>(() => {
    const params = this.#createObservationParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/observations`,
      method: 'POST',
      body: { description: params.description },
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.OBSERVATION_CREATE_SUCCESS' }),
    };
  });

  readonly updateObservationResource = httpResource<DocumentObservationItem>(() => {
    const params = this.#updateObservationParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/observations/${params.observationId}`,
      method: 'PUT',
      body: { description: params.description },
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.OBSERVATION_UPDATE_SUCCESS' }),
    };
  });

  readonly deleteObservationResource = httpResource(() => {
    const params = this.#deleteObservationParams();
    if (!params) return undefined;

    return {
      url: `${this.#documentsUrl}/documents/${params.documentId}/observations/${params.observationId}`,
      method: 'DELETE',
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_DOCS.OBSERVATION_DELETE_SUCCESS' }),
    };
  });

  getDocuments(fireTrialId: string, filters?: DocumentsQueryParams): void {
    this.#documentsParams.set({ fireTrialId, filters });
  }

  getDocumentDetail(documentId: string): void {
    this.#documentDetailParams.set({ documentId });
  }

  getDocumentObservations(documentId: string): void {
    this.#documentObservationsParams.set({ documentId });
  }

  getDocumentAssociatedTrials(documentId: string): void {
    this.#documentAssociatedTrialsParams.set({ documentId });
  }

  associateDocToTrial(params: AssociateDocToExistingTrialRequest): void {
    this.#associateDocToExistingTrialParams.set(params);
  }

  resetAssociateDoc(): void {
    this.#associateDocToExistingTrialParams.set(null);
  }

  getDocumentVersions(documentId: string): void {
    this.#documentVersionsParams.set({ documentId });
  }

  setDocumentVersionActive(documentId: string, versionId: string): void {
    this.#updateDocumentVersionsParams.set({ documentId, versionId });
  }

  updateDocumentInfo(documentId: string, name: string, category: DocumentCategory, typeId: string): void {
    this.#updateDocumentInfoParams.set({ documentId, name, category, typeId });
  }

  downloadDocument(documentId: string): void {
    this.#downloadDocumentParams.set({ documentId });
  }

  viewDocumentBlob(documentId: string): void {
    this.#viewDocumentParams.set({ documentId });
  }

  resetDocumentDetail(): void {
    this.#documentDetailParams.set(null);
  }

  resetDocumentObservations(): void {
    this.#documentObservationsParams.set(null);
  }

  resetDocumentVersions(): void {
    this.#documentVersionsParams.set(null);
  }

  resetDocumentAssociatedTrials(): void {
    this.#documentAssociatedTrialsParams.set(null);
  }

  resetDocumentVersionActive(): void {
    this.#updateDocumentVersionsParams.set(null);
  }

  resetUpdateDocumentInfo(): void {
    this.#updateDocumentInfoParams.set(null);
  }

  resetDownloadDocument(): void {
    this.#downloadDocumentParams.set(null);
  }

  resetViewDocumentBlob(): void {
    this.#viewDocumentParams.set(null);
  }

  uploadDocument(
    fireTrialId: string,
    file: File,
    documentTypeId: string,
    category: DocumentCategory,
    name: string,
  ): void {
    this.#uploadParams.set({ fireTrialId, file, documentTypeId, category, name });
  }

  uploadNewDocumentVersion(documentId: string, file: File): void {
    this.#newDocumentVersionParams.set({ documentId, file });
  }

  deleteDocument(fireTrialId: string, documentId: string): void {
    this.#deleteParams.set({ fireTrialId, documentId, _version: ++this.#deleteVersion });
  }

  deleteAssociatedDocument(documentId: string): void {
    this.#deleteAssociatedDocumentParams.set({ documentId });
  }

  loadDocumentTypes(): void {
    this.#typesRefreshTrigger.set(1);
  }

  refreshDocuments(): void {
    const current = this.#documentsParams();
    if (current) {
      this.#documentsParams.set({ ...current });
    }
  }

  refreshDocumentTypes(): void {
    this.#typesRefreshTrigger.update((count) => count + 1);
  }

  resetUpload(): void {
    this.#uploadParams.set(null);
  }

  resetNewDocumentVersion(): void {
    this.#newDocumentVersionParams.set(null);
  }

  resetDelete(): void {
    this.#deleteParams.set(null);
  }

  resetDeleteAssociated(): void {
    this.#deleteAssociatedDocumentParams.set(null);
  }

  loadCenterDocuments(filters?: CenterDocumentsQueryParams): void {
    this.#centerDocumentsParams.set({ filters });
  }

  resetCenterDocuments(): void {
    this.#centerDocumentsParams.set(null);
  }

  createDocumentType(params: DocumentTypeCreateRequest): void {
    this.#createDocumentTypeParams.set(params);
  }

  resetCreateDocumentType(): void {
    this.#createDocumentTypeParams.set(null);
  }

  updateDocumentType(params: UpdateDocumentTypeParams): void {
    this.#updateDocumentTypeParams.set(params);
  }

  resetUpdateDocumentType(): void {
    this.#updateDocumentTypeParams.set(null);
  }

  deleteDocumentType(documentTypeId: string): void {
    this.#deleteDocumentTypeParams.set({ documentTypeId });
  }

  resetDeleteDocumentType(): void {
    this.#deleteDocumentTypeParams.set(null);
  }

  createObservation(documentId: string, description: string): void {
    this.#createObservationParams.set({ documentId, description });
  }

  resetCreateObservation(): void {
    this.#createObservationParams.set(null);
  }

  updateObservation(documentId: string, observationId: string, description: string): void {
    this.#updateObservationParams.set({ documentId, observationId, description });
  }

  resetUpdateObservation(): void {
    this.#updateObservationParams.set(null);
  }

  deleteObservation(documentId: string, observationId: string): void {
    this.#deleteObservationParams.set({ documentId, observationId });
  }

  resetDeleteObservation(): void {
    this.#deleteObservationParams.set(null);
  }

  #buildQueryParams = (filters?: DocumentsQueryParams, pageSize = false): string => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === 'ALL' || value === 'all') return;
        if (key === 'sort' && Array.isArray(value)) {
          value.forEach((v) => params.append('sort', v));
        } else {
          params.append(key, value.toString());
        }
      });
    }

    if (pageSize) {
      params.append('pageSize', '100');
    }

    return params.toString() ? `?${params.toString()}` : '';
  };
}
