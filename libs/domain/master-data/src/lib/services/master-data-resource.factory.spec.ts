import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { injectMasterDataResource } from './master-data-resource.factory';

const BASE_URL = 'http://localhost:3000/api/master-data';

function flushRemainingRequests(httpMock: HttpTestingController) {
  try {
    const reqs = httpMock.match(() => true);
    reqs.forEach((r) => {
      if (!r.cancelled) {
        r.flush({});
      }
    });
  } catch {
    // ignore
  }
}

describe('injectMasterDataResource', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    flushRemainingRequests(httpTesting);
  });

  it('should create and fetch initial paginated data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      expect(resource.searchItems()).toEqual({});

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();

      const req = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalElements: 0 });

      await Promise.resolve();

      expect(resource.paginatedResponse.value()).toEqual({ items: [], totalElements: 0 });
    });
  });

  it('should call POST when creating an item', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.create({ name: 'New Item' });
      TestBed.flushEffects();

      const reqPost = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'POST');
      expect(reqPost.request.body).toEqual({ name: 'New Item' });
      reqPost.flush({ name: 'New Item' });

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [{ name: 'New Item' }], totalElements: 1 });
      await Promise.resolve();
    });
  });

  it('should call PUT when updating an item', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.update({ id: '1', name: 'Updated Item' });
      TestBed.flushEffects();

      const reqPut = httpTesting.expectOne((r) => r.url.includes('/dimension/1') && r.method === 'PUT');
      expect(reqPut.request.body).toEqual({ id: '1', name: 'Updated Item' });
      reqPut.flush({ id: '1', name: 'Updated Item' });

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [{ id: '1', name: 'Updated Item' }], totalElements: 1 });
      await Promise.resolve();
    });
  });

  it('should call DELETE when deleting an item', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.delete('1');
      TestBed.flushEffects();

      const reqDel = httpTesting.expectOne((r) => r.url.includes('/dimension/1') && r.method === 'DELETE');
      reqDel.flush(null);

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [], totalElements: 0 });
      await Promise.resolve();
    });
  });
});
