import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_ENV } from '@intaqalab/config';
import { waitFor } from '@testing-library/angular';

import { FireTrialLifecycleService } from './fire-trial-lifecycle.service';

describe('FireTrialLifecycleService', () => {
  let service: FireTrialLifecycleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FireTrialLifecycleService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENV,
          useValue: {
            apiUrl: '/api',
            endpoints: {
              fireTrials: 'fire-trials-api/1.1.0/fire-trials',
            },
          },
        },
      ],
    });
    service = TestBed.inject(FireTrialLifecycleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should send POST request to start fire trial', () => {
    const trialId = 'trial-uuid-123';
    expect(service.startResource.value()).toBeUndefined();

    service.startFireTrial(trialId);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/start`));
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should send POST request to finish fire trial', async () => {
    const trialId = 'trial-uuid-123';
    const mockResponse = { executionFinishedAt: '2026-07-24T12:00:00Z' };

    service.finishFireTrial(trialId);
    TestBed.tick();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/finish`));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.finishResource.value()).toEqual(mockResponse);
    });
  });

  it('should send POST request with reason to cancel fire trial', () => {
    const trialId = 'trial-uuid-123';
    const reason = 'Weather conditions';

    service.cancelFireTrial(trialId, reason);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/cancel`));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null);
  });

  it('should send POST request with reason to void fire trial', () => {
    const trialId = 'trial-uuid-123';
    const reason = 'Administrative decision';

    service.voidFireTrial(trialId, reason);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/void`));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null);
  });

  it('should send POST request to close fire trial', () => {
    const trialId = 'trial-uuid-123';

    service.closeFireTrial(trialId);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/close`));
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should send POST request to reopen fire trial', () => {
    const trialId = 'trial-uuid-123';

    service.reopenFireTrial(trialId);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/reopen`));
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should send POST request to reactivate fire trial', () => {
    const trialId = 'trial-uuid-123';

    service.reactivateFireTrial(trialId);
    TestBed.flushEffects();

    const req = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${trialId}/reactivate`));
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
