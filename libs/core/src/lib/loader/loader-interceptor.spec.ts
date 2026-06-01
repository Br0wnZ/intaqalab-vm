/* eslint-disable @typescript-eslint/no-empty-function */
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';

import { loaderInterceptor } from './loader-interceptor';
import { LoaderService } from './services/loader.service';

/** Matches the debounce delay in LoaderService */
const SHOW_DEBOUNCE_MS = 150;

describe('loaderInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let loaderService: LoaderService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loaderInterceptor])), provideHttpClientTesting()],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    loaderService = TestBed.inject(LoaderService);
    loaderService.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    httpTesting.verify();
    loaderService.reset();
  });

  it('should display loader after the debounce delay when a request starts', fakeAsync(() => {
    expect(loaderService.isLoading()).toBe(false);

    httpClient.get('/api/data').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/data').flush({ data: 'test' });
    tick();
  }));

  it('should hide loader when a request completes', fakeAsync(() => {
    httpClient.get('/api/data').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/data').flush({ data: 'test' });
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should hide loader when a request fails', fakeAsync(() => {
    httpClient.get('/api/data').subscribe({ error: () => {} });
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/data').error(new ProgressEvent('error'), { status: 500 });
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should keep loader visible with multiple active requests', fakeAsync(() => {
    httpClient.get('/api/first').subscribe();
    httpClient.get('/api/second').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/first').flush({ data: 'first' });
    tick();

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/second').flush({ data: 'second' });
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should handle correctly when one request fails and another completes', fakeAsync(() => {
    httpClient.get('/api/success').subscribe();
    httpClient.get('/api/error').subscribe({ error: () => {} });
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/error').error(new ProgressEvent('error'), { status: 404 });
    tick();

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/success').flush({ data: 'ok' });
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should exclude requests to /i18n/', fakeAsync(() => {
    httpClient.get('/i18n/en.json').subscribe();

    expect(loaderService.isLoading()).toBe(false);

    httpTesting.expectOne('/i18n/en.json').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should exclude requests to /assets/', fakeAsync(() => {
    httpClient.get('/assets/config.json').subscribe();

    expect(loaderService.isLoading()).toBe(false);

    httpTesting.expectOne('/assets/config.json').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should exclude requests to /execution/state', fakeAsync(() => {
    httpClient.get('/execution/state').subscribe();

    expect(loaderService.isLoading()).toBe(false);

    httpTesting.expectOne('/execution/state').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should exclude requests to /openid-connect/token', fakeAsync(() => {
    httpClient.post('/openid-connect/token', {}).subscribe();

    expect(loaderService.isLoading()).toBe(false);

    httpTesting.expectOne('/openid-connect/token').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should display loader for normal API routes', fakeAsync(() => {
    httpClient.get('/api/users').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/users').flush([]);
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should handle mixed requests (excluded and non-excluded)', fakeAsync(() => {
    httpClient.get('/i18n/es.json').subscribe();
    httpClient.get('/api/data').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/i18n/es.json').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/data').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should handle three or more concurrent requests', fakeAsync(() => {
    httpClient.get('/api/one').subscribe();
    httpClient.get('/api/two').subscribe();
    httpClient.get('/api/three').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/one').flush({});
    tick();
    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/two').flush({});
    tick();
    expect(loaderService.isLoading()).toBe(true);

    httpTesting.expectOne('/api/three').flush({});
    tick();
    expect(loaderService.isLoading()).toBe(false);
  }));

  it('should not show loader if only excluded requests are active', fakeAsync(() => {
    httpClient.get('/i18n/en.json').subscribe();
    httpClient.get('/assets/logo.svg').subscribe();
    tick(SHOW_DEBOUNCE_MS);

    expect(loaderService.isLoading()).toBe(false);

    httpTesting.expectOne('/i18n/en.json').flush({});
    httpTesting.expectOne('/assets/logo.svg').flush({});
    tick();

    expect(loaderService.isLoading()).toBe(false);
  }));
});
