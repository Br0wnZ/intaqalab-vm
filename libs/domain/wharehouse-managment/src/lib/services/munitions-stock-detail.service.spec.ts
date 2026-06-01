import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { UpdateAssociatedComponentsData } from './munitions-stock-detail.service';
import { MunitionsStockDetailService } from './munitions-stock-detail.service';

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('MunitionsStockDetailService', () => {
  let service: MunitionsStockDetailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionsStockDetailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Creation ───────────────────────────────────────────────────────────────
  it('should be created with the expected API', () => {
    expect(service).toBeTruthy();
    expect(service.response).toBeDefined();
    expect(service.deleteResource).toBeDefined();
    expect(service.retireResource).toBeDefined();
    expect(service.transferResource).toBeDefined();
  });

  // ── searchById ─────────────────────────────────────────────────────────────
  describe('searchById()', () => {
    it('should NOT fire any HTTP request initially', () => {
      httpMock.expectNone((r) => r.url.includes('/stock'));
    });

    it('should fire a GET to /stock/:id when called without entity', () => {
      service.searchById('stock-1');
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/stock-1') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should fire a GET to /stock/:entity/:id when called with entity', () => {
      service.searchById('stock-1', 'munitions');
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions/stock-1') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  // ── updateAssociatedComponents ─────────────────────────────────────────────
  describe('updateAssociatedComponents()', () => {
    const makeComponent = (): UpdateAssociatedComponentsData => ({
      denominationId: 'denom-1',
      batch: 'LOT-001',
      munitionTypeId: 'mt-1',
    });

    it('should fire a PATCH to /stock/munitions/:id', () => {
      service.updateAssociatedComponents({ id: 'stock-1', data: [makeComponent()] });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions/stock-1') && r.method === 'PATCH');
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });

    it('should send associatedComponents in the PATCH body', () => {
      const components = [makeComponent()];
      service.updateAssociatedComponents({ id: 'stock-1', data: components });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions/stock-1') && r.method === 'PATCH');
      expect(req.request.body).toEqual({ associatedComponents: components });
      req.flush({});
    });
  });

  // ── retireResource ─────────────────────────────────────────────────────────
  describe('retireResource (retire signal)', () => {
    it('should NOT fire any request when retire is undefined', () => {
      httpMock.expectNone((r) => r.url.includes('/movements'));
    });

    it('should fire a POST to /movements/retire when retire signal is set', () => {
      service.retire.set({ quantity: 10, reason: 'Defecto', itemId: 'stock-1', category: 'MUNITION' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/movements/retire') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({ quantity: 10, reason: 'Defecto', itemId: 'stock-1' });
      req.flush({});
    });
  });

  // ── transferResource ───────────────────────────────────────────────────────
  describe('transferResource (transfer signal)', () => {
    it('should NOT fire any request when transfer is undefined', () => {
      httpMock.expectNone((r) => r.url.includes('/movements'));
    });

    it('should fire a POST to /movements/transfers when transfer signal is set', () => {
      service.transfer.set({ quantity: 5, munitionDumpId: 'dump-1', cellName: 'A-01', itemId: 'stock-1' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/movements/transfers') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        quantity: 5,
        munitionDumpId: 'dump-1',
        cellName: 'A-01',
        itemId: 'stock-1',
      });
      req.flush({});
    });
  });
});
