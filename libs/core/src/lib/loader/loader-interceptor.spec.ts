import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';

import { loaderInterceptor } from './loader-interceptor';
import { MutationLoaderService } from './services/mutation-loader.service';

/** Matches debounce delay in MutationLoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('loaderInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let mutationLoaderService: MutationLoaderService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loaderInterceptor])), provideHttpClientTesting()],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    mutationLoaderService = TestBed.inject(MutationLoaderService);
    mutationLoaderService.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    httpTesting.verify();
    mutationLoaderService.reset();
  });

  describe('mutation methods (POST, PUT, DELETE)', () => {
    it('should display mutation loader on POST request after debounce delay', fakeAsync(() => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.post('/api/items', { name: 'New Item' }).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items').flush({ id: 1, name: 'New Item' });
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should display mutation loader on PUT request after debounce delay', fakeAsync(() => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.put('/api/items/1', { name: 'Updated Item' }).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items/1').flush({ id: 1, name: 'Updated Item' });
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should display mutation loader on DELETE request after debounce delay', fakeAsync(() => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.delete('/api/items/1').subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items/1').flush(null);
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should hide mutation loader when mutation request fails', fakeAsync(() => {
      httpClient.post('/api/items', {}).subscribe({
        next: vi.fn(),
        error: vi.fn(),
      });
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items').error(new ProgressEvent('error'), { status: 500 });
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should keep mutation loader visible until all concurrent mutation requests finish', fakeAsync(() => {
      httpClient.post('/api/first', {}).subscribe();
      httpClient.put('/api/second', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/first').flush({});
      tick();
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/second').flush({});
      tick();
      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should handle correctly when one mutation request fails and another succeeds', fakeAsync(() => {
      httpClient.post('/api/success', {}).subscribe();
      httpClient.delete('/api/error').subscribe({
        next: vi.fn(),
        error: vi.fn(),
      });
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/error').error(new ProgressEvent('error'), { status: 404 });
      tick();
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/success').flush({});
      tick();
      expect(mutationLoaderService.isMutating()).toBe(false);
    }));
  });

  describe('non-mutation methods (GET, HEAD, etc.)', () => {
    it('should not show mutation loader for GET requests', fakeAsync(() => {
      httpClient.get('/api/items').subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/api/items').flush([]);
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should not show mutation loader for PATCH requests not in mutation list', fakeAsync(() => {
      httpClient.patch('/api/items/1', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/api/items/1').flush({});
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));
  });

  describe('excluded URLs', () => {
    it('should exclude requests matching /i18n/', fakeAsync(() => {
      httpClient.post('/i18n/es.json', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/i18n/es.json').flush({});
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should exclude requests matching /assets/', fakeAsync(() => {
      httpClient.post('/assets/upload', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/assets/upload').flush({});
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should exclude requests matching /execution/state', fakeAsync(() => {
      httpClient.post('/execution/state', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/execution/state').flush({});
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));

    it('should exclude requests matching /openid-connect/token', fakeAsync(() => {
      httpClient.post('/openid-connect/token', {}).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/openid-connect/token').flush({});
      tick();

      expect(mutationLoaderService.isMutating()).toBe(false);
    }));
  });

  describe('mixed requests flow', () => {
    it('should activate mutation loader only for mutation requests in mixed traffic', fakeAsync(() => {
      httpClient.get('/api/read-only').subscribe();
      httpClient.post('/i18n/update', {}).subscribe();
      httpClient.post('/api/create-item', { name: 'Item' }).subscribe();
      tick(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/read-only').flush([]);
      httpTesting.expectOne('/i18n/update').flush({});
      tick();
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/create-item').flush({ id: 1 });
      tick();
      expect(mutationLoaderService.isMutating()).toBe(false);
    }));
  });
});
