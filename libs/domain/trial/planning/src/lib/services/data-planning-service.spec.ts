import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UpsertTrialPlanningInfo } from '../utils-models/trial-planing-info.model';
import { DataPlanningService } from './data-planning-service';

const MOCK_URLS = {
  PLANNING: 'http://api.test/planning',
  BASE: 'http://api.test/center',
};

const MOCK_IDS = {
  TRIAL: 'trial-123',
};

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_URLS.PLANNING,
  injectApiUrl: () => MOCK_URLS.BASE,
}));

describe('DataPlanningService', () => {
  let service: DataPlanningService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataPlanningService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DataPlanningService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
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

  describe('loadGeneralData', () => {
    it('should load general data', () => {
      const mockResponse = { id: 1, observation: 'test', trialId: 123 };

      service.loadGeneralData(MOCK_IDS.TRIAL).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      expectHttpRequest(`${MOCK_URLS.BASE}/planning-general-data/${MOCK_IDS.TRIAL}`, 'GET', mockResponse);
    });
  });

  describe('getFireTrialPlanningInfo', () => {
    it('should fetch fire trial planning info', () =>
      fakeAsync(() => {
        const mockResponse = {
          id: 123,
          fireTrialId: MOCK_IDS.TRIAL,
          startDate: '2023-01-01',
          endDate: '2023-01-31',
        };

        service.getFireTrialPlanningInfo(MOCK_IDS.TRIAL);
        tick();

        expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`, 'GET', mockResponse);
      }));

    it('should handle error when fetching planning info', () =>
      fakeAsync(() => {
        service.getFireTrialPlanningInfo(MOCK_IDS.TRIAL);
        tick();

        const req = httpTestingController.expectOne(
          `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`,
        );
        req.error(new ErrorEvent('Network error'));

        tick();

        expect(service.getPlanningDataResource.isLoading()).toBe(false);
        expect(service.getPlanningDataResource.status()).toBe('error');
        expect(service.getPlanningDataResource.error()).toBeTruthy();
        expect(service.getPlanningDataResource.hasValue()).toBe(false);
      }));
  });

  describe('updateTrialPlanningInfoData', () => {
    it('should update trial planning info data', () =>
      fakeAsync(() => {
        const updateData: UpsertTrialPlanningInfo & { fireTrialId: string } = {
          fireTrialId: MOCK_IDS.TRIAL,
          specimens: [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        const mockResponse = { ...updateData, id: 1 };

        service.updateTrialPlanningInfoData(updateData);
        tick();

        expectHttpRequest(
          `${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`,
          'PUT',
          mockResponse,
          updateData,
        );
      }));
  });

  describe('Specimens', () => {
    it('should get specimens when triggered', () =>
      fakeAsync(() => {
        const mockResponse = {
          page: 1,
          pageSize: 100,
          totalElements: 1,
          items: [
            {
              id: '1',
              name: { es: 'Specimen 1', en: 'Specimen 1' },
              label: 'Specimen 1',
              type: 'denomination',
              active: true,
            },
          ],
        };

        service.getSpecimens();
        tick();

        expectHttpRequest(`${MOCK_URLS.BASE}/specimens?pageSize=100`, 'GET', mockResponse);
      }));

    it('should refresh specimens (reset trigger)', () =>
      fakeAsync(() => {
        service.getSpecimens();
        tick();
        expectHttpRequest(`${MOCK_URLS.BASE}/specimens?pageSize=100`, 'GET', {
          page: 1,
          pageSize: 100,
          totalElements: 0,
          items: [],
        });

        service.refreshSpecimens();
        tick();

        httpTestingController.expectNone(`${MOCK_URLS.BASE}/specimens?pageSize=100`);
      }));
  });

  describe('Users', () => {
    it('should get users when triggered', () =>
      fakeAsync(() => {
        const mockResponse = [{ id: 1, name: 'User 1' }];

        service.getUsers();
        tick();

        expectHttpRequest(`${MOCK_URLS.BASE}/planning-users`, 'GET', mockResponse);
      }));

    it('should refresh users (reset trigger)', () =>
      fakeAsync(() => {
        service.getUsers();
        tick();
        expectHttpRequest(`${MOCK_URLS.BASE}/planning-users`, 'GET', []);

        service.refreshUsers();
        tick();

        expect(service.usersResource.value()).toBeUndefined();
        httpTestingController.expectNone(`${MOCK_URLS.BASE}/planning-users`);
      }));
  });

  describe('Resource States & Edge Cases', () => {
    it('should not make request when params are null/initial state', () =>
      fakeAsync(() => {
        tick();

        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);
        httpTestingController.expectNone(`${MOCK_URLS.BASE}/`);

        expect(service.getPlanningDataResource.value()).toBeUndefined();
        expect(service.updatePlanningDataResource.value()).toBeUndefined();
        expect(service.specimenResource.value()).toBeUndefined();
        expect(service.usersResource.value()).toBeUndefined();
      }));
  });
});
