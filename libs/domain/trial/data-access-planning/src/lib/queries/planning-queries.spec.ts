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
import { PlanningTargetCatalogsService } from './planning-target-catalogs.service';
import { PlanningTargetConditionsService } from './planning-target-conditions.service';
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
        PlanningTargetConditionsService,
        PlanningTargetCatalogsService,
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

  it('should include target fields in Planning conditions responses', async () => {
    const conditionsService = TestBed.inject(PlanningConditionsService);
    contextService.setTrial({ centerId: null, fireTrialId: 'trial-targets' });
    TestBed.tick();
    await settle();

    const conditionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-targets/planning/conditions`,
    );
    const response = {
      units: {},
      series: [
        {
          seriesId: 'series-1',
          seriesName: 'Serie 1',
          shots: [
            {
              shotId: 'shot-1',
              targetTypeId: 'target-1',
              targetMaterialId: 'material-1',
              targetDimensionsId: 'dimension-1',
              targetThicknessId: 'thickness-1',
              distance: 80,
              targetInclination: 15,
            },
          ],
        },
      ],
    };
    conditionsReq.flush(response);
    TestBed.tick();
    await settle();

    expect(conditionsService.conditionsResource.value()?.series[0]?.shots[0]).toMatchObject({
      targetTypeId: 'target-1',
      targetMaterialId: 'material-1',
      targetDimensionsId: 'dimension-1',
      targetThicknessId: 'thickness-1',
      distance: 80,
      targetInclination: 15,
    });
  });

  it('should auto-issue the target conditions GET when the trial context is set', async () => {
    const targetConditionsService = TestBed.inject(PlanningTargetConditionsService);
    contextService.setTrial({ centerId: null, fireTrialId: 'trial-target-widget' });
    TestBed.tick();
    await settle();

    const targetConditionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/fire-trials/trial-target-widget/planning/target-conditions`,
    );
    expect(targetConditionsReq.request.method).toBe('GET');
    targetConditionsReq.flush({
      sameForAllSeries: false,
      series: [
        {
          seriesId: 'series-1',
          sameForAllShots: false,
          shots: [
            {
              shotId: 'shot-1',
              targetConditionsData: {
                targetTypeId: 'target-1',
                targetTypeLabel: 'Fixed target',
                targetMaterialId: null,
                targetMaterialLabel: null,
                targetDimensionsId: null,
                targetDimensionsLabel: null,
                targetThicknessId: null,
                targetThicknessName: null,
                distance: null,
                distanceUnit: null,
                targetInclination: null,
                targetInclinationUnit: null,
              },
            },
          ],
        },
      ],
    });

    TestBed.tick();
    await settle();
    expect(
      targetConditionsService.targetConditionsResource.value()?.series[0]?.shots[0]?.targetConditionsData
        .targetTypeLabel,
    ).toBe('Fixed target');
  });

  it('should load target catalogs without duplicating the center path segment', async () => {
    const catalogsService = TestBed.inject(PlanningTargetCatalogsService);
    catalogsService.load();
    TestBed.tick();
    await settle();

    const targetTypesReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/target-types?pageSize=100&active=true`,
    );
    const targetMaterialsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/target-materials?pageSize=100&active=true`,
    );
    const targetDimensionsReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/target-dimensions?pageSize=100&active=true`,
    );
    const targetThicknessesReq = httpTestingController.expectOne(
      `${MOCK_PLANNING_URL}/target-thicknesses?pageSize=100&active=true`,
    );
    for (const request of [targetTypesReq, targetMaterialsReq, targetDimensionsReq, targetThicknessesReq]) {
      expect(request.request.method).toBe('GET');
      request.flush([]);
    }

    TestBed.tick();
    await settle();
    expect(catalogsService.targetTypesResource.value()).toEqual([]);
    expect(catalogsService.targetMaterialsResource.value()).toEqual([]);
    expect(catalogsService.targetDimensionsResource.value()).toEqual([]);
    expect(catalogsService.targetThicknessesResource.value()).toEqual([]);
  });

  it('should not auto-issue other families from the context; they wait for an explicit load()', async () => {
    TestBed.inject(PlanningSeriesService);
    TestBed.inject(PlanningConditionsService);
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
