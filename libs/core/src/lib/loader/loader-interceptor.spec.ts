import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
    vi.useFakeTimers();
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    httpTesting.verify();
    mutationLoaderService.reset();
  });

  describe('mutation methods (POST, PUT, DELETE)', () => {
    it('should display mutation loader on POST request after debounce delay', async () => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.post('/api/items', { name: 'New Item' }).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items').flush({ id: 1, name: 'New Item' });
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should display mutation loader on PUT request after debounce delay', async () => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.put('/api/items/1', { name: 'Updated Item' }).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items/1').flush({ id: 1, name: 'Updated Item' });
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should display mutation loader on DELETE request after debounce delay', async () => {
      expect(mutationLoaderService.isMutating()).toBe(false);

      httpClient.delete('/api/items/1').subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items/1').flush(null);
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should hide mutation loader when mutation request fails', async () => {
      httpClient.post('/api/items', {}).subscribe({
        next: vi.fn(),
        error: vi.fn(),
      });
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/items').error(new ProgressEvent('error'), { status: 500 });
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should keep mutation loader visible until all concurrent mutation requests finish', async () => {
      httpClient.post('/api/first', {}).subscribe();
      httpClient.put('/api/second', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/first').flush({});
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/second').flush({});
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should handle correctly when one mutation request fails and another succeeds', async () => {
      httpClient.post('/api/success', {}).subscribe();
      httpClient.delete('/api/error').subscribe({
        next: vi.fn(),
        error: vi.fn(),
      });
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/error').error(new ProgressEvent('error'), { status: 404 });
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/success').flush({});
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(false);
    });
  });

  describe('non-mutation methods (GET, HEAD, etc.)', () => {
    it('should not show mutation loader for GET requests', async () => {
      httpClient.get('/api/items').subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/api/items').flush([]);
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should not show mutation loader for PATCH requests not in mutation list', async () => {
      httpClient.patch('/api/items/1', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/api/items/1').flush({});
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });
  });

  describe('excluded URLs', () => {
    it('should exclude requests matching /i18n/', async () => {
      httpClient.post('/i18n/es.json', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/i18n/es.json').flush({});
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should exclude requests matching /assets/', async () => {
      httpClient.post('/assets/upload', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/assets/upload').flush({});
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should exclude requests matching /execution/state', async () => {
      httpClient.post('/execution/state', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/execution/state').flush({});
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });

    it('should exclude requests matching /openid-connect/token', async () => {
      httpClient.post('/openid-connect/token', {}).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(false);

      httpTesting.expectOne('/openid-connect/token').flush({});
      await vi.advanceTimersByTimeAsync(0);

      expect(mutationLoaderService.isMutating()).toBe(false);
    });
  });

  describe('mixed requests flow', () => {
    it('should activate mutation loader only for mutation requests in mixed traffic', async () => {
      httpClient.get('/api/read-only').subscribe();
      httpClient.post('/i18n/update', {}).subscribe();
      httpClient.post('/api/create-item', { name: 'Item' }).subscribe();
      await vi.advanceTimersByTimeAsync(SHOW_DEBOUNCE_MS);

      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/read-only').flush([]);
      httpTesting.expectOne('/i18n/update').flush({});
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(true);

      httpTesting.expectOne('/api/create-item').flush({ id: 1 });
      await vi.advanceTimersByTimeAsync(0);
      expect(mutationLoaderService.isMutating()).toBe(false);
    });
  });
});
