import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { MunitionStockListSearch } from '../models/munition-stock-list.model';
import { MunitionsStockListService } from './munitions-stock-list.service';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('MunitionsStockListService', () => {
  let service: MunitionsStockListService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionsStockListService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Creation ───────────────────────────────────────────────────────────────
  it('should be created with the expected API', () => {
    expect(service).toBeTruthy();
    expect(service.searchItems).toBeDefined();
    expect(service.paginatedResponse).toBeDefined();
  });

  // ── searchItems ────────────────────────────────────────────────────────────
  describe('searchItems', () => {
    it('should NOT fire any HTTP request when searchItems is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/stock'));
    });

    it('should fire a GET to /stock when searchItems is set', () => {
      service.searchItems.set({ page: 1, pageSize: 10 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush(emptyPage);
    });

    it('should send pagination params correctly', () => {
      service.searchItems.set({ page: 2, pageSize: 25 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock'));
      const params = req.request.params;

      expect(params.get('page')).toBe('2');
      expect(params.get('pageSize')).toBe('25');
      req.flush(emptyPage);
    });

    it('should send sort params as separate keys', () => {
      service.searchItems.set({ page: 1, pageSize: 10, sortField: 'batch', sortDirection: 'asc' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock'));
      const params = req.request.params;

      expect(params.get('sortField')).toBe('batch');
      expect(params.get('sortDirection')).toBe('asc');
      req.flush(emptyPage);
    });

    it('should send domain-specific filter params', () => {
      const filters: MunitionStockListSearch = {
        page: 1,
        pageSize: 10,
        status: 'AVAILABLE',
        entryDateFrom: '2025-01-01',
        entryDateTo: '2025-12-31',
      };

      service.searchItems.set(filters);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock'));
      const params = req.request.params;

      expect(params.get('status')).toBe('AVAILABLE');
      expect(params.get('entryDateFrom')).toBe('2025-01-01');
      expect(params.get('entryDateTo')).toBe('2025-12-31');
      req.flush(emptyPage);
    });

    it('should fire a new GET when searchItems changes', () => {
      service.searchItems.set({ page: 1, pageSize: 10 });
      TestBed.tick();
      httpMock.expectOne((r) => r.url.includes('/stock')).flush(emptyPage);

      service.searchItems.set({ page: 2, pageSize: 10 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock'));
      expect(req.request.params.get('page')).toBe('2');
      req.flush(emptyPage);
    });
  });
});
