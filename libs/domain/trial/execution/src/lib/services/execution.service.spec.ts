/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AngleUnitEnum, CadenceUnitEnum, DistanceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';
import { waitFor } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EquipmentTypeEnum,
  type ShotManometerPressuresRequest,
  type ShotManometerPressuresResponse,
  type ShotMunitionRequest,
  type ShotMunitionResponse,
  type ShotVideoDataRequest,
  type ShotVideoDataResponse,
  WidgetId,
} from '../execution/models';
import {
  type ArmamentBulkConfigurationRequest,
  type ArmamentEquipmentItem,
  ExecutionService,
  type PlanningArmamentResponse,
  type PlanningConditionsResponse,
  type PlanningResponse,
  type PlanningSeriesItem,
  type PlanningStateResponse,
  type ProfilesReadinessResponse,
  type SecurityCountdownResponse,
  type ShotArmamentResponse,
  type ShotPressuresResponse,
  type ShotVelocitiesResponse,
} from './execution.service';

const DEMO_TRIAL_ID = 'trial-456';
const EXECUTION_BASE_URL = `http://localhost:3000/api/execution/fire-trials/${DEMO_TRIAL_ID}/execution`;
const PLANNING_BASE_URL = `http://localhost:3000/api/planning/fire-trials/${DEMO_TRIAL_ID}/planning`;
const PLANNING_ROOT_URL = 'http://localhost:3000/api/planning';

vi.mock('@intaqalab/config', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('@intaqalab/config')>();
  return {
    ...actual,
    injectExecutionEndpoint: () => 'http://localhost:3000/api/execution',
    injectPlanningEndpoint: () => 'http://localhost:3000/api/planning',
    injectFireTrialsEndpoint: () => 'http://localhost:3000/api/fire-trials',
  };
});

