import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TrialTransitionsService } from './trial-transitions.service';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const TRIAL_ID = 'trial-xyz';
const BASE_URL = `http://localhost:3000/api/fire-trials/${TRIAL_ID}`;

describe('TrialTransitionsService', () => {
  let service: TrialTransitionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        TrialTransitionsService,
      ],
    });
    service = TestBed.inject(TrialTransitionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not make request until an action is called', () => {
    void service.actionResource.value;
    httpMock.expectNone((r) => r.url.includes('/fire-trials'));
  });

  it('should POST to /cancel with reason body', () => {
    const reason = 'Motivo de cancelación';
    service.cancel(TRIAL_ID, reason);
    TestBed.tick();

    const req = httpMock.expectOne(`${BASE_URL}/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should POST to /void with reason body', () => {
    const reason = 'Motivo de anulación';
    service.void(TRIAL_ID, reason);
    TestBed.tick();

    const req = httpMock.expectOne(`${BASE_URL}/void`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should POST to /close without body', () => {
    service.close(TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${BASE_URL}/close`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should POST to /reopen without body', () => {
    service.reopen(TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${BASE_URL}/reopen`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should POST to /reactivate without body', () => {
    service.reactivate(TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${BASE_URL}/reactivate`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should DELETE to /delete', () => {
    service.delete(TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`http://localhost:3000/api/fire-trials/${TRIAL_ID}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
