import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { MunitionComponentPostModel, MunitionStockPostModel } from '../models/munition-stock.model';
import { MunitionsStockService } from './munitions-stock.service';

// // Factories
//

function makeMunitionStock(overrides: Partial<MunitionStockPostModel> = {}): MunitionStockPostModel {
  return {
    id: 'stock-1',
    munitionTypeId: 'mt-1',
    denominationId: 'denom-1',
    batch: 'LOT-001',
    quantity: 10,
    generalData: {
      clientId: 'client-1',
      entryDate: '2025-01-01',
      plannedFireTrialId: 'trial-1',
      observations: '',
    },
    location: { munitionDumpId: 'dump-1', cellName: 'A-01' },
    associatedComponents: [],
    ...overrides,
  };
}

function makeMunitionComponentStock(): MunitionComponentPostModel {
  return {
    munitionTypeId: 'mt-2',
    denominationId: 'denom-2',
    batch: 'LOT-002',
    quantity: 5,
    generalData: {
      clientId: 'client-1',
      entryDate: '2025-01-01',
      plannedFireTrialId: 'trial-1',
      observations: '',
    },
    location: { munitionDumpId: 'dump-1', cellName: 'B-01' },
  };
}

// // Tests
//

describe('MunitionsStockService', () => {
  let service: MunitionsStockService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionsStockService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Creation
  it('should be created with the expected API', () => {
    expect(service).toBeTruthy();
    expect(service.munition).toBeDefined();
    expect(service.munitionComponents).toBeDefined();
    expect(service.saveMunitionResource).toBeDefined();
    expect(service.saveMunitionComponentsResource).toBeDefined();
  });

  // saveMunitionResource
  describe('saveMunitionResource (munition signal)', () => {
    it('should NOT fire any request when munition is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/stock'));
    });

    it('should fire a POST to /stock/munitions when munition signal is set', () => {
      service.munition.set({ itemToSave: makeMunitionStock() });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should strip the id field from the POST body', () => {
      service.munition.set({ itemToSave: makeMunitionStock({ id: 'stock-1' }) });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions') && r.method === 'POST');
      expect(req.request.body).not.toHaveProperty('id');
      req.flush({});
    });

    it('should NOT include the force param when force is not set', () => {
      service.munition.set({ itemToSave: makeMunitionStock() });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions') && r.method === 'POST');
      expect(req.request.params.get('force')).toBeNull();
      req.flush({});
    });

    it('should include force=true param when force is set', () => {
      service.munition.set({ itemToSave: makeMunitionStock(), force: true });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munitions') && r.method === 'POST');
      expect(req.request.params.get('force')).toBe('true');
      req.flush({});
    });
  });

  // saveMunitionComponentsResource
  describe('saveMunitionComponentsResource (munitionComponents signal)', () => {
    it('should NOT fire any request when munitionComponents is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/stock'));
    });

    it('should fire a POST to /stock/munition-components when munitionComponents is set', () => {
      service.munitionComponents.set([makeMunitionComponentStock()]);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munition-components') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should send the full array as the POST body', () => {
      const components = [makeMunitionComponentStock(), makeMunitionComponentStock()];
      service.munitionComponents.set(components);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/stock/munition-components') && r.method === 'POST');
      expect(req.request.body).toHaveLength(2);
      req.flush({});
    });
  });

  // clear()
  describe('clear()', () => {
    it('should reset both munition and munitionComponents signals to null', () => {
      service.munition.set({ itemToSave: makeMunitionStock() });
      service.munitionComponents.set([makeMunitionComponentStock()]);
      TestBed.tick();

      // flush any pending requests triggered by the signal sets
      httpMock.match((r) => r.url.includes('/stock')).forEach((r) => r.flush({}));

      service.clear();

      expect(service.munition()).toBeNull();
      expect(service.munitionComponents()).toBeNull();
    });
  });
});
