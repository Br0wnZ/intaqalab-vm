import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { injectMasterDataResource } from './master-data-resource.factory';

const BASE_URL = 'http://localhost:3000/api/master-data';

describe('injectMasterDataResource', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
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

  it('should call DELETE when deleting an item with string id', async () => {
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

      const reqDel = httpTesting.expectOne((r) => r.url === `${endpoint}/1` && r.method === 'DELETE');
      reqDel.flush(null);

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [], totalElements: 0 });
      await Promise.resolve();
    });
  });

  it('should call DELETE when deleting an item with numeric id 0', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: number; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.delete(0);
      TestBed.flushEffects();

      const reqDel = httpTesting.expectOne((r) => r.url === `${endpoint}/0` && r.method === 'DELETE');
      reqDel.flush(null);

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [], totalElements: 0 });
      await Promise.resolve();
    });
  });

  it('should not reload list when creation fails with an HTTP error', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.create({ name: 'Failing Item' });
      TestBed.flushEffects();

      const reqPost = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'POST');
      reqPost.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

      await Promise.resolve();
      TestBed.flushEffects();

      // Verify no GET reload request was made
      expect(resource.saveResource.status()).toBe('error');
      expect(resource.saveResource.statusCode()).toBe(400);
    });
  });

  it('should not reload list when update fails with an HTTP error', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = `${BASE_URL}/dimension`;
      const resource = injectMasterDataResource<{ id: string; name: string }>(endpoint);

      resource.searchItems.set({ page: 0, pageSize: 10 });
      TestBed.flushEffects();
      const reqGet = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqGet.flush({ items: [], totalElements: 0 });
      await Promise.resolve();

      resource.update({ id: '1', name: 'Failing Update' });
      TestBed.flushEffects();

      const reqPut = httpTesting.expectOne((r) => r.url.includes('/dimension/1') && r.method === 'PUT');
      reqPut.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });

      await Promise.resolve();
      TestBed.flushEffects();

      // Verify no GET reload request was made
      expect(resource.updateResource.status()).toBe('error');
      expect(resource.updateResource.statusCode()).toBe(409);
    });
  });

  it('should not reload list when delete fails with an HTTP error', async () => {
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

      const reqDel = httpTesting.expectOne((r) => r.url === `${endpoint}/1` && r.method === 'DELETE');
      reqDel.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });

      await Promise.resolve();
      TestBed.flushEffects();

      // Verify no GET reload request was made
      expect(resource.deleteById.status()).toBe('error');
      expect(resource.deleteById.statusCode()).toBe(500);
    });
  });

  it('should reload list when deletion returns 204 No Content', async () => {
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

      const reqDel = httpTesting.expectOne((r) => r.url === `${endpoint}/1` && r.method === 'DELETE');
      reqDel.flush(null, { status: 204, statusText: 'No Content' });

      await Promise.resolve();
      TestBed.flushEffects();

      const reqReload = httpTesting.expectOne((r) => r.url.includes('/dimension') && r.method === 'GET');
      reqReload.flush({ items: [], totalElements: 0 });
      await Promise.resolve();
    });
  });
});
