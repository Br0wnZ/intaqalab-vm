import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArmamentService } from './armament-service';

const MOCK_URLS = {
  PLANNING: 'http://api.test/planning',
};

const MOCK_IDS = {
  TRIAL: 'trial-123',
};

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_URLS.PLANNING,
}));

describe('ArmamentService', () => {
  let service: ArmamentService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArmamentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArmamentService);
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
    tick();
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getArmament', () => {
    it('should fetch armament data for a trial', () =>
      fakeAsync(() => {
        const mockResponse = {
          series: [
            {
              seriesId: 'series-1',
              seriesName: 'Serie A',
              shots: [
                {
                  shotId: 'shot-1',
                  armament: {
                    weaponName: 'Obús 105mm',
                    weaponExternalId: 'weapon-1',
                    tubeName: 'Tubo 1',
                    tubeExternalId: 'tube-1',
                    isInstrumented: false,
                    tubeLifePercentage: 75,
                    observations: '',
                  },
                },
              ],
            },
          ],
        };

        service.getArmament(MOCK_IDS.TRIAL);
        tick();

        expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/armament`, 'GET', mockResponse);
      }));

    it('should handle error when fetching armament data', () =>
      fakeAsync(() => {
        service.getArmament(MOCK_IDS.TRIAL);
        tick();

        const req = httpTestingController.expectOne(`${MOCK_URLS.PLANNING}/${MOCK_IDS.TRIAL}/planning/armament`);
        req.error(new ErrorEvent('Network error'));
        tick();
      }));
  });

  describe('updateArmament', () => {
    it('should update armament data for a trial', () =>
      fakeAsync(() => {
        const body = {
          shots: [
            {
              shotId: 'shot-1',
              weaponExternalId: 'weapon-2',
              tubeExternalId: 'tube-2',
              isInstrumented: true,
              lifeUsefulPercentage: 50,
              observations: 'Updated',
            },
          ],
        };

        service.updateArmament(MOCK_IDS.TRIAL, body);
        tick();

        expectHttpRequest(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/armament`, 'PUT', null, body);
      }));

    it('should handle error when updating armament data', () =>
      fakeAsync(() => {
        const body = {
          shots: [
            {
              shotId: 'shot-1',
              weaponExternalId: 'weapon-1',
              tubeExternalId: 'tube-1',
              isInstrumented: false,
              lifeUsefulPercentage: 100,
              observations: '',
            },
          ],
        };

        service.updateArmament(MOCK_IDS.TRIAL, body);
        tick();

        const req = httpTestingController.expectOne(`${MOCK_URLS.PLANNING}/${MOCK_IDS.TRIAL}/planning/armament`);
        req.error(new ErrorEvent('Network error'));
        tick();
      }));
  });

  describe('resetUpdateArmament', () => {
    it('should reset update params without triggering a request', () =>
      fakeAsync(() => {
        service.resetUpdateArmament();
        tick();

        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);
      }));
  });

  describe('getWeapons', () => {
    it('should fetch weapons with default params', () =>
      fakeAsync(() => {
        const mockResponse = {
          page: 0,
          pageSize: 10,
          totalElements: 2,
          items: [
            { id: 'weapon-1', name: 'Obús 105mm', type: 'WEAPON', active: true },
            { id: 'weapon-2', name: 'Obús 155mm', type: 'WEAPON', active: true },
          ],
        };

        service.getWeapons();
        tick();

        expectHttpRequest(`${MOCK_URLS.PLANNING}/weapons`, 'GET', mockResponse);
      }));

    it('should fetch weapons with query params', () =>
      fakeAsync(() => {
        service.getWeapons({ name: 'Obús', page: 0, pageSize: 20, active: true });
        tick();

        const req = httpTestingController.expectOne((r) => r.url.startsWith(`${MOCK_URLS.PLANNING}/weapons`));
        expect(req.request.method).toBe('GET');

        const url = new URL(req.request.url);
        expect(url.searchParams.get('name')).toBe('Obús');
        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.get('pageSize')).toBe('20');
        expect(url.searchParams.get('active')).toBe('true');

        req.flush({ page: 0, pageSize: 20, totalElements: 0, items: [] });
        tick();
      }));

    it('should fetch weapons with sort params', () =>
      fakeAsync(() => {
        service.getWeapons({ sort: ['name,asc', 'id,desc'] });
        tick();

        const req = httpTestingController.expectOne((r) => r.url.startsWith(`${MOCK_URLS.PLANNING}/weapons`));
        expect(req.request.method).toBe('GET');

        const url = new URL(req.request.url);
        expect(url.searchParams.getAll('sort')).toEqual(['name,asc', 'id,desc']);

        req.flush({ page: 0, pageSize: 10, totalElements: 0, items: [] });
        tick();
      }));

    it('should handle error when fetching weapons', () =>
      fakeAsync(() => {
        service.getWeapons();
        tick();

        const req = httpTestingController.expectOne(`${MOCK_URLS.PLANNING}/weapons`);
        req.error(new ErrorEvent('Network error'));
        tick();
      }));
  });

  describe('getTubes', () => {
    it('should fetch tubes with default params', () =>
      fakeAsync(() => {
        const mockResponse = {
          page: 0,
          pageSize: 10,
          totalElements: 2,
          items: [
            { id: 'tube-1', name: 'Tubo 1', type: 'TUBE', active: true },
            { id: 'tube-2', name: 'Tubo 2', type: 'TUBE', active: true },
          ],
        };

        service.getTubes();
        tick();

        expectHttpRequest(`${MOCK_URLS.PLANNING}/tubes`, 'GET', mockResponse);
      }));

    it('should fetch tubes with query params', () =>
      fakeAsync(() => {
        service.getTubes({ name: 'Tubo', page: 1, pageSize: 5, active: false });
        tick();

        const req = httpTestingController.expectOne((r) => r.url.startsWith(`${MOCK_URLS.PLANNING}/tubes`));
        expect(req.request.method).toBe('GET');

        const url = new URL(req.request.url);
        expect(url.searchParams.get('name')).toBe('Tubo');
        expect(url.searchParams.get('page')).toBe('1');
        expect(url.searchParams.get('pageSize')).toBe('5');
        expect(url.searchParams.get('active')).toBe('false');

        req.flush({ page: 1, pageSize: 5, totalElements: 0, items: [] });
        tick();
      }));

    it('should handle error when fetching tubes', () =>
      fakeAsync(() => {
        service.getTubes();
        tick();

        const req = httpTestingController.expectOne(`${MOCK_URLS.PLANNING}/tubes`);
        req.error(new ErrorEvent('Network error'));
        tick();
      }));
  });

  describe('Resource States & Edge Cases', () => {
    it('should not make armament request when params are null', () =>
      fakeAsync(() => {
        tick();
        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);
        expect(service.armamentResource.value()).toBeUndefined();
      }));

    it('should not make weapons request when params are null', () =>
      fakeAsync(() => {
        tick();
        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/weapons`);
        expect(service.weaponsResource.value()).toBeUndefined();
      }));

    it('should not make tubes request when params are null', () =>
      fakeAsync(() => {
        tick();
        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/tubes`);
        expect(service.tubesResource.value()).toBeUndefined();
      }));

    it('should not make update request when params are null', () =>
      fakeAsync(() => {
        tick();
        httpTestingController.expectNone(`${MOCK_URLS.PLANNING}/`);
        expect(service.updateArmamentResource.value()).toBeUndefined();
      }));
  });
});
