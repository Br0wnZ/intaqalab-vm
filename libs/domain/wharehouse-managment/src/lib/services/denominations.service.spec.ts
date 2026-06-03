import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import type {
  DenominationModel,
  DenominationUpSertModel,
  SearchDenominationsPaginatedSortedRequest,
} from '../models/denominations.model';
import { DenominationsService } from './denominations.service';

// // Factories
//

function makeDenomination(overrides: Partial<DenominationModel> = {}): DenominationModel {
  return {
    id: 'denom-1',
    name: 'Denominación Test',
    category: 'MUNITION',
    munitionType: { id: 'mt-1', name: 'Tipo Munición' },
    active: true,
    ...overrides,
  };
}

function makeUpsertDenomination(overrides: Partial<DenominationUpSertModel> = {}): DenominationUpSertModel {
  return {
    name: 'Denominación Test',
    category: 'MUNITION',
    munitionTypeId: 'mt-1',
    active: true,
    ...overrides,
  };
}

const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

// Helpers to initialize pagination and flush the initial GET before a mutation test
function initPagination(service: DenominationsService, httpMock: HttpTestingController) {
  service.searchItems.set({ page: 1, pageSize: 10 });
  TestBed.tick();
  const req = httpMock.expectOne((r) => r.url.includes('/denominations') && r.method === 'GET');
  req.flush(emptyPage);
}

// // Tests
//

describe('DenominationsService', () => {
  let service: DenominationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), DenominationsService],
    });
    service = TestBed.inject(DenominationsService);
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
    it('should NOT fire a GET request when searchItems is null (initial state)', () => {
      httpMock.expectNone((r) => r.url.includes('/denominations'));
    });

    it('should fire a GET with all query params when searchItems is set', () => {
      const params: SearchDenominationsPaginatedSortedRequest = {
        page: 1,
        pageSize: 10,
        sortField: 'name',
        sortDirection: 'asc',
        name: 'test',
        category: 'MUNITION',
      };

      service.searchItems.set(params);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/denominations'));
      const p = req.request.params;

      expect(p.get('page')).toBe('1');
      expect(p.get('pageSize')).toBe('10');
      expect(p.get('category')).toBe('MUNITION');

      req.flush(emptyPage);
    });
  });

  // createItem
  describe('createItem()', () => {
    it('should perform a POST to /denominations', () => {
      initPagination(service, httpMock);

      service.createItem(makeUpsertDenomination());
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes('/denominations') && r.method === 'POST');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should trigger a GET refresh after POST succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

      service.createItem(makeUpsertDenomination());
      TestBed.tick();

      const postReq = httpMock.expectOne((r) => r.url.includes('/denominations') && r.method === 'POST');
      postReq.flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // updateItem
  describe('updateItem()', () => {
    it('should perform a PUT to /denominations/:id', () => {
      initPagination(service, httpMock);

      const data = makeUpsertDenomination({ id: 'denom-1' });
      service.updateItem(data);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/denominations/${data.id}`) && r.method === 'PUT');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after PUT succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

      const data = makeUpsertDenomination({ id: 'denom-1' });
      service.updateItem(data);
      TestBed.tick();

      const putReq = httpMock.expectOne((r) => r.url.includes(`/denominations/${data.id}`) && r.method === 'PUT');
      putReq.flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // deleteItem
  describe('deleteItem()', () => {
    it('should perform a DELETE to /denominations/:id', () => {
      initPagination(service, httpMock);

      const item = makeDenomination({ id: 'denom-1' });
      service.deleteItem(item);
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/denominations/${item.id}`) && r.method === 'DELETE');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should call paginatedResponse.reload() after DELETE succeeds', () => {
      initPagination(service, httpMock);
      const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

      const item = makeDenomination({ id: 'denom-1' });
      service.deleteItem(item);
      TestBed.tick();

      const deleteReq = httpMock.expectOne((r) => r.url.includes(`/denominations/${item.id}`) && r.method === 'DELETE');
      deleteReq.flush({});
      TestBed.tick();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  // toogleEnabledItem
  describe('toogleEnabledItem()', () => {
    it('should not trigger any HTTP request (stub — TODO implementation)', () => {
      const item = makeDenomination();
      service.toogleEnabledItem(item, false);
      TestBed.tick();
      httpMock.expectNone((r) => r.url.includes('/denominations'));
    });
  });
});