describe('ExecutionService', () => {
  let service: ExecutionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), ExecutionService],
    });
    service = TestBed.inject(ExecutionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET planning series when getPlanningSeries() is called', async () => {
    const mockSeries: PlanningSeriesItem[] = [
      {
        id: 'series-1',
        name: 'Serie A',
        shotQuantity: 3,
        executionOrder: 1,
        shots: [{ id: 'shot-1', globalNumber: 1 }],
      },
    ];

    service.getPlanningSeries(DEMO_TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${PLANNING_BASE_URL}/series`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSeries);

    await waitFor(() => {
      TestBed.tick();
      expect(service.planningSeriesResource.value()).toEqual(mockSeries);
    });
  });

  it('should GET planning conditions when getPlanningConditions() is called', async () => {
    const mockConditions: PlanningConditionsResponse = {
      units: { orientation: AngleUnitEnum.DEGREES },
      series: [
        {
          seriesId: 'series-1',
          shots: [{ shotId: 'shot-1', orientation: 15, orientationUnit: AngleUnitEnum.DEGREES }],
        },
      ],
    };

    service.getPlanningConditions(DEMO_TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${PLANNING_BASE_URL}/conditions`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConditions);

    await waitFor(() => {
      TestBed.tick();
      expect(service.planningConditionsResource.value()).toEqual(mockConditions);
    });
  });

  it('should GET execution state when getExecutionState() is called', async () => {
    const mockResponse = {
      status: 'IN_PROGRESS' as const,
      activeSeriesId: 's-1',
      activeShotId: 'sh-1',
      activeShootId: 'sh-1',
      updatedAt: '2026-03-03T10:15:30Z',
    };

    service.getExecutionState(DEMO_TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${EXECUTION_BASE_URL}/state`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.executionStateResource.value()).toEqual(mockResponse);
    });
  });

  it('should GET execution progress when getExecutionProgress() is called', async () => {
    const mockResponse = {
      series: [
        {
          seriesId: 's-1',
          shots: [
            {
              shotId: 'sh-1',
              status: 'ACTIVE' as const,
              updatedAt: '2026-03-03T10:15:30Z',
            },
          ],
        },
      ],
    };

    service.getExecutionProgress(DEMO_TRIAL_ID);
    TestBed.tick();

    const req = httpMock.expectOne(`${EXECUTION_BASE_URL}/progress`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.executionProgressResource.value()).toEqual(mockResponse);
    });
  });

  it('should GET and PUT security countdown', async () => {
    const mockState: SecurityCountdownResponse = {
      status: 'ACTIVE',
      targetEndTime: '2026-03-03T10:20:30Z',
      remainingSeconds: 300,
    };

    // GET
    service.getSecurityCountdownState(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/security-countdown`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockState);

    await waitFor(() => {
      TestBed.tick();
      expect(service.securityCountdownResource.value()).toEqual(mockState);
    });

    // PUT
    const requestBody = { action: 'START' as const, durationSeconds: 300 };
    service.updateSecurityCountdown(DEMO_TRIAL_ID, requestBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/security-countdown`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(requestBody);
    putReq.flush(mockState);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateSecurityCountdownResource.value()).toEqual(mockState);
    });
  });

  it('should handle transitions start/pause/interrupt/resume/cancel/finish', async () => {
    // Start
    service.startExecution(DEMO_TRIAL_ID);
    TestBed.tick();
    const startReq = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${DEMO_TRIAL_ID}/start`));
    expect(startReq.request.method).toBe('POST');
    startReq.flush(null, { status: 200, statusText: 'OK' });
    TestBed.tick();

    // Pause
    service.pauseExecution(DEMO_TRIAL_ID);
    TestBed.tick();
    const pauseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/pause`);
    expect(pauseReq.request.method).toBe('POST');
    pauseReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();

    // Interrupt
    service.interruptExecution(DEMO_TRIAL_ID, 'anomaly');
    TestBed.tick();
    const interruptReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/interrupt`);
    expect(interruptReq.request.method).toBe('POST');
    expect(interruptReq.request.body).toEqual({ reason: 'anomaly' });
    interruptReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();

    // Resume
    service.resumeExecution(DEMO_TRIAL_ID);
    TestBed.tick();
    const resumeReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/resume`);
    expect(resumeReq.request.method).toBe('POST');
    resumeReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();

    // Cancel
    service.cancelExecution(DEMO_TRIAL_ID, 'abort');
    TestBed.tick();
    const cancelReq = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${DEMO_TRIAL_ID}/cancel`));
    expect(cancelReq.request.method).toBe('POST');
    expect(cancelReq.request.body).toEqual({ reason: 'abort' });
    cancelReq.flush(null, { status: 200, statusText: 'OK' });
    TestBed.tick();

    // Finish
    const finishResponse = { executionFinishedAt: '2026-03-03T12:00:00Z' };
    service.finishExecution(DEMO_TRIAL_ID);
    TestBed.tick();
    const finishReq = httpMock.expectOne((r) => r.url.endsWith(`/fire-trials/${DEMO_TRIAL_ID}/finish`));
    expect(finishReq.request.method).toBe('POST');
    finishReq.flush(finishResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.finishResource.value()).toEqual(finishResponse);
    });
  });

  it('should GET and PUT planning options', async () => {
    const mockPlanning: PlanningResponse = {
      goal: 'Testing api alignment',
      specimens: [{ specimenId: 'spec-1' }],
      planningUser: { id: 'user-1', name: 'Planning User' },
      executionDate: '2026-03-03',
    };

    // GET Planning
    service.getExecutionPlanning(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/planning`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockPlanning);

    await waitFor(() => {
      TestBed.tick();
      expect(service.planningResource.value()).toEqual(mockPlanning);
    });

    // PUT Planning
    const reqBody = {
      goal: 'Testing api alignment updated',
      specimens: [{ specimenId: 'spec-1' }],
      planningUserId: 'user-1',
      executionDate: '2026-03-03',
    };
    service.updateExecutionPlanning(DEMO_TRIAL_ID, reqBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/planning`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(reqBody);
    putReq.flush(mockPlanning);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updatePlanningResource.value()).toEqual(mockPlanning);
    });
  });

  it('should GET and POST planning state and approve', async () => {
    const mockState: PlanningStateResponse = {
      version: 1,
      isApprovedByClient: false,
      updatedAt: '2026-03-03T11:00:00Z',
    };

    // GET state
    service.getExecutionPlanningState(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/planning/state`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockState);

    await waitFor(() => {
      TestBed.tick();
      expect(service.planningStateResource.value()).toEqual(mockState);
    });

    // POST approve
    const approveBody = { approved: true, comments: 'Good to go' };
    service.approveExecutionPlanning(DEMO_TRIAL_ID, approveBody);
    TestBed.tick();

    const postReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/planning/approve`);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual(approveBody);
    postReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();
  });

  it('should GET and PUT widget preferences for roles and users', async () => {
    const mockPrefs = { widgetsLayout: [WidgetId.SHOT, WidgetId.EXECUTION_PREP_TECH] };

    // GET by role
    service.getPreferencesByRole(DEMO_TRIAL_ID, 'HEAD_BALLISTICS_UNIT');
    TestBed.tick();

    const getRoleReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/preferences/roles/HEAD_BALLISTICS_UNIT`);
    expect(getRoleReq.request.method).toBe('GET');
    getRoleReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.preferencesByRoleResource.value()).toEqual(mockPrefs);
    });

    // PUT by role
    service.updatePreferencesByRole(DEMO_TRIAL_ID, 'HEAD_BALLISTICS_UNIT', [
      WidgetId.SHOT,
      WidgetId.EXECUTION_PREP_TECH,
    ]);
    TestBed.tick();

    const putRoleReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/preferences/roles/HEAD_BALLISTICS_UNIT`);
    expect(putRoleReq.request.method).toBe('PUT');
    expect(putRoleReq.request.body).toEqual(mockPrefs);
    putRoleReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updatePreferencesByRoleResource.value()).toEqual(mockPrefs);
    });

    // GET by user
    service.getPreferencesByUser(DEMO_TRIAL_ID, 'john_doe');
    TestBed.tick();

    const getUserReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/preferences/users/john_doe`);
    expect(getUserReq.request.method).toBe('GET');
    getUserReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.preferencesByUserResource.value()).toEqual(mockPrefs);
    });

    // PUT by user
    service.updatePreferencesByUser(DEMO_TRIAL_ID, 'john_doe', [WidgetId.SHOT, 'prep-tech-video']);
    TestBed.tick();

    const putUserReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/preferences/users/john_doe`);
    expect(putUserReq.request.method).toBe('PUT');
    expect(putUserReq.request.body).toEqual({ widgetsLayout: [WidgetId.SHOT, 'prep-tech-video'] });
    expect(putUserReq.request.body).toEqual(mockPrefs);
    putUserReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updatePreferencesByUserResource.value()).toEqual(mockPrefs);
    });
  });

  it('should GET and PUT readiness profiles and handle single and batch updates', async () => {
    const mockReadiness: ProfilesReadinessResponse = {
      profilesReadiness: [
        {
          profile: 'VELOCITIES',
          seriesReadiness: [{ seriesId: 's-1', isReady: true, observations: 'ok' }],
        },
      ],
    };

    // GET readiness
    service.getProfilesReadiness(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockReadiness);

    await waitFor(() => {
      TestBed.tick();
      expect(service.profilesReadinessResource.value()).toEqual(mockReadiness);
    });

    // PUT single series readiness
    const singleSeriesBody = { isReady: true, observations: 'ok' };
    const singleSeriesResponse = { seriesId: 's-1', ...singleSeriesBody };
    const singleSeriesPromise = service.setSeriesProfileReadiness(DEMO_TRIAL_ID, 'VELOCITIES', 's-1', singleSeriesBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness/profiles/VELOCITIES/series/s-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(singleSeriesBody);
    putReq.flush(singleSeriesResponse);

    await expect(singleSeriesPromise).resolves.toEqual(singleSeriesResponse);

    // PUT batch readiness with array
    const batchItems = [
      { seriesId: 's-1', isReady: true, observations: 'ok 1' },
      { seriesId: 's-2', isReady: false, observations: 'pending' },
    ];
    const batchPromise = service.setProfileReadiness(DEMO_TRIAL_ID, 'VELOCITIES', batchItems);
    TestBed.tick();

    const legacyReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness/profiles/VELOCITIES`);
    const req1 = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness/profiles/VELOCITIES/series/s-1`);
    legacyReq.flush({ profile: 'VELOCITIES', seriesReadiness: batchItems });
    req1.flush(batchItems[0]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const reloadReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness`);
    reloadReq.flush(mockReadiness);

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const req2 = httpMock.expectOne(`${EXECUTION_BASE_URL}/readiness/profiles/VELOCITIES/series/s-2`);
    req2.flush(batchItems[1]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const batchResult = await batchPromise;
    expect(batchResult).toEqual(batchItems);

    service.resetSetProfileReadiness();
    TestBed.tick();
  });

  it('should GET and mutate JLT preparation for widget 2', async () => {
    const seriesId = '3fa85f64-5717-4562-b3fc-2c963f66afa1';
    const shotId = '3fa85f64-5717-4562-b3fc-2c963f66bfa3';
    const mockPreparation = {
      jltReadiness: {
        sanitaryServicesReady: true,
        securityReady: true,
        vesselReady: false,
        observations: 'Pendiente validacion final',
      },
      technicalUnitsReadiness: {
        velocities: { isReady: true, observations: 'OK' },
      },
      seriesIsReadyForExecution: false,
    };

    service.getJltPreparation(DEMO_TRIAL_ID, seriesId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-preparation?seriesId=${encodeURIComponent(seriesId)}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockPreparation);

    await waitFor(() => {
      TestBed.tick();
      expect(service.jltPreparationResource.value()).toEqual(mockPreparation);
    });

    const jltBody = {
      sanitaryServicesReady: true,
      securityReady: true,
      vessel: true,
      observations: 'Serie lista',
    };
    service.setJltReadiness(DEMO_TRIAL_ID, seriesId, jltBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-preparation/series/${seriesId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(jltBody);
    putReq.flush({
      sanitaryServicesReady: true,
      securityReady: true,
      vesselReady: true,
      observations: 'Serie lista',
    });

    await waitFor(() => {
      TestBed.tick();
      expect(service.setJltReadinessResource.value()).toEqual({
        sanitaryServicesReady: true,
        securityReady: true,
        vesselReady: true,
        observations: 'Serie lista',
      });
    });

    service.selectShot(DEMO_TRIAL_ID, shotId);
    TestBed.tick();

    const selectReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-preparation/shots/${shotId}/active`);
    expect(selectReq.request.method).toBe('POST');
    selectReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.selectShotResource.status()).toBe('resolved');
    });

    service.fireShot(DEMO_TRIAL_ID);
    TestBed.tick();

    const fireReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-preparation/fire`);
    expect(fireReq.request.method).toBe('POST');
    fireReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.fireShotResource.status()).toBe('resolved');
    });
  });

  it('should GET, load items by categories, and PUT equipment selection', async () => {
    const mockResponse: string | number | boolean | object | null = [];

    // GET equipment selection
    service.getEquipmentSelector(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/equipment-selection`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.equipmentSelectorResource.value()).toEqual(mockResponse);
    });

    // loadEquipmentItemsByCategories
    const loadCategoriesPromise = service.loadEquipmentItemsByCategories([
      EquipmentTypeEnum.DOPPLER_RADAR,
      EquipmentTypeEnum.ANTENNA,
    ]);
    TestBed.tick();

    const radarReq = httpMock.expectOne(
      (r) => r.url.includes('/equipment/items') && r.params.get('categoryId') === EquipmentTypeEnum.DOPPLER_RADAR,
    );
    radarReq.flush({
      totalElements: 1,
      items: [{ denominationId: 101, denominationName: 'Doppler R1', tag: 'RAD-01' }],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const antennaReq = httpMock.expectOne(
      (r) => r.url.includes('/equipment/items') && r.params.get('categoryId') === EquipmentTypeEnum.ANTENNA,
    );
    antennaReq.flush({
      totalElements: 1,
      items: [{ denominationId: 201, denominationName: 'Antenna Horn', tag: 'ANT-01' }],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    TestBed.tick();

    const categoryMap = await loadCategoriesPromise;
    expect(categoryMap[EquipmentTypeEnum.DOPPLER_RADAR]).toEqual([{ id: '101', label: 'Doppler R1 / RAD-01' }]);
    expect(categoryMap[EquipmentTypeEnum.ANTENNA]).toEqual([{ id: '201', label: 'Antenna Horn / ANT-01' }]);

    // PUT equipment selection
    const putReqBody: any[] = [];
    service.updateEquipmentSelector(DEMO_TRIAL_ID, putReqBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/equipment-selection`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(putReqBody);
    putReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateEquipmentSelectorResource.value()).toBeUndefined();
    });
  });

  it('should GET, fetch directly, and PUT JLT shot data using series and shot ids', async () => {
    const seriesId = 'series-1';
    const shotId = 'shot-1';
    const mockResponse = {
      jltData: {
        jet: 'JET-001',
        pieceOperator: 'OP-42',
        attackDistance: 12.5,
        attackDistanceUnit: DistanceUnitEnum.MM,
        recoilDistance: 8.3,
        recoilDistanceUnit: DistanceUnitEnum.MM,
        observations: 'Sin incidencias.',
      },
    };

    // Resource GET
    service.getJltShotData(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-shot-data/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.jltShotDataResource.value()).toEqual(mockResponse);
    });

    // Resource PUT
    service.setJltShotData(DEMO_TRIAL_ID, seriesId, shotId, mockResponse.jltData);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-shot-data/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(mockResponse.jltData);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateJltShotDataResource.value()).toEqual(mockResponse);
    });

    // Direct fetch GET
    const directFetchPromise = service.fetchJltShotData(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-shot-data/series/${seriesId}/shots/${shotId}`);
    expect(directReq.request.method).toBe('GET');
    directReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);
  });

  it('handles shot velocities data entry GET and PUT resources and direct fetch', async () => {
    const seriesId = '550e8400-e29b-41d4-a716-446655440100';
    const shotId = '550e8400-e29b-41d4-a716-446655440200';
    const mockVelocitiesResponse: ShotVelocitiesResponse = {
      velocities: [
        {
          radarDopplerId: 1,
          antennaId: 4,
          initialVelocity: 850.5,
          initialVelocityUnit: SpeedUnitEnum.M_S,
          softwareUncertainty: 0.5,
          softwareUncertaintyUnit: SpeedUnitEnum.M_S,
          cadence: 600,
          cadenceUnit: CadenceUnitEnum.SPM,
          velocityLoss: 2.1,
          velocityLossUnit: SpeedUnitEnum.M_S,
          observations: 'Sin incidencias.',
        },
      ],
    };

    service.getShotVelocities(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/velocities/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockVelocitiesResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotVelocitiesResource.value()).toEqual(mockVelocitiesResponse);
    });

    service.setShotVelocity(DEMO_TRIAL_ID, seriesId, shotId, mockVelocitiesResponse.velocities);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/velocities/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(mockVelocitiesResponse.velocities);
    putReq.flush(mockVelocitiesResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotVelocitiesResource.value()).toEqual(mockVelocitiesResponse);
    });

    const fetchPromise = service.fetchShotVelocities(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const fetchReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/velocities/series/${seriesId}/shots/${shotId}`);
    expect(fetchReq.request.method).toBe('GET');
    fetchReq.flush(mockVelocitiesResponse);
    TestBed.tick();

    const directResult = await fetchPromise;
    expect(directResult).toEqual(mockVelocitiesResponse);
  });

  it('handles shot pressures data entry GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-1';
    const shotId = 'shot-1';
    const mockPressuresResponse: ShotPressuresResponse = {
      pressuresData: {
        piezoelectricSensorId: 12,
        amplifierId: 15,
        dataAcquisitionSystemId: 20,
        closingMaxPressure: 3200.5,
        closingMaxPressureUnit: 'BAR',
        halfMaxPressure: 2800,
        halfMaxPressureUnit: 'BAR',
        shellMaxPressure: 2500.75,
        shellMaxPressureUnit: 'BAR',
        observations: 'Sin incidencias.',
      },
    };

    service.getShotPressures(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/pressures/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockPressuresResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotPressuresResource.value()).toEqual(mockPressuresResponse);
    });

    service.setShotPressure(DEMO_TRIAL_ID, seriesId, shotId, mockPressuresResponse.pressuresData);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/pressures/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(mockPressuresResponse.pressuresData);
    putReq.flush(mockPressuresResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotPressuresResource.value()).toEqual(mockPressuresResponse);
    });

    const fetchPromise = service.fetchShotPressures(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const fetchReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/pressures/series/${seriesId}/shots/${shotId}`);
    expect(fetchReq.request.method).toBe('GET');
    fetchReq.flush(mockPressuresResponse);
    TestBed.tick();

    const directResult = await fetchPromise;
    expect(directResult).toEqual(mockPressuresResponse);
  });

  it('handles armament equipment loading, planning armament fetch, shot armament fetch and PUT resource', async () => {
    const seriesId = 'series-1';
    const shotId = 'shot-1';

    const mockWeapons: ArmamentEquipmentItem[] = [
      {
        id: 1,
        tag: 'W-01',
        serialNumber: 'SN-001',
        denominationId: 10,
        denominationName: 'Weapon 105mm',
        modelName: 'M1',
      },
    ];

    // loadArmamentEquipmentItems
    const weaponsPromise = service.loadArmamentEquipmentItems('WEAPON');
    TestBed.tick();

    const weaponsReq = httpMock.expectOne(`${PLANNING_ROOT_URL}/equipment/items?itemType=WEAPON`);
    expect(weaponsReq.request.method).toBe('GET');
    weaponsReq.flush({ items: mockWeapons });
    TestBed.tick();

    const weapons = await weaponsPromise;
    expect(weapons).toEqual(mockWeapons);

    // fetchPlanningArmament
    const mockPlanningArmament: PlanningArmamentResponse = {
      series: [{ seriesId: 's-1', shots: [{ shotId: 'sh-1', armament: { weaponExternalId: 1 } }] }],
    };
    const planningArmamentPromise = service.fetchPlanningArmament(DEMO_TRIAL_ID);
    TestBed.tick();

    const planArmReq = httpMock.expectOne(`${PLANNING_ROOT_URL}/fire-trials/${DEMO_TRIAL_ID}/planning/armament`);
    expect(planArmReq.request.method).toBe('GET');
    planArmReq.flush(mockPlanningArmament);
    TestBed.tick();

    const planArmResult = await planningArmamentPromise;
    expect(planArmResult).toEqual(mockPlanningArmament);

    // fetchShotArmament
    const mockShotArmament: ShotArmamentResponse = {
      armamentData: {
        weapon: mockWeapons[0],
        tube: null,
        observations: 'All good',
      },
    };
    const shotArmPromise = service.fetchShotArmament(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const shotArmReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/armament/series/${seriesId}/shots/${shotId}`);
    expect(shotArmReq.request.method).toBe('GET');
    shotArmReq.flush(mockShotArmament);
    TestBed.tick();

    const shotArmResult = await shotArmPromise;
    expect(shotArmResult).toEqual(mockShotArmament);

    // setShotArmament
    const updateBody = { weaponId: 1, tubeId: null, observations: 'Updated armament' };
    service.setShotArmament(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putArmReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/armament/series/${seriesId}/shots/${shotId}`);
    expect(putArmReq.request.method).toBe('PUT');
    expect(putArmReq.request.body).toEqual(updateBody);
    putArmReq.flush(mockShotArmament);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotArmamentResource.value()).toEqual(mockShotArmament);
    });
  });

  it('handles bulk armament configuration via HTTP resource and Promise', async () => {
    const bulkPayload: ArmamentBulkConfigurationRequest = {
      assignedSeriesIds: ['s-1', 's-2'],
      weaponId: 21017,
      tubeId: 21099,
      observations: 'Bulk configuration applied',
    };

    // applyArmamentBulkConfiguration (httpResource)
    service.applyArmamentBulkConfiguration(DEMO_TRIAL_ID, bulkPayload);
    TestBed.tick();

    const bulkResourceReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/armament/bulk-configuration`);
    expect(bulkResourceReq.request.method).toBe('POST');
    expect(bulkResourceReq.request.body).toEqual(bulkPayload);
    bulkResourceReq.flush(null);

    await waitFor(() => {
      TestBed.tick();
      expect(service.applyArmamentBulkConfigurationResource.hasValue()).toBe(true);
    });

    // bulkConfigureArmament (Promise)
    const directPromise = service.bulkConfigureArmament(DEMO_TRIAL_ID, bulkPayload);
    TestBed.tick();

    const bulkDirectReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/armament/bulk-configuration`);
    expect(bulkDirectReq.request.method).toBe('POST');
    expect(bulkDirectReq.request.body).toEqual(bulkPayload);
    bulkDirectReq.flush(null);
    TestBed.tick();

    await expect(directPromise).resolves.toBeUndefined();
  });

  it('handles shot munitions (Widget 20) GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-10';
    const shotId = 'shot-20';
    const mockMunitionResponse: ShotMunitionResponse = {
      munitionData: [
        {
          componentId: '550e8400-e29b-41d4-a716-446655440210',
          identificationData: {
            denominationId: '550e8400-e29b-41d4-a716-446655440212',
            batch: 'LOT-HE-2026-01',
            clientNumber: 'CL-00123',
            observations: 'Ident OK',
          },
          weightData: {
            balanceId: 21031,
            weight: 41.2,
            weightUnit: 'G',
            weighingDateTime: '2026-08-21T10:34:12Z',
          },
          conditioningData: {
            climaticChamberId: 21045,
            chamberEntryDateTime: '2026-08-21T08:00:00Z',
            chamberExitDateTime: '2026-08-21T10:30:00Z',
          },
        },
      ],
    };

    // getShotMunition (httpResource)
    service.getShotMunition(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/munitions/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockMunitionResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotMunitionResource.value()).toEqual(mockMunitionResponse);
    });

    // fetchShotMunition (Promise)
    const directFetchPromise = service.fetchShotMunition(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/munitions/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockMunitionResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockMunitionResponse);

    // setShotMunition (httpResource)
    const updateBody: ShotMunitionRequest = {
      components: [
        {
          componentId: '550e8400-e29b-41d4-a716-446655440210',
          identificationData: {
            denominationId: '550e8400-e29b-41d4-a716-446655440212',
            batch: 'LOT-HE-2026-02',
            clientNumber: 'CL-00124',
          },
        },
      ],
    };

    service.setShotMunition(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/munitions/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockMunitionResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotMunitionResource.value()).toEqual(mockMunitionResponse);
    });

    // updateShotMunition (Promise)
    const updatePromise = service.updateShotMunition(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/munitions/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockMunitionResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockMunitionResponse);
  });

  it('handles shot manometer pressures (Widget 21) GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-21';
    const shotId = 'shot-21';
    const mockManometerResponse: ShotManometerPressuresResponse = {
      manometerPressuresData: {
        pressureGaugeId: '6e5c0c80-1547-4ccf-92fa-ec4df8850f40',
        crusherId: 'a4f3507a-a711-4741-b5dc-85e83d2d8b70',
        probeId: '3ebaa16a-f7d3-48f3-9f8f-b0148b133bb4',
        h1: 125.4,
        h1Unit: DistanceUnitEnum.UM,
        h2: 126.1,
        h2Unit: DistanceUnitEnum.UM,
        h3: 125.8,
        h3Unit: DistanceUnitEnum.UM,
        h4: 126.0,
        h4Unit: DistanceUnitEnum.UM,
        h5: 125.6,
        h5Unit: DistanceUnitEnum.UM,
        observations: 'Lecturas registradas',
      },
    };

    // getShotManometerPressures (httpResource)
    service.getShotManometerPressures(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/manometer-pressures/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockManometerResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotManometerPressuresResource.value()).toEqual(mockManometerResponse);
    });

    // fetchShotManometerPressures (Promise)
    const directFetchPromise = service.fetchShotManometerPressures(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(
      `${EXECUTION_BASE_URL}/manometer-pressures/series/${seriesId}/shots/${shotId}`,
    );
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockManometerResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockManometerResponse);

    // setShotManometerPressures (httpResource)
    const updateBody: ShotManometerPressuresRequest = {
      pressureGaugeId: '6e5c0c80-1547-4ccf-92fa-ec4df8850f40',
      crusherId: 'a4f3507a-a711-4741-b5dc-85e83d2d8b70',
      probeId: '3ebaa16a-f7d3-48f3-9f8f-b0148b133bb4',
      h1: 125.4,
      h1Unit: DistanceUnitEnum.UM,
      h2: 126.1,
      h2Unit: DistanceUnitEnum.UM,
      h3: 125.8,
      h3Unit: DistanceUnitEnum.UM,
      h4: 126.0,
      h4Unit: DistanceUnitEnum.UM,
      h5: 125.6,
      h5Unit: DistanceUnitEnum.UM,
      observations: 'Lecturas registradas',
    };

    service.setShotManometerPressures(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/manometer-pressures/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockManometerResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotManometerPressuresResource.value()).toEqual(mockManometerResponse);
    });

    // updateShotManometerPressures (Promise)
    const updatePromise = service.updateShotManometerPressures(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(
      `${EXECUTION_BASE_URL}/manometer-pressures/series/${seriesId}/shots/${shotId}`,
    );
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockManometerResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockManometerResponse);
  });

  it('handles jlt-mao GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-jlt-mao';
    const shotId = 'shot-jlt-mao';
    const mockResponse = {}; // Mock vacío suficiente para el test de enrutamiento
    const updateBody = {};

    // GET (httpResource)
    service.getShotJltMao(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-mao/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotShotJltMaoResource.value()).toEqual(mockResponse);
    });

    // fetch (Promise)
    const directFetchPromise = service.fetchShotJltMao(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-mao/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);

    // PUT (httpResource)
    service.setShotJltMao(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-mao/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotJltMaoResource.value()).toEqual(mockResponse);
    });

    // update (Promise)
    const updatePromise = service.updateShotJltMao(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/jlt-mao/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockResponse);
  });

  it('handles mao-topography GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-mao-topography';
    const shotId = 'shot-mao-topography';
    const mockResponse = {}; // Mock vacío suficiente para el test de enrutamiento
    const updateBody = {};

    // GET (httpResource)
    service.getShotMaoTopography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/mao-topography/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotShotMaoTopographyResource.value()).toEqual(mockResponse);
    });

    // fetch (Promise)
    const directFetchPromise = service.fetchShotMaoTopography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/mao-topography/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);

    // PUT (httpResource)
    service.setShotMaoTopography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/mao-topography/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotMaoTopographyResource.value()).toEqual(mockResponse);
    });

    // update (Promise)
    const updatePromise = service.updateShotMaoTopography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/mao-topography/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockResponse);
  });

  it('handles topography GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-topography';
    const shotId = 'shot-topography';
    const mockResponse = {}; // Mock vacío suficiente para el test de enrutamiento
    const updateBody = {};

    // GET (httpResource)
    service.getShotTopography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/topography/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotShotTopographyResource.value()).toEqual(mockResponse);
    });

    // fetch (Promise)
    const directFetchPromise = service.fetchShotTopography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/topography/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);

    // PUT (httpResource)
    service.setShotTopography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/topography/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotTopographyResource.value()).toEqual(mockResponse);
    });

    // update (Promise)
    const updatePromise = service.updateShotTopography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/topography/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockResponse);
  });

  it('handles trajectography GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-trajectography';
    const shotId = 'shot-trajectography';
    const mockResponse = {}; // Mock vacío suficiente para el test de enrutamiento
    const updateBody = {};

    // GET (httpResource)
    service.getShotTrajectography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/trajectography/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotShotTrajectographyResource.value()).toEqual(mockResponse);
    });

    // fetch (Promise)
    const directFetchPromise = service.fetchShotTrajectography(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/trajectography/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);

    // PUT (httpResource)
    service.setShotTrajectography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/trajectography/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotTrajectographyResource.value()).toEqual(mockResponse);
    });

    // update (Promise)
    const updatePromise = service.updateShotTrajectography(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/trajectography/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockResponse);
  });

  it('handles acoustic-level GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-acoustic-level';
    const shotId = 'shot-acoustic-level';
    const mockResponse = {}; // Mock vacío suficiente para el test de enrutamiento
    const updateBody = {};

    // GET (httpResource)
    service.getShotAcousticLevel(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/acoustic-level/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotShotAcousticLevelResource.value()).toEqual(mockResponse);
    });

    // fetch (Promise)
    const directFetchPromise = service.fetchShotAcousticLevel(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/acoustic-level/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    const directResult = await directFetchPromise;
    expect(directResult).toEqual(mockResponse);

    // PUT (httpResource)
    service.setShotAcousticLevel(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/acoustic-level/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateShotAcousticLevelResource.value()).toEqual(mockResponse);
    });

    // update (Promise)
    const updatePromise = service.updateShotAcousticLevel(DEMO_TRIAL_ID, seriesId, shotId, updateBody as any);
    TestBed.tick();

    const putPromiseReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/acoustic-level/series/${seriesId}/shots/${shotId}`);
    expect(putPromiseReq.request.method).toBe('PUT');
    expect(putPromiseReq.request.body).toEqual(updateBody);
    putPromiseReq.flush(mockResponse);
    TestBed.tick();

    const updateResult = await updatePromise;
    expect(updateResult).toEqual(mockResponse);
  });

  it('handles video data GET and PUT resources and direct fetch', async () => {
    const seriesId = 'series-video';
    const shotId = 'shot-video';
    const mockResponse: ShotVideoDataResponse = {
      highSpeedVideoData: {
        cameraId: 'camera-1',
        recorderId: 'recorder-1',
        channel: 1,
        measureId: 'measure-1',
      },
      conventionalVideoData: null,
    };
    const updateBody: ShotVideoDataRequest = mockResponse;

    service.getShotVideoData(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/video/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.shotVideoDataResource.value()).toEqual(mockResponse);
    });

    const directFetchPromise = service.fetchShotVideoData(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const directGetReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/video/series/${seriesId}/shots/${shotId}`);
    expect(directGetReq.request.method).toBe('GET');
    directGetReq.flush(mockResponse);
    TestBed.tick();

    await expect(directFetchPromise).resolves.toEqual(mockResponse);

    const updatePromise = service.updateShotVideoData(DEMO_TRIAL_ID, seriesId, shotId, updateBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${EXECUTION_BASE_URL}/video/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(updateBody);
    putReq.flush(mockResponse);
    TestBed.tick();

    await expect(updatePromise).resolves.toEqual(mockResponse);
  });
});
