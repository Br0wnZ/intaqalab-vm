import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningTrialContextService } from '../context/trial-context.service';
import { PlanningSeriesService } from './planning-series.service';

const MOCK_PLANNING_URL = 'http://localhost:3000/api/planning';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_PLANNING_URL,
}));

describe('PlanningSeriesService', () => {
  let service: PlanningSeriesService;
  let contextService: PlanningTrialContextService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PlanningSeriesService, PlanningTrialContextService],
    });
    service = TestBed.inject(PlanningSeriesService);
    contextService = TestBed.inject(PlanningTrialContextService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not fetch until the trial context is set', () => {
    service.seriesResource.value();
    TestBed.tick();
    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
  });

  it('should fetch series for the trial in the shared context', async () => {
    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();

    const req = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    TestBed.tick();
    await settle();

    expect(service.seriesResource.value()).toEqual([]);
  });

  it('should re-issue the request when the trial context changes', async () => {
    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();
    httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`).flush([]);
    TestBed.tick();
    await settle();
    expect(service.seriesResource.value()).toEqual([]);

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-456' });
    TestBed.tick();
    httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-456/planning/series`).flush([]);
    TestBed.tick();
    await settle();

    expect(service.seriesResource.value()).toEqual([]);
  });

  it('should support a manual reload with the current context', async () => {
    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();

    httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`).flush([]);
    TestBed.tick();
    await settle();
    expect(service.seriesResource.value()).toEqual([]);

    service.reload();
    TestBed.tick();
    httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`).flush([]);
    TestBed.tick();
    await settle();
    expect(service.seriesResource.value()).toEqual([]);
  });
});

function settle(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
