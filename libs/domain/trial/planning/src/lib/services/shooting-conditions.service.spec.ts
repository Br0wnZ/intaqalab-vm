import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ShootingConditionsService } from './shooting-conditions.service';

const MOCK_URLS = {
  PLANNING: 'http://api.test/planning',
  FIRE_TRIALS: 'http://api.test/fire-trials',
};

const MOCK_IDS = {
  TRIAL: 'trial-123',
};

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_URLS.PLANNING,
  injectFireTrialsEndpoint: () => MOCK_URLS.FIRE_TRIALS,
}));

describe('ShootingConditionsService', () => {
  let service: ShootingConditionsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [ShootingConditionsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShootingConditionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    httpTestingController.verify();
  });

  const expectHttpRequest = <T>(url: string, method: string, response: T | null, body?: unknown) => {
    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toBe(method);

    if (body) {
      expect(req.request.body).toEqual(body);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.flush(response as any);
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getShootingConditions', () => {
    it('should fetch shooting conditions for a trial', async () => {
      const mockResponse = [
        {
          seriesId: 'series-1',
          seriesName: 'Serie A',
          shots: [],
        },
      ];

      service.getShootingConditions(MOCK_IDS.TRIAL);
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/conditions`, 'GET', mockResponse);
    });

    it('should handle error when fetching shooting conditions', async () => {
      service.getShootingConditions(MOCK_IDS.TRIAL);
      TestBed.tick();

      const req = httpTestingController.expectOne(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/conditions`,
      );
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('updateShootingConditions', () => {
    it('should update shooting conditions', async () => {
      const request = {
        trialId: MOCK_IDS.TRIAL,
        shots: [
          {
            shotId: 'shot-1',
            date: '2025-06-01',
            targetTypeId: 'type-1',
            targetMaterialId: 'material-1',
            targetDimensionsId: 'dimensions-1',
            targetThicknessId: 'thickness-1',
            distance: 100,
            orientation: 0,
            targetInclination: 0,
            elevation: 10,
            angle: 45,
            range: 500,
            impactZoneId: 'zone-1',
            loadingZoneId: '',
            functioningHeight: 50,
            nominalSpeed: 0,
            powderWeight: 3.5,
            projectWeight: 0,
            observations: 'Test observation',
          },
        ],
      };

      service.updateShootingConditions(request);
      TestBed.tick();

      const expectedBody = {
        shots: request.shots,
      };

      expectHttpRequest(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/conditions`,
        'PUT',
        null,
        expectedBody,
      );
    });
  });

  describe('Resource States & Edge Cases', () => {
    it('should not make request when params are null', () => {
      TestBed.tick();
      httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/conditions`);
      expect(service.conditionsResource.value()).toEqual({
        units: {
          distance: null,
          orientation: null,
          targetInclination: null,
          elevation: null,
          angle: null,
          range: null,
          functioningHeight: null,
          nominalSpeed: null,
          powderWeight: null,
        },
        series: [],
      });
    });
  });

  describe('Master Data Resources (Lazy Loading)', () => {
    it('should lazy load target types', async () => {
      expect(service.getTargetTypesResource.value()).toEqual([]);

      service.getTargetTypes();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/target-types?pageSize=100`, 'GET', [{ id: '1', label: 'Type 1' }]);
      expect(service.getTargetTypesResource.value()).toBeDefined();
    });

    it('should lazy load target materials', async () => {
      expect(service.getTargetMaterialsResource.value()).toEqual([]);

      service.getTargetMaterials();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/target-materials?pageSize=100`, 'GET', []);
    });

    it('should lazy load target dimensions', async () => {
      expect(service.getTargetDimensionsResource.value()).toEqual([]);

      service.getTargetDimensions();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/target-dimensions?pageSize=100`, 'GET', []);
    });

    it('should lazy load target thicknesses', async () => {
      expect(service.getTargetThicknessesResource.value()).toEqual([]);

      service.getTargetThicknesses();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/target-thicknesses?pageSize=100`, 'GET', []);
    });

    it('should lazy load impact zones', async () => {
      expect(service.getImpactZonesResource.value()).toEqual([]);

      service.getImpactZones();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/impact-zones?pageSize=100`, 'GET', []);
    });

    it('should lazy load loading zones', async () => {
      expect(service.getLoadingZonesResource.value()).toEqual([]);

      service.getLoadingZones();
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.PLANNING}/loading-zone?pageSize=1000`, 'GET', []);
    });
  });

  describe('getTrialSchedules', () => {
    it('should fetch trial schedules for a trial', () => {
      const mockSchedules = [
        { date: '2025-11-22T00:00:00.000Z', lineOfShootId: '1' },
        { date: '2025-11-24T00:00:00.000Z', lineOfShootId: '1' },
      ];

      service.getTrialSchedules(MOCK_IDS.TRIAL);
      TestBed.tick();

      expectHttpRequest(`${MOCK_URLS.FIRE_TRIALS}/${MOCK_IDS.TRIAL}/schedule`, 'GET', mockSchedules);
    });

    it('should not make schedule request when params are null', () => {
      TestBed.tick();
      httpTestingController.expectNone(`${MOCK_URLS.FIRE_TRIALS}/${MOCK_IDS.TRIAL}/schedule`);
      expect(service.getTrialSchedulesResource.value()).toEqual([]);
    });
  });
});
