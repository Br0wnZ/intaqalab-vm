import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { languageInterceptor } from './language-interceptor';

class FakeTranslateLoader {
  getTranslation() {
    return of({});
  }
}

describe('languageInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
        }),
      ],
      providers: [provideHttpClient(withInterceptors([languageInterceptor])), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Accept-Language header with default "es" when no language is set', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Accept-Language')).toBe('es');
    req.flush({});
  });

  it('should add Accept-Language header with "en" when language is changed to English', () => {
    translateService.use('en');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush({});
  });

  it('should add Accept-Language header with "es" when language is explicitly set to Spanish', () => {
    translateService.use('es');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Accept-Language')).toBe('es');
    req.flush({});
  });

  it('should not overwrite existing headers', () => {
    translateService.use('en');

    http
      .get('/api/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      })
      .subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
    req.flush({});
  });

  it('should work with different HTTP methods', () => {
    translateService.use('es');

    http.post('/api/test', { data: 'test' }).subscribe();
    const postReq = httpMock.expectOne('/api/test');
    expect(postReq.request.headers.get('Accept-Language')).toBe('es');
    postReq.flush({});

    http.put('/api/test/1', { data: 'updated' }).subscribe();
    const putReq = httpMock.expectOne('/api/test/1');
    expect(putReq.request.headers.get('Accept-Language')).toBe('es');
    putReq.flush({});

    http.delete('/api/test/1').subscribe();
    const deleteReq = httpMock.expectOne('/api/test/1');
    expect(deleteReq.request.headers.get('Accept-Language')).toBe('es');
    deleteReq.flush({});
  });
});
