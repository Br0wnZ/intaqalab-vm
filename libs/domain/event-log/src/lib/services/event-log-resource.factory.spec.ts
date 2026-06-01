import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { injectEventLogEndpoint, provideTestingEnvironment } from '@intaqalab/config';

import { injectEventLogResource } from './event-log-resource.factory';

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

  it('should create and fetch initial documents paginated data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = injectEventLogEndpoint() + '/documents';
      const resource = injectEventLogResource<{ id: string; name: string }>(endpoint);

      expect(resource.searchItems()).toEqual({});

      resource.paginatedResponse.value();
      TestBed.flushEffects();

      const req = httpTesting.expectOne(
        (r) => r.url.includes(injectEventLogEndpoint()) && r.url.includes('/documents'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalElements: 0 });

      await Promise.resolve();

      expect(resource.paginatedResponse.value()).toEqual({ items: [], totalElements: 0 });
    });
  });

  it('should create and fetch initial general-data paginated data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = injectEventLogEndpoint() + '/general-data';
      const resource = injectEventLogResource<{ id: string; name: string }>(endpoint);

      expect(resource.searchItems()).toEqual({});

      resource.paginatedResponse.value();
      TestBed.flushEffects();

      const req = httpTesting.expectOne(
        (r) => r.url.includes(injectEventLogEndpoint()) && r.url.includes('/general-data'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalElements: 0 });

      await Promise.resolve();

      expect(resource.paginatedResponse.value()).toEqual({ items: [], totalElements: 0 });
    });
  });

  it('should create and fetch initial measures paginated data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = injectEventLogEndpoint() + '/measures';
      const resource = injectEventLogResource<{ id: string; name: string }>(endpoint);

      expect(resource.searchItems()).toEqual({});

      resource.paginatedResponse.value();
      TestBed.flushEffects();

      const req = httpTesting.expectOne((r) => r.url.includes(injectEventLogEndpoint()) && r.url.includes('/measures'));
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalElements: 0 });

      await Promise.resolve();

      expect(resource.paginatedResponse.value()).toEqual({ items: [], totalElements: 0 });
    });
  });

  it('should create and fetch initial series-and-shoots paginated data', async () => {
    await TestBed.runInInjectionContext(async () => {
      const endpoint = injectEventLogEndpoint() + '/series-and-shoots';
      const resource = injectEventLogResource<{ id: string; name: string }>(endpoint);

      expect(resource.searchItems()).toEqual({});

      resource.paginatedResponse.value();
      TestBed.flushEffects();

      const req = httpTesting.expectOne(
        (r) => r.url.includes(injectEventLogEndpoint()) && r.url.includes('/series-and-shoots'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({ items: [], totalElements: 0 });

      await Promise.resolve();

      expect(resource.paginatedResponse.value()).toEqual({ items: [], totalElements: 0 });
    });
  });
});
