import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningTrialContextService } from '../context/trial-context.service';
import { PlanningArmamentService } from './planning-armament.service';
import { PlanningConditionsService } from './planning-conditions.service';
import { PlanningMeasuresService } from './planning-measures.service';
import { PlanningMunitionsService } from './planning-munitions.service';
import { PlanningSeriesService } from './planning-series.service';
import { PropellantChargeParametersService } from './propellant-charge-parameters.service';

const MOCK_PLANNING_URL = 'http://localhost:3000/api/planning';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_PLANNING_URL,
}));

describe('planning query services (shared trial context)', () => {
  let contextService: PlanningTrialContextService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PlanningTrialContextService,
        PlanningSeriesService,
        PlanningConditionsService,
        PlanningMeasuresService,
        PlanningMunitionsService,
        PlanningArmamentService,
        PropellantChargeParametersService,
      ],
    });
    contextService = TestBed.inject(PlanningTrialContextService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should not issue any planning request before the trial context is set', () => {
    TestBed.tick();
    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
  });

  it('should auto-issue series and conditions GETs when the trial context is set', async () => {
    const seriesService = TestBed.inject(PlanningSeriesService);
    const conditionsService = TestBed.inject(PlanningConditionsService);

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();
    await settle();

    const seriesReq = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
    expect(seriesReq.request.method).toBe('GET');
    seriesReq.flush([]);

    const conditionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/conditions`,
    );
    expect(conditionsReq.request.method).toBe('GET');
    conditionsReq.flush({ units: {}, series: [] });

    TestBed.tick();
    await settle();

    expect(seriesService.seriesResource.value()).toEqual([]);
    expect(conditionsService.conditionsResource.value()?.series).toEqual([]);
  });

  it('should not auto-issue other families from the context; they wait for an explicit load()', async () => {
    const seriesService = TestBed.inject(PlanningSeriesService);
    const conditionsService = TestBed.inject(PlanningConditionsService);
    const measuresService = TestBed.inject(PlanningMeasuresService);
    const munitionsService = TestBed.inject(PlanningMunitionsService);
    const armamentService = TestBed.inject(PlanningArmamentService);
    const propellantService = TestBed.inject(PropellantChargeParametersService);

    contextService.setTrial({ centerId: null, fireTrialId: 'trial-123' });
    TestBed.tick();
    await settle();

    const seriesReq = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/series`);
    seriesReq.flush([]);
    const conditionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/conditions`,
    );
    conditionsReq.flush({ units: {}, series: [] });

    TestBed.tick();
    await settle();

    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/measures`);
    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/munitions`);
    httpTestingController.expectNone(`${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/armament`);
    httpTestingController.expectNone(
      `${MOCK_PLANNING_URL}/fire-trials/trial-123/planning/propelling-charge-parameters`,
    );

    measuresService.load('trial-129');
    munitionsService.load('trial-129');
    armamentService.load('trial-129');
    propellantService.load('trial-129');
    TestBed.tick();

    const measuresReq = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-129/planning/measures`);
    measuresReq.flush({ series: [] });

    const munitionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-129/planning/munitions`,
    );
    munitionsReq.flush({ series: [] });

    const armamentReq = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-129/planning/armament`);
    armamentReq.flush({ series: [] });

    const propellantReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-129/planning/propelling-charge-parameters`,
    );
    propellantReq.flush({ series: [] });

    TestBed.tick();
    await settle();

    expect(measuresService.measuresResource.value()?.series).toEqual([]);
    expect(munitionsService.munitionsResource.value()?.series).toEqual([]);
    expect(armamentService.armamentResource.value()?.series).toEqual([]);
    expect(propellantService.parametersResource.value()?.series).toEqual([]);
  });

  it('should fetch munitions and armament imperatively via fetchMunitions()/fetchArmament()', async () => {
    const munitionsService = TestBed.inject(PlanningMunitionsService);
    const armamentService = TestBed.inject(PlanningArmamentService);

    const munitionsPromise = munitionsService.fetchMunitions('trial-126');
    const armamentPromise = armamentService.fetchArmament('trial-127');
    TestBed.tick();

    const munitionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-126/planning/munitions`,
    );
    expect(munitionsReq.request.method).toBe('GET');
    const munitionsResponse = {
      series: [{ seriesId: 's-1', seriesName: 'Serie 1', configurations: [] }],
    };
    munitionsReq.flush(munitionsResponse);

    const armamentReq = httpTestingController.expectOne(`${MOCK_PLANNING_URL}/fire-trials/trial-127/planning/armament`);
    expect(armamentReq.request.method).toBe('GET');
    const armamentResponse = { series: [] };
    armamentReq.flush(armamentResponse);

    TestBed.tick();
    await settle();

    await expect(munitionsPromise).resolves.toEqual(munitionsResponse);
    await expect(armamentPromise).resolves.toEqual(armamentResponse);
  });
});

function settle(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
