import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_ENV, SKIP_CENTER_INTERCEPTOR, provideTestingEnvironment } from '@intaqalab/config';

import { centerInterceptor } from './center-interceptor';

describe('centerInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  const runSetup = (apiUrl = '/api') => {
    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(withInterceptors([centerInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: { apiUrl, production: false, intaqalab: { id: 1 } } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    if (httpTestingController) {
      httpTestingController.verify();
    }
  });

  it('should be created', () => {
    runSetup();
    expect(centerInterceptor).toBeTruthy();
  });

  it('should insert /centers/{centerId} for local proxy URL starting with apiUrl', () => {
    runSetup('/api');

    http.get('/api/execution/test').subscribe();

    const req = httpTestingController.expectOne('/api/centers/2f40f684-4201-4903-95ea-0871aa3281e9/execution/test');
    expect(req.request.method).toBe('GET');
  });

  it('should insert /centers/{centerId} after versioned segment for remote URL', () => {
    runSetup('https://apis.des.inta.es/intaqalab');

    http.get('https://apis.des.inta.es/intaqalab/execution-api/1.0.0/fire-trials/123').subscribe();

    const req = httpTestingController.expectOne(
      'https://apis.des.inta.es/intaqalab/execution-api/1.0.0/centers/2f40f684-4201-4903-95ea-0871aa3281e9/fire-trials/123',
    );
    expect(req.request.method).toBe('GET');
  });

  it('should not modify URL when SKIP_CENTER_INTERCEPTOR context token is true', () => {
    runSetup('/api');

    http
      .get('/api/execution/test', {
        context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
      })
      .subscribe();

    const req = httpTestingController.expectOne('/api/execution/test');
    expect(req.request.method).toBe('GET');
  });

  it('should not modify external URLs not starting with apiUrl', () => {
    runSetup('/api');

    http.get('https://external-api.com/data').subscribe();

    const req = httpTestingController.expectOne('https://external-api.com/data');
    expect(req.request.method).toBe('GET');
  });
});
