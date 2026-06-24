import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SpecimenType } from '../utils-models/specimen.model';
import type { UpsertTrialPlanningInfo } from '../utils-models/trial-planing-info.model';
import { DataPlanningService } from './data-planning-service';

const MOCK_URLS = {
  PLANNING: 'http://api.test/planning',
  BASE: 'http://api.test/center',
  WAREHOUSE: 'http://api.test/warehouse',
};

const MOCK_IDS = {
  TRIAL: 'trial-123',
};

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_URLS.PLANNING,
  injectApiUrl: () => MOCK_URLS.BASE,
  injectWharehouseEndpoint: () => MOCK_URLS.WAREHOUSE,
}));

describe('DataPlanningService', () => {
  let service: DataPlanningService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DataPlanningService],
    });

    service = TestBed.inject(DataPlanningService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadGeneralData', () => {
    it('should load general data', () => {
      const mockResponse = { id: 1, observation: 'test', trialId: 123 };

      service.loadGeneralData(MOCK_IDS.TRIAL).subscribe((data) => {
        expect(data).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${MOCK_URLS.BASE}/planning-general-data/${MOCK_IDS.TRIAL}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getFireTrialPlanningInfo', () => {
    it('should fetch fire trial planning info', () => {
      const mockResponse = {
        id: 123,
        fireTrialId: MOCK_IDS.TRIAL,
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };

      service.getFireTrialPlanningInfo(MOCK_IDS.TRIAL);
      TestBed.tick();

      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching planning info', async () => {
      service.getFireTrialPlanningInfo(MOCK_IDS.TRIAL);
      TestBed.flushEffects();

      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      // Allow Promise rejection microtasks to complete in Zoneless
      await Promise.resolve();
      TestBed.flushEffects();

      expect(service.getPlanningDataResource.isLoading()).toBe(false);
      expect(service.getPlanningDataResource.status()).toBe('error');
      expect(service.getPlanningDataResource.error()).toBeTruthy();
      expect(service.getPlanningDataResource.hasValue()).toBe(false);
    });
  });

  describe('updateTrialPlanningInfoData', () => {
    it('should update trial planning info data', () => {
      const updateData = {
        fireTrialId: MOCK_IDS.TRIAL,
        specimens: [],
      } as unknown as UpsertTrialPlanningInfo & { fireTrialId: string };

      const mockResponse = { ...updateData, id: 1 };

      service.updateTrialPlanningInfoData(updateData);
      TestBed.tick();

      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/fire-trials/${MOCK_IDS.TRIAL}/planning/info`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('Specimens', () => {
    it('should get specimens when triggered', () => {
      const mockResponse = {
        page: 1,
        pageSize: 100,
        totalElements: 1,
        items: [{ id: '1', name: { es: 'Specimen 1' }, label: 'Specimen 1', type: 'denomination', active: true }],
      };

      service.getSpecimens();
      TestBed.tick();

      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/specimens?pageSize=100`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get weapons when triggered by SpecimenType', () => {
      const mockResponse = { page: 1, pageSize: 100, totalElements: 0, items: [] };

      service.getSpecimensByType(SpecimenType.Weapon, { page: 1, pageSize: 50 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`${MOCK_URLS.PLANNING}/weapons`));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageSize')).toBe('50');
      req.flush(mockResponse);
    });

    it('should get tubes when triggered by SpecimenType', () => {
      const mockResponse = { page: 1, pageSize: 100, totalElements: 0, items: [] };

      service.getSpecimensByType(SpecimenType.Tube, { page: 2 });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`${MOCK_URLS.PLANNING}/tubes`));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('2');
      req.flush(mockResponse);
    });

    it('should get denominations when triggered by SpecimenType', () => {
      const mockResponse = { page: 1, pageSize: 100, totalElements: 0, items: [] };

      service.getSpecimensByType(SpecimenType.Denomination, { name: 'test' });
      TestBed.tick();

      const req = httpMock.expectOne((r) => r.url.includes(`${MOCK_URLS.WAREHOUSE}/denominations`));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('name')).toBe('test');
      req.flush(mockResponse);
    });

    it('should refresh specimens (reset trigger)', () => {
      service.getSpecimens();
      TestBed.tick();
      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/specimens?pageSize=100`);
      req.flush({ page: 1, pageSize: 100, totalElements: 0, items: [] });

      service.refreshSpecimens();
      TestBed.tick();

      httpMock.expectNone(`${MOCK_URLS.PLANNING}/specimens?pageSize=100`);
      expect(service.weaponsResource.value()).toBeUndefined();
      expect(service.tubesResource.value()).toBeUndefined();
      expect(service.denominationsResource.value()).toBeUndefined();
    });
  });

  describe('Users', () => {
    it('should get users when triggered', () => {
      const mockResponse = [{ id: 1, name: 'User 1' }];

      service.getUsers();
      TestBed.tick();

      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/planning-users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should refresh users (reset trigger)', () => {
      service.getUsers();
      TestBed.tick();
      const req = httpMock.expectOne(`${MOCK_URLS.PLANNING}/planning-users`);
      req.flush([]);

      service.refreshUsers();
      TestBed.tick();

      expect(service.usersResource.value()).toBeUndefined();
      httpMock.expectNone(`${MOCK_URLS.PLANNING}/planning-users`);
    });
  });

  describe('Resource States & Edge Cases', () => {
    it('should not make request when params are null/initial state', () => {
      TestBed.tick();

      httpMock.expectNone((r) => r.url.includes(MOCK_URLS.PLANNING));
      httpMock.expectNone((r) => r.url.includes(MOCK_URLS.BASE));

      expect(service.getPlanningDataResource.value()).toBeUndefined();
      expect(service.updatePlanningDataResource.value()).toBeUndefined();
      expect(service.specimenResource.value()).toBeUndefined();
      expect(service.usersResource.value()).toBeUndefined();
      expect(service.weaponsResource.value()).toBeUndefined();
      expect(service.tubesResource.value()).toBeUndefined();
      expect(service.denominationsResource.value()).toBeUndefined();
    });
  });
});
