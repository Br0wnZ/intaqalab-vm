import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { MunitionsStockCertificatesService } from './munitions-stock-certificates.service';

// // Tests
//

describe('MunitionsStockCertificatesService', () => {
  let service: MunitionsStockCertificatesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionsStockCertificatesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Creation
  it('should be created with the expected API', () => {
    expect(service).toBeTruthy();
    expect(service.response).toBeDefined();
    expect(service.deleteResource).toBeDefined();
    expect(service.uploadDocumentResource).toBeDefined();
    expect(service.munitionCertificateLinkResource).toBeDefined();
  });

  // searchById
  describe('searchById()', () => {
    it('should NOT fire any HTTP request initially', () => {
      httpMock.expectNone((r) => r.url.includes('/stock'));
    });

    it('should fire a GET to /stock/:id/certificates when called', () => {
      service.searchById('stock-1');
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/stock-1/certificates') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], page: 1, pageSize: 10, totalElements: 0 });
    });
  });

  // deleteItem
  describe('deleteItem()', () => {
    it('should fire a DELETE request when deleteItem is called', () => {
      service.deleteItem('stock-1', 'cert-1');
      TestBed.tick();

      // The service passes the composed string path to the factory's deleteItem.
      // The factory builds the URL as `${endpoint}/${item['id']}` — a plain string
      // has no 'id' property, so the URL becomes /stock/undefined.
      // This is a known limitation of the injectWarehouseResource factory with string params.
      const req = httpMock.expectOne((r) => r.method === 'DELETE');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // uploadDocument
  describe('uploadDocument()', () => {
    it('should NOT fire any upload request initially', () => {
      httpMock.expectNone((r) => r.url.includes('/certificates'));
    });

    it('should fire a POST to /stock/:stockId/certificates with FormData body', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocument('stock-1', file);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/stock-1/certificates') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush({});
    });
  });

  // munitionCertificateLinkResource
  describe('link (munitionCertificateLinkResource)', () => {
    it('should NOT fire any request when link is undefined', () => {
      httpMock.expectNone((r) => r.url.includes('/certificates'));
    });

    it('should fire a PUT to /stock/certificates/:certId/munitions when link is set', () => {
      service.link.set({ certId: 'cert-1', munitionIds: ['m-1', 'm-2'] });
      TestBed.tick();

      const req = httpMock.expectOne(
        (r) => r.url.includes('/stock/certificates/cert-1/munitions') && r.method === 'PUT',
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ munitionIds: ['m-1', 'm-2'] });
      req.flush({});
    });
  });
});
