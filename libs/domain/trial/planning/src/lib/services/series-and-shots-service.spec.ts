import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AddNewSerieRequest, ReorderSeriesRequest, Serie, Shot } from '../utils-models/series-and-shots.model';
import type { UpdateShotRequest } from '../utils-models/update-shot-request.model';
import type { UpsertTrialSerieRequest } from '../utils-models/upsert-trial-serie-info.model';
import { SeriesAndShotsService } from './series-and-shots-service';

const MOCK_URLS = {
  PLANNING: 'http://api.test/planning',
};

const MOCK_IDS = {
  TRIAL: 'trial-123',
  SERIE: 'serie-123',
  SHOT: 'shot-123',
};

const createMockSerie = (overrides?: Partial<Serie>): Serie => ({
  id: MOCK_IDS.SERIE,
  name: 'Test Serie',
  executionOrder: 1,
  observations: 'Observaciones',
  shots: [],
  ...overrides,
});

const createMockShot = (overrides?: Partial<Shot>): Shot => ({
  id: MOCK_IDS.SHOT,
  globalNumber: 1,
  observation: 'Test Shot',
  ...overrides,
});

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_URLS.PLANNING,
}));

describe('SeriesAndShotsService', () => {
  let service: SeriesAndShotsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeriesAndShotsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SeriesAndShotsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const expectHttpRequest = async <T>(url: string, method: string, response: T | null, body?: unknown) => {
    const req = httpTestingController.expectOne(url);
    expect(req.request.method).toBe(method);

    if (body) {
      expect(req.request.body).toEqual(body);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.flush(response as any);
    await Promise.resolve();
    TestBed.tick();
  };

  describe('getSeriesAndShots', () => {
    it('should fetch series and shots for a trial', async () => {
      const mockResponse = [createMockSerie()];

      service.getSeriesAndShots(MOCK_IDS.TRIAL);
      TestBed.tick();

      await expectHttpRequest(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`,
        'GET',
        mockResponse,
      );
    });

    it('should handle error when fetching series and shots', async () => {
      service.getSeriesAndShots(MOCK_IDS.TRIAL);
      TestBed.tick();

      const req = httpTestingController.expectOne(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`,
      );
      req.error(new ErrorEvent('Network error'));
      await Promise.resolve();
      TestBed.tick();
    });
  });

  describe('addNewSerie', () => {
    it('should add a new serie', async () => {
      const request: AddNewSerieRequest = {
        trialId: MOCK_IDS.TRIAL,
        name: 'New Serie',
        observations: 'observations',
        numberOfShots: 5,
      };

      const mockResponse = { series: [], shots: [] };

      service.addNewSerie(request);
      TestBed.tick();

      await expectHttpRequest(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`,
        'POST',
        mockResponse,
        request,
      );
    });

    it('should reset addNewSerie params', () => {
      const request: AddNewSerieRequest = {
        trialId: MOCK_IDS.TRIAL,
        name: 'New Serie',
        numberOfShots: 5,
      };

      service.addNewSerie(request);
      service.resetAddNewSerie();
      TestBed.tick();

      httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`);

      expect(service.addNewSerieResource.value()).toBeUndefined();
    });
  });

  describe('updateSerie', () => {
    it('should update an existing serie', async () => {
      const request: UpsertTrialSerieRequest = {
        id: MOCK_IDS.SERIE,
        name: 'Updated Serie Name',
        observations: 'observations',
      };

      service.updateSerie(request);
      TestBed.tick();

      await expectHttpRequest(`${MOCK_URLS.PLANNING}/planning/series/${MOCK_IDS.SERIE}`, 'PUT', null, {
        name: request.name,
        observations: request.observations,
      });
    });

    it('should reset updateSerie params', () => {
      const request: UpsertTrialSerieRequest = { id: MOCK_IDS.SERIE, name: 'S', observations: 'obs' };
      service.updateSerie(request);
      service.resetUpdateSerie();
      TestBed.tick();
      httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/planning/series/${MOCK_IDS.SERIE}`);
    });
  });

  describe('deleteSerie', () => {
    it('should delete a serie', async () => {
      service.deleteSerie(MOCK_IDS.SERIE);
      TestBed.tick();

      await expectHttpRequest(`${MOCK_URLS.PLANNING}/planning/series/${MOCK_IDS.SERIE}`, 'DELETE', null);
    });
  });

  describe('reorderSeries', () => {
    it('should reorder series', async () => {
      const request: ReorderSeriesRequest = {
        trialId: MOCK_IDS.TRIAL,
        seriesIds: ['1', '2', '3'],
      };

      service.reorderSeries(request);
      TestBed.tick();

      await expectHttpRequest(
        `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series/reorder`,
        'PUT',
        null,
        { seriesIds: request.seriesIds },
      );
    });
  });

  describe('addShotToSerie', () => {
    it('should add a shot to a serie', async () => {
      const request = {
        serieId: MOCK_IDS.SERIE,
        name: 'New Shot',
        order: 1,
      };

      const mockShot = createMockShot();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.addShotToSerie(request as any);
      TestBed.tick();

      await expectHttpRequest(`${MOCK_URLS.PLANNING}/planning/series/${MOCK_IDS.SERIE}/shots`, 'POST', mockShot, {
        name: request.name,
        order: request.order,
      });
    });
  });

  describe('updateShot', () => {
    it('should update a shot', async () => {
      const request: UpdateShotRequest = {
        shotId: MOCK_IDS.SHOT,
        observation: 'Updated Observation',
      };

      service.updateShot(request);
      TestBed.tick();

      await expectHttpRequest(`${MOCK_URLS.PLANNING}/planning/shots/${MOCK_IDS.SHOT}`, 'PUT', null, request);
    });
  });

  describe('deleteShot', () => {
    it('should delete a shot', async () => {
      service.deleteShot(MOCK_IDS.SHOT);
      TestBed.tick();

      await expectHttpRequest(`${MOCK_URLS.PLANNING}/planning/shots/${MOCK_IDS.SHOT}`, 'DELETE', null);
    });
  });

  describe('Resource States & Edge Cases', () => {
    it('should not make request when params are null', () => {
      TestBed.tick();

      httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);
      httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);

      expect(service.seriesAndShotsResource.value()).toBeUndefined();
    });

    it('should handle multiple calls correctly', async () => {
      service.getSeriesAndShots(MOCK_IDS.TRIAL);
      TestBed.tick();
      await expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`, 'GET', []);

      service.getSeriesAndShots(MOCK_IDS.TRIAL);
      TestBed.tick();
      await expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/series`, 'GET', []);
    });
  });
});
