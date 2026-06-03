import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectApiUrl, provideTestingEnvironment } from '@intaqalab/config';

import type {
  DocumentTypeCreateRequest,
  DocumentTypesResponse,
  DocumentsResponse,
  FireTrialDocument,
  UpdateDocumentTypeParams,
} from '../utils-models/documents-service.model';
import { TrialDocsService } from './trial-docs-service';

// vi.mock hoisted by Vitest
describe('TrialDocsService', () => {
  let service: TrialDocsService;
  let httpTesting: HttpTestingController;
  let appRef: ApplicationRef;
  let baseUrl: string;

  const mockDocument: FireTrialDocument = {
    id: 'doc-123',
    name: 'Test Document.pdf',
    category: 'GENERAL',
    type: {
      active: true,
      category: 'GENERAL',
      id: 'subtype-1',
      name: 'Autorización',
    },
    version: 'v1',
    status: 'ACTIVE',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  };

  const mockDocumentsResponse: DocumentsResponse = {
    page: 1,
    pageSize: 25,
    totalElements: 1,
    items: [mockDocument],
  };

  const mockTypesResponse: DocumentTypesResponse = {
    page: 1,
    pageSize: 100,
    totalElements: 3,
    items: [
      { id: 'subtype-1', name: 'Autorización', active: true, category: 'GENERAL' },
      { id: 'subtype-2', name: 'Certificado de conformidad', active: true, category: 'GENERAL' },
      { id: 'subtype-3', name: 'Comunicaciones', active: true, category: 'GENERAL' },
    ],
  };

  const expectRequestByBaseUrl = (baseUrl: string) => {
    return httpTesting.expectOne((req) => {
      const urlWithoutParams = req.url.split('?')[0];
      return urlWithoutParams === baseUrl;
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrialDocsService, provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });

    service = TestBed.inject(TrialDocsService);
    httpTesting = TestBed.inject(HttpTestingController);
    appRef = TestBed.inject(ApplicationRef);
    baseUrl = TestBed.runInInjectionContext(() => injectApiUrl());
  });

  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDocuments', () => {
    it('should fetch documents without filters', async () => {
      const fireTrialId = 'trial-123';

      service.getDocuments(fireTrialId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      expect(req.request.method).toBe('GET');

      req.flush(mockDocumentsResponse);
      await appRef.whenStable();

      expect(service.documentsResource.value()).toEqual(mockDocumentsResponse);
      expect(service.documentsResource.status()).toBe('resolved');
    });

    it('should handle HTTP error', async () => {
      const fireTrialId = 'trial-123';

      service.getDocuments(fireTrialId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
      await appRef.whenStable();

      expect(service.documentsResource.status()).toBe('error');
      expect(service.documentsResource.error()).toBeTruthy();
    });

    it('should return undefined when params is null', () => {
      expect(service.documentsResource.value()).toBeUndefined();
      expect(service.documentsResource.status()).toBe('idle');

      httpTesting.expectNone(() => true);
    });
  });

  describe('uploadDocument', () => {
    it('should upload document with FormData', async () => {
      const fireTrialId = 'trial-123';
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const subtypeId = 'subtype-1';
      const mockUploadResponse = {
        id: 'new-doc-123',
        name: 'test.pdf',
        size: 1024,
        uploadedAt: '2025-01-03T10:00:00Z',
      };

      service.uploadDocument(fireTrialId, file, subtypeId, 'GENERAL', 'test.pdf');
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBe(file);
      expect(formData.get('documentTypeId')).toBe(subtypeId);

      req.flush(mockUploadResponse);
      await appRef.whenStable();

      expect(service.uploadDocumentResource.value()).toEqual(mockUploadResponse);
      expect(service.uploadDocumentResource.status()).toBe('resolved');
    });

    it('should report upload progress', async () => {
      const fireTrialId = 'trial-123';
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const subtypeId = 'subtype-1';

      service.uploadDocument(fireTrialId, file, subtypeId, 'GENERAL', 'test.pdf');
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);
      expect(req.request.reportProgress).toBe(true);

      req.flush({ id: 'doc-123' });
      await appRef.whenStable();
    });

    it('should handle upload error', async () => {
      const fireTrialId = 'trial-123';
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const subtypeId = 'subtype-1';

      service.uploadDocument(fireTrialId, file, subtypeId, 'GENERAL', 'test.pdf');
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);
      req.flush('Upload failed', { status: 400, statusText: 'Bad Request' });
      await appRef.whenStable();

      expect(service.uploadDocumentResource.status()).toBe('error');
      expect(service.uploadDocumentResource.error()).toBeTruthy();
    });

    it('should reset upload params', async () => {
      const fireTrialId = 'trial-123';
      const file = new File(['test'], 'test.pdf');
      const subtypeId = 'subtype-1';

      service.uploadDocument(fireTrialId, file, subtypeId, 'GENERAL', 'test.pdf');
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);
      req.flush({ id: 'doc-123' });
      await appRef.whenStable();

      service.resetUpload();
      appRef.tick();

      expect(service.uploadDocumentResource.status()).toBe('idle');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      const fireTrialId = 'trial-123';
      const documentId = 'doc-456';
      const mockDeleteResponse = { code: 204 };

      service.deleteDocument(fireTrialId, documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents/${documentId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(mockDeleteResponse);
      await appRef.whenStable();

      expect(service.deleteDocumentResource.value()).toEqual(mockDeleteResponse);
      expect(service.deleteDocumentResource.status()).toBe('resolved');
    });

    it('should handle delete error', async () => {
      const fireTrialId = 'trial-123';
      const documentId = 'doc-456';

      service.deleteDocument(fireTrialId, documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents/${documentId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
      await appRef.whenStable();

      expect(service.deleteDocumentResource.status()).toBe('error');
      expect(service.deleteDocumentResource.error()).toBeTruthy();
    });

    it('should reset delete params', async () => {
      const fireTrialId = 'trial-123';
      const documentId = 'doc-456';

      service.deleteDocument(fireTrialId, documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents/${documentId}`);
      req.flush({ code: 204 });
      await appRef.whenStable();

      service.resetDelete();
      appRef.tick();

      expect(service.deleteDocumentResource.status()).toBe('idle');
    });
  });

  describe('loadDocumentTypes', () => {
    it('should fetch document types', async () => {
      service.loadDocumentTypes();
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types?pageSize=100`);
      expect(req.request.method).toBe('GET');

      req.flush(mockTypesResponse);
      await appRef.whenStable();

      expect(service.documentTypesResource.value()).toEqual(mockTypesResponse);
      expect(service.documentTypesResource.status()).toBe('resolved');
    });

    it('should handle types fetch error', async () => {
      service.loadDocumentTypes();
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types?pageSize=100`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
      await appRef.whenStable();

      expect(service.documentTypesResource.status()).toBe('error');
      expect(service.documentTypesResource.error()).toBeTruthy();
    });

    it('should not fetch types before calling loadDocumentTypes', () => {
      expect(service.documentTypesResource.status()).toBe('idle');
      httpTesting.expectNone(`${baseUrl}/documents/document-types?pageSize=100`);
    });
  });

  describe('load document details, observations, and versions', () => {
    it('should fetch document detail', async () => {
      const documentId = 'doc-456';

      // documentDetailResource requires fireTrialId to be set before it fires
      service.setFireTrialId('trial-123');
      service.getDocumentDetail(documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocument);
      await appRef.whenStable();

      expect(service.documentDetailResource.value()).toEqual(mockDocument);
      expect(service.documentDetailResource.status()).toBe('resolved');
    });

    it('should fetch document observations', async () => {
      const documentId = 'doc-456';

      service.getDocumentObservations(documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}/observations`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 'obs-1', text: 'First observation' }]);
      await appRef.whenStable();

      expect(service.documentObservationsResource.value()).toEqual([{ id: 'obs-1', text: 'First observation' }]);
      expect(service.documentObservationsResource.status()).toBe('resolved');
    });

    it('should fetch document versions', async () => {
      const documentId = 'doc-456';

      service.getDocumentVersions(documentId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}/versions`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 'ver-1', version: 'v1' }]);
      await appRef.whenStable();

      expect(service.documentVersionsResource.value()).toEqual([{ id: 'ver-1', version: 'v1' }]);
      expect(service.documentVersionsResource.status()).toBe('resolved');
    });
  });

  describe('refreshDocuments', () => {
    it('should refresh documents list', async () => {
      const fireTrialId = 'trial-123';

      service.getDocuments(fireTrialId);
      appRef.tick();

      let req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      req.flush(mockDocumentsResponse);
      await appRef.whenStable();

      service.refreshDocuments();
      appRef.tick();

      req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocumentsResponse);
      await appRef.whenStable();
    });

    it('should not refresh if no params set', () => {
      service.refreshDocuments();
      appRef.tick();

      httpTesting.expectNone(() => true);
    });
  });

  describe('refreshDocumentTypes', () => {
    it('should refresh document types', async () => {
      service.loadDocumentTypes();
      appRef.tick();

      let req = httpTesting.expectOne(`${baseUrl}/documents/document-types?pageSize=100`);
      req.flush(mockTypesResponse);
      await appRef.whenStable();

      expect(service.documentTypesResource.value()).toEqual(mockTypesResponse);
      expect(service.documentTypesResource.status()).toBe('resolved');

      service.refreshDocumentTypes();
      appRef.tick();

      req = httpTesting.expectOne(`${baseUrl}/documents/document-types?pageSize=100`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTypesResponse);
      await appRef.whenStable();

      expect(service.documentTypesResource.value()).toEqual(mockTypesResponse);
      expect(service.documentTypesResource.status()).toBe('resolved');
    });
  });

  describe('buildQueryParams', () => {
    it('should exclude null and undefined values', async () => {
      const fireTrialId = 'trial-123';
      const filters = {
        type: undefined,
        status: null,
        page: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.getDocuments(fireTrialId, filters);
      appRef.tick();

      const req = expectRequestByBaseUrl(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);

      expect(req.request.params.has('type')).toBe(false);
      expect(req.request.params.has('status')).toBe(false);

      req.flush(mockDocumentsResponse);
      await appRef.whenStable();
    });

    it('should handle empty filters', async () => {
      const fireTrialId = 'trial-123';

      service.getDocuments(fireTrialId, {});
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      expect(req.request.urlWithParams).toBe(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);

      req.flush(mockDocumentsResponse);
      await appRef.whenStable();
    });
  });

  describe('multiple operations', () => {
    it('should handle multiple document fetches', async () => {
      const fireTrialId1 = 'trial-123';
      const fireTrialId2 = 'trial-456';

      service.getDocuments(fireTrialId1);
      appRef.tick();

      let req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId1}/documents?pageSize=100`);
      req.flush(mockDocumentsResponse);
      await appRef.whenStable();

      service.getDocuments(fireTrialId2);
      appRef.tick();

      req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId2}/documents?pageSize=100`);
      req.flush(mockDocumentsResponse);
      await appRef.whenStable();
    });

    it('should handle upload and then fetch', async () => {
      const fireTrialId = 'trial-123';
      const file = new File(['test'], 'test.pdf');
      const subtypeId = 'subtype-1';

      service.uploadDocument(fireTrialId, file, subtypeId, 'GENERAL', 'test.pdf');
      appRef.tick();

      let req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents`);
      req.flush({ id: 'new-doc' });
      await appRef.whenStable();

      service.getDocuments(fireTrialId);
      appRef.tick();

      req = httpTesting.expectOne(`${baseUrl}/documents/fire-trials/${fireTrialId}/documents?pageSize=100`);
      req.flush(mockDocumentsResponse);
      await appRef.whenStable();
    });
  });

  describe('loadCenterDocuments', () => {
    it('should fetch center documents', async () => {
      const mockCenterDocsResponse = {
        page: 1,
        pageSize: 100,
        totalElements: 2,
        items: [
          {
            id: 'doc-1',
            name: 'Doc 1',
            category: 'GENERAL',
            type: { id: 'type-1', name: 'Type 1' },
            activeVersion: 'v1',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
      };

      service.loadCenterDocuments();
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents?pageSize=100`);
      expect(req.request.method).toBe('GET');

      req.flush(mockCenterDocsResponse);
      await appRef.whenStable();

      expect(service.centerDocumentsResource.value()).toEqual(mockCenterDocsResponse);
      expect(service.centerDocumentsResource.status()).toBe('resolved');
    });

    it('should not fetch before calling loadCenterDocuments', () => {
      expect(service.centerDocumentsResource.status()).toBe('idle');
      httpTesting.expectNone(() => true);
    });

    it('should reset center documents', async () => {
      service.loadCenterDocuments();
      appRef.tick();
      const req = httpTesting.expectOne(`${baseUrl}/documents/documents?pageSize=100`);
      req.flush({ page: 1, pageSize: 100, totalElements: 0, items: [] });
      await appRef.whenStable();

      service.resetCenterDocuments();
      appRef.tick();
      expect(service.centerDocumentsResource.status()).toBe('idle');
    });
  });

  describe('document types CRUD', () => {
    it('should create a document type', async () => {
      const createParams: DocumentTypeCreateRequest = {
        name: { es: 'Tipo Test', en: 'Test Type' },
        active: true,
        category: 'GENERAL',
      };
      const mockResponse = {
        id: 'type-new',
        name: { es: 'Tipo Test', en: 'Test Type' },
        label: 'Tipo Test',
        active: true,
        category: 'GENERAL',
      };

      service.createDocumentType(createParams);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createParams);

      req.flush(mockResponse);
      await appRef.whenStable();

      expect(service.createDocumentTypeResource.status()).toBe('resolved');
    });

    it('should update a document type', async () => {
      const updateParams: UpdateDocumentTypeParams = {
        documentTypeId: 'type-1',
        name: { es: 'Actualizado', en: 'Updated' },
        active: true,
        category: 'SPECIFIC',
      };
      const mockResponse = {
        id: 'type-1',
        name: { es: 'Actualizado', en: 'Updated' },
        label: 'Actualizado',
        active: true,
        category: 'SPECIFIC',
      };

      service.updateDocumentType(updateParams);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types/type-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        name: updateParams.name,
        active: updateParams.active,
        category: updateParams.category,
      });

      req.flush(mockResponse);
      await appRef.whenStable();

      expect(service.updateDocumentTypeResource.status()).toBe('resolved');
    });

    it('should delete a document type', async () => {
      service.deleteDocumentType('type-1');
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types/type-1`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null, { status: 204, statusText: 'No Content' });
      await appRef.whenStable();

      expect(service.deleteDocumentTypeResource.status()).toBe('resolved');
    });

    it('should reset create document type', async () => {
      service.createDocumentType({
        name: { es: 'Tipo' },
        active: true,
        category: 'GENERAL',
      } satisfies DocumentTypeCreateRequest);
      appRef.tick();
      const req = httpTesting.expectOne(`${baseUrl}/documents/document-types`);
      req.flush({});
      await appRef.whenStable();

      service.resetCreateDocumentType();
      appRef.tick();
      expect(service.createDocumentTypeResource.status()).toBe('idle');
    });
  });

  describe('observation CRUD', () => {
    it('should create an observation', async () => {
      const documentId = 'doc-123';
      const description = 'Nueva observación';
      const mockResponse = { id: 'obs-new', description, createdBy: 'user', createdAt: '2025-01-01T00:00:00Z' };

      service.createObservation(documentId, description);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}/observations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ description });

      req.flush(mockResponse);
      await appRef.whenStable();

      expect(service.createObservationResource.value()).toEqual(mockResponse);
      expect(service.createObservationResource.status()).toBe('resolved');
    });

    it('should update an observation', async () => {
      const documentId = 'doc-123';
      const observationId = 'obs-456';
      const description = 'Observación editada';
      const mockResponse = { id: observationId, description, createdBy: 'user', createdAt: '2025-01-01T00:00:00Z' };

      service.updateObservation(documentId, observationId, description);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}/observations/${observationId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ description });

      req.flush(mockResponse);
      await appRef.whenStable();

      expect(service.updateObservationResource.value()).toEqual(mockResponse);
      expect(service.updateObservationResource.status()).toBe('resolved');
    });

    it('should delete an observation', async () => {
      const documentId = 'doc-123';
      const observationId = 'obs-456';

      service.deleteObservation(documentId, observationId);
      appRef.tick();

      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/${documentId}/observations/${observationId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null, { status: 204, statusText: 'No Content' });
      await appRef.whenStable();

      expect(service.deleteObservationResource.status()).toBe('resolved');
    });

    it('should reset create observation', async () => {
      service.createObservation('doc-1', 'text');
      appRef.tick();
      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/doc-1/observations`);
      req.flush({});
      await appRef.whenStable();

      service.resetCreateObservation();
      appRef.tick();
      expect(service.createObservationResource.status()).toBe('idle');
    });

    it('should reset update observation', async () => {
      service.updateObservation('doc-1', 'obs-1', 'text');
      appRef.tick();
      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/doc-1/observations/obs-1`);
      req.flush({});
      await appRef.whenStable();

      service.resetUpdateObservation();
      appRef.tick();
      expect(service.updateObservationResource.status()).toBe('idle');
    });

    it('should reset delete observation', async () => {
      service.deleteObservation('doc-1', 'obs-1');
      appRef.tick();
      const req = httpTesting.expectOne(`${baseUrl}/documents/documents/doc-1/observations/obs-1`);
      req.flush(null, { status: 204, statusText: 'No Content' });
      await appRef.whenStable();

      service.resetDeleteObservation();
      appRef.tick();
      expect(service.deleteObservationResource.status()).toBe('idle');
    });
  });
});
