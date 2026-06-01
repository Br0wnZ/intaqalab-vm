import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type { MunitionComponentsModel } from '../models/munition-components.model';
import { MunitionComponentService } from './munition-component.service';

// ──────────────────────────────────────────────────────────────────────────────
// Factories
// ──────────────────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<MunitionComponentsModel> = {}): MunitionComponentsModel {
  return {
    id: 'item-1',
    category: 'MUNITION',
    name: { es: 'Granada', en: 'Grenade' },
    label: 'Granada',
    observations: '',
    active: true,
    ...overrides,
  };
}

const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

function initPagination(service: MunitionComponentService, httpMock: HttpTestingController) {
  service.searchItems.set({ page: 1, pageSize: 10 });
  TestBed.tick();
  httpMock.expectOne((r) => r.url.includes('/munition-types') && r.method === 'GET').flush(emptyPage);
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('MunitionComponentService', () => {
  let service: MunitionComponentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(MunitionComponentService);
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
    expect(service.saveResource).toBeDefined();
    expect(service.updateResource).toBeDefined();
    expect(service.deleteResource).toBeDefined();
  });

  // ── searchItems ────────────────────────────────────────────────────────────
  describe('searchItems', () => {
    it('should NOT fire any HTTP request when searchItems is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/munition-types'));
    });

    it('should fire a GET to /munition-types when searchItems is set', () => {
      service.searchItems.set({ page: 1, pageSize: 10 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munition-types') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush(emptyPage);
    });

    it('should send pagination and sort params as separate keys', () => {
      service.searchItems.set({ page: 2, pageSize: 25, sortField: 'name', sortDirection: 'asc' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munition-types'));
      const params = req.request.params;

      expect(params.get('page')).toBe('2');
      expect(params.get('pageSize')).toBe('25');
      expect(params.get('sortField')).toBe('name');
      expect(params.get('sortDirection')).toBe('asc');
      req.flush(emptyPage);
    });

    it('should send the name filter param when provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.searchItems.set({ page: 1, pageSize: 10, name: 'Granada' } as any);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munition-types'));
      expect(req.request.params.get('name')).toBe('Granada');
      req.flush(emptyPage);
    });
  });

  // ── createItem ─────────────────────────────────────────────────────────────
  describe('createItem()', () => {
    it('should perform a POST to /munition-types', () => {
      initPagination(service, httpMock);
      const { id: _id, active: _active, ...newItem } = makeItem();

      service.createItem(newItem);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/munition-types') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after POST succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const { id: _id, active: _active, ...newItem } = makeItem();

      service.createItem(newItem);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes('/munition-types') && r.method === 'POST').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────
  describe('updateItem()', () => {
    it('should perform a PUT to /munition-types/:id', () => {
      initPagination(service, httpMock);
      const item = makeItem({ id: 'item-1' });

      service.updateItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munition-types/${item.id}`) && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after PUT succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const item = makeItem({ id: 'item-1' });

      service.updateItem(item);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes(`/munition-types/${item.id}`) && r.method === 'PUT').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // ── deleteItem ─────────────────────────────────────────────────────────────
  describe('deleteItem()', () => {
    it('should perform a DELETE to /munition-types/:id', () => {
      initPagination(service, httpMock);
      const item = makeItem({ id: 'item-1' });

      service.deleteItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munition-types/${item.id}`) && r.method === 'DELETE');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after DELETE succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');
      const item = makeItem({ id: 'item-1' });

      service.deleteItem(item);
      TestBed.tick();

      httpMock.expectOne((r) => r.url.includes(`/munition-types/${item.id}`) && r.method === 'DELETE').flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // ── toogleEnabledItem ──────────────────────────────────────────────────────
  describe('toogleEnabledItem()', () => {
    it('should perform a PUT with the toggled active value', () => {
      initPagination(service, httpMock);
      const item = makeItem({ id: 'item-1', active: true });

      service.toogleEnabledItem(item, false);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/munition-types/${item.id}`) && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toMatchObject({ active: false });
      req.flush({});
    });
  });
});
