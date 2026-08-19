import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { MunitionsDumpModel } from '../models/munitions-dumps.model';
import { MunitionsDumpsService } from './munitions-dumps.service';

// // Factories
//

function makeDump(overrides: Partial<MunitionsDumpModel> = {}): MunitionsDumpModel {
  return {
    id: 'dump-1',
    munitionDumpId: 'Polvorín Norte',
    cells: [{ name: 'A-01' }, { name: 'A-02' }],
    maxNeq: 1000,
    maxRiskGroupNeqPerCell: 500,
    active: true,
    ...overrides,
  };
}

const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

function initPagination(service: MunitionsDumpsService, httpMock: HttpTestingController) {
  service.searchItems.set({ page: 1, pageSize: 10 });
  TestBed.tick();
  httpMock.expectOne((r) => r.url.includes('/munitions-dumps') && r.method === 'GET').flush(emptyPage);
}

// // Tests
//

describe('MunitionsDumpsService', () => {
  let service: MunitionsDumpsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionsDumpsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Creation
  it('should be created with the expected API', () => {
    expect(service).toBeTruthy();
    expect(service.searchItems).toBeDefined();
    expect(service.paginatedResponse).toBeDefined();
    expect(service.saveResource).toBeDefined();
    expect(service.updateResource).toBeDefined();
    expect(service.deleteResource).toBeDefined();
  });

  // searchItems
  describe('searchItems', () => {
    it('should NOT fire any HTTP request when searchItems is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/munitions-dumps'));
    });

    it('should fire a GET to /munitions-dumps when searchItems is set', () => {
      service.searchItems.set({ page: 1, pageSize: 10 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munitions-dumps') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush(emptyPage);
    });

    it('should send pagination params', () => {
      service.searchItems.set({ page: 2, pageSize: 25, sortField: 'munitionDumpId', sortDirection: 'asc' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munitions-dumps'));
      const params = req.request.params;

      expect(params.get('page')).toBe('2');
      expect(params.get('pageSize')).toBe('25');
      req.flush(emptyPage);
    });
  });

  // createItem
  describe('createItem()', () => {
    it('should perform a POST to /munitions-dumps', () => {
      initPagination(service, httpMock);
      const { id: _id, ...newDump } = makeDump();

      service.createItem(newDump);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munitions-dumps') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should map cells to { name } objects in the POST body', () => {
      initPagination(service, httpMock);
      const { id: _id, ...newDump } = makeDump({ cells: [{ name: 'B-01' }, { name: 'B-02' }] });

      service.createItem(newDump);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munitions-dumps') && r.method === 'POST');
      expect(req.request.body.cells).toEqual([{ name: 'B-01' }, { name: 'B-02' }]);
      req.flush({});
    });

    it('should call paginatedResponse.reload() after POST succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const { id: _id, ...newDump } = makeDump();

      service.createItem(newDump);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes('/munitions-dumps') && r.method === 'POST').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // updateItem
  describe('updateItem()', () => {
    it('should perform a PUT to /munitions-dumps/:id', () => {
      initPagination(service, httpMock);
      const item = makeDump({ id: 'dump-1' });

      service.updateItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should map cells to { name } objects in the PUT body', () => {
      initPagination(service, httpMock);
      const item = makeDump({ id: 'dump-1', cells: [{ name: 'C-01' }] });

      service.updateItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'PUT');
      expect(req.request.body.cells).toEqual([{ name: 'C-01' }]);
      req.flush({});
    });

    it('should call paginatedResponse.reload() after PUT succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const item = makeDump({ id: 'dump-1' });

      service.updateItem(item);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'PUT').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // deleteItem
  describe('deleteItem()', () => {
    it('should perform a DELETE to /munitions-dumps/:id', () => {
      initPagination(service, httpMock);
      const item = makeDump({ id: 'dump-1' });

      service.deleteItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'DELETE');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after DELETE succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const item = makeDump({ id: 'dump-1' });

      service.deleteItem(item);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'DELETE').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // toogleEnabledItem
  describe('toogleEnabledItem()', () => {
    it('should perform a PUT with the toggled active value', () => {
      initPagination(service, httpMock);
      const item = makeDump({ id: 'dump-1', active: true });

      service.toogleEnabledItem(item, false);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munitions-dumps/${item.id}`) && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toMatchObject({ active: false });
      req.flush({});
    });
  });
});
