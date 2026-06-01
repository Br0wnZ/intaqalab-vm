import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ExecutionTransitionsService } from './execution-transitions.service';

const DEMO_TRIAL_ID = 'trial-456';
const BASE_URL = `http://localhost:3000/api/fire-trials/${DEMO_TRIAL_ID}/execution`;

describe('ExecutionTransitionsService', () => {
  let service: ExecutionTransitionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        ExecutionTransitionsService,
      ],
    });
    service = TestBed.inject(ExecutionTransitionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not make request until start() is called', () => {
    void service.startResource.value();
    httpMock.expectNone((r) => r.url.includes('execution/start'));
  });

  it('should make POST to /execution/start when start() is called', () => {
    service.start(DEMO_TRIAL_ID);
    TestBed.flushEffects();
    void service.startResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/start`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should make POST to /execution/pause when pause() is called', () => {
    service.pause(DEMO_TRIAL_ID);
    TestBed.flushEffects();
    void service.pauseResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/pause`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should make POST to /execution/interrupt with reason body', () => {
    const reason = 'Motivo de prueba de interrupción';
    service.interrupt(DEMO_TRIAL_ID, reason);
    TestBed.flushEffects();
    void service.interruptResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/interrupt`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should make POST to /execution/resume when resume() is called', () => {
    service.resume(DEMO_TRIAL_ID);
    TestBed.flushEffects();
    void service.resumeResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/resume`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should make POST to /execution/cancel with reason body', () => {
    const reason = 'Incidencia insalvable durante ejecución';
    service.cancel(DEMO_TRIAL_ID, reason);
    TestBed.flushEffects();
    void service.cancelResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should make POST to /execution/finish and receive finishedAt', () => {
    const mockResponse = { finishedAt: '2026-03-26T12:00:00Z' };
    service.finish(DEMO_TRIAL_ID);
    TestBed.flushEffects();
    void service.finishResource.value();

    const req = httpMock.expectOne(`${BASE_URL}/finish`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
