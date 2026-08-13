/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DistanceUnitEnum } from '@intaqalab/models';
import { waitFor } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WidgetId } from '../execution/models/widget-id.enum';
import { ExecutionService } from './execution.service';

const DEMO_TRIAL_ID = 'trial-456';
const BASE_URL = `http://localhost:3000/api/execution/fire-trials/${DEMO_TRIAL_ID}/execution`;

vi.mock('@intaqalab/config', () => ({
  injectExecutionEndpoint: () => 'http://localhost:3000/api/execution',
  injectPlanningEndpoint: () => 'http://localhost:3000/api/planning',
  injectFireTrialsEndpoint: () => 'http://localhost:3000/api/fire-trials',
}));

describe('ExecutionService', () => {
  let service: ExecutionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ExecutionService],
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

    const req = httpMock.expectOne(`${BASE_URL}/state`);
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

    const req = httpMock.expectOne(`${BASE_URL}/progress`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.executionProgressResource.value()).toEqual(mockResponse);
    });
  });

  it('should GET and PUT security countdown', async () => {
    const mockState = {
      status: 'ACTIVE' as const,
      targetEndTime: '2026-03-03T10:20:30Z',
      remainingSeconds: 300,
    };

    // GET
    service.getSecurityCountdownState(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/security-countdown`);
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

    const putReq = httpMock.expectOne(`${BASE_URL}/security-countdown`);
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
    const pauseReq = httpMock.expectOne(`${BASE_URL}/pause`);
    expect(pauseReq.request.method).toBe('POST');
    pauseReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();

    // Interrupt
    service.interruptExecution(DEMO_TRIAL_ID, 'anomaly');
    TestBed.tick();
    const interruptReq = httpMock.expectOne(`${BASE_URL}/interrupt`);
    expect(interruptReq.request.method).toBe('POST');
    expect(interruptReq.request.body).toEqual({ reason: 'anomaly' });
    interruptReq.flush(null, { status: 204, statusText: 'No Content' });
    TestBed.tick();

    // Resume
    service.resumeExecution(DEMO_TRIAL_ID);
    TestBed.tick();
    const resumeReq = httpMock.expectOne(`${BASE_URL}/resume`);
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
    const mockPlanning = {
      goal: 'Testing api alignment',
      specimens: [{ specimenId: 'spec-1' }],
      planningUser: { id: 'user-1', name: 'Planning User' },
      executionDate: '2026-03-03',
    };

    // GET Planning
    service.getExecutionPlanning(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/planning`);
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

    const putReq = httpMock.expectOne(`${BASE_URL}/planning`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(reqBody);
    putReq.flush(mockPlanning);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updatePlanningResource.value()).toEqual(mockPlanning);
    });
  });

  it('should GET and POST planning state and approve', async () => {
    const mockState = { version: 1, isApprovedByClient: false, updatedAt: '2026-03-03T11:00:00Z' };

    // GET state
    service.getExecutionPlanningState(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/planning/state`);
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

    const postReq = httpMock.expectOne(`${BASE_URL}/planning/approve`);
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

    const getRoleReq = httpMock.expectOne(`${BASE_URL}/preferences/roles/HEAD_BALLISTICS_UNIT`);
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

    const putRoleReq = httpMock.expectOne(`${BASE_URL}/preferences/roles/HEAD_BALLISTICS_UNIT`);
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

    const getUserReq = httpMock.expectOne(`${BASE_URL}/preferences/users/john_doe`);
    expect(getUserReq.request.method).toBe('GET');
    getUserReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.preferencesByUserResource.value()).toEqual(mockPrefs);
    });

    // PUT by user
    service.updatePreferencesByUser(DEMO_TRIAL_ID, 'john_doe', [WidgetId.SHOT, WidgetId.EXECUTION_PREP_TECH]);
    TestBed.tick();

    const putUserReq = httpMock.expectOne(`${BASE_URL}/preferences/users/john_doe`);
    expect(putUserReq.request.method).toBe('PUT');
    expect(putUserReq.request.body).toEqual(mockPrefs);
    putUserReq.flush(mockPrefs);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updatePreferencesByUserResource.value()).toEqual(mockPrefs);
    });
  });

  it('should GET and PUT readiness', async () => {
    const mockReadiness = {
      profilesReadiness: [
        {
          profile: 'VELOCITIES' as const,
          seriesReadiness: [{ seriesId: 's-1', isReady: true, observations: 'ok' }],
        },
      ],
    };

    // GET readiness
    service.getProfilesReadiness(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/readiness`);
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

    const putReq = httpMock.expectOne(`${BASE_URL}/readiness/profiles/VELOCITIES/series/s-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(singleSeriesBody);
    putReq.flush(singleSeriesResponse);

    await expect(singleSeriesPromise).resolves.toEqual(singleSeriesResponse);
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

    const getReq = httpMock.expectOne(`${BASE_URL}/jlt-preparation?seriesId=${encodeURIComponent(seriesId)}`);
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

    const putReq = httpMock.expectOne(`${BASE_URL}/jlt-preparation/series/${seriesId}`);
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

    const selectReq = httpMock.expectOne(`${BASE_URL}/jlt-preparation/shots/${shotId}/active`);
    expect(selectReq.request.method).toBe('POST');
    selectReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.selectShotResource.status()).toBe('resolved');
    });

    service.fireShot(DEMO_TRIAL_ID);
    TestBed.tick();

    const fireReq = httpMock.expectOne(`${BASE_URL}/jlt-preparation/fire`);
    expect(fireReq.request.method).toBe('POST');
    fireReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.fireShotResource.status()).toBe('resolved');
    });
  });

  it('should GET and PUT equipment selection using the new aligned URL', async () => {
    const mockResponse: string | number | boolean | object | null = [];

    // GET equipment selection
    service.getEquipmentSelector(DEMO_TRIAL_ID);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/equipment-selection`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.equipmentSelectorResource.value()).toEqual(mockResponse);
    });

    // PUT equipment selection
    const putReqBody: any[] = [];
    service.updateEquipmentSelector(DEMO_TRIAL_ID, putReqBody);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${BASE_URL}/equipment-selection`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(putReqBody);
    putReq.flush(null, { status: 200, statusText: 'OK' });

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateEquipmentSelectorResource.value()).toBeUndefined();
    });
  });

  it('should GET and PUT JLT shot data using series and shot ids', async () => {
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

    service.getJltShotData(DEMO_TRIAL_ID, seriesId, shotId);
    TestBed.tick();

    const getReq = httpMock.expectOne(`${BASE_URL}/jlt-shot-data/series/${seriesId}/shots/${shotId}`);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.jltShotDataResource.value()).toEqual(mockResponse);
    });

    service.setJltShotData(DEMO_TRIAL_ID, seriesId, shotId, mockResponse.jltData);
    TestBed.tick();

    const putReq = httpMock.expectOne(`${BASE_URL}/jlt-shot-data/series/${seriesId}/shots/${shotId}`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual(mockResponse.jltData);
    putReq.flush(mockResponse);

    await waitFor(() => {
      TestBed.tick();
      expect(service.updateJltShotDataResource.value()).toEqual(mockResponse);
    });
  });
});
