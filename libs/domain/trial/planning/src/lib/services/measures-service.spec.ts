import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeasuresService } from './measures-service';
import type { CatalogQueryParams, MasterDataIItemUpdateRequest, MeasuresBulkUpdateRequest } from './measures-service';

const MOCK_PLANNING_URL = 'http://localhost:3000/api/planning';

vi.mock('@intaqalab/config', () => ({
  injectPlanningEndpoint: () => MOCK_PLANNING_URL,
}));

describe('MeasuresService', () => {
  let service: MeasuresService;
  let httpTestingController: HttpTestingController;

  const trialId = 'trial-123';
  const measureId = '550e8400-e29b-41d4-a716-446655440040';
  const mockBaseUrl = MOCK_PLANNING_URL;
  const mockPlanningUrl = MOCK_PLANNING_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MeasuresService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MeasuresService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Trial Endpoints (Planning)', () => {
    it('should call getMeasures and trigger measuresResource', () => {
      service.getMeasures(trialId);

      service.measuresResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockPlanningUrl}/fire-trials/${trialId}/planning/measures`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should call updateMeasures and trigger updateMeasuresResource', () => {
      const body = { measures: [] } as unknown as MeasuresBulkUpdateRequest;
      service.updateMeasures(trialId, body);

      service.updateMeasuresResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockPlanningUrl}/fire-trials/${trialId}/planning/measures`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });

    it('should clear parameters on resetUpdateMeasures', () => {
      service.updateMeasures(trialId, {} as MeasuresBulkUpdateRequest);
      service.resetUpdateMeasures();

      service.updateMeasuresResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockPlanningUrl}/fire-trials/${trialId}/planning/measures`);
    });
  });

  describe('Catalog Endpoints', () => {
    it('should call getMeasuresCatalog with empty params', () => {
      service.getMeasuresCatalog();

      service.measuresCatalogResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures?pageSize=100`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should call getMeasuresCatalog with custom params', () => {
      service.getMeasuresCatalog({ page: 2, pageSize: 50 } as unknown as CatalogQueryParams);

      service.measuresCatalogResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne((request) =>
        request.urlWithParams.startsWith(`${mockBaseUrl}/measures?`),
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('should call createMeasure', () => {
      const body = { name: 'test' } as unknown as MasterDataIItemUpdateRequest;
      service.createMeasure(body);

      service.createMeasureResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });

    it('should clear parameters on resetCreateMeasure', () => {
      service.createMeasure({} as MasterDataIItemUpdateRequest);
      service.resetCreateMeasure();

      service.createMeasureResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockBaseUrl}/measures`);
    });

    it('should call updateMeasure', () => {
      const body = { name: 'test updated' } as unknown as MasterDataIItemUpdateRequest;
      service.updateMeasure(measureId, body);

      service.updateMeasureResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures/${measureId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });

    it('should clear parameters on resetUpdateMeasure', () => {
      service.updateMeasure(measureId, {} as MasterDataIItemUpdateRequest);
      service.resetUpdateMeasure();

      service.updateMeasureResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockBaseUrl}/measures/${measureId}`);
    });

    it('should call deleteMeasure', () => {
      service.deleteMeasure(measureId);

      service.deleteMeasureResource.value();
      TestBed.tick();

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures/${measureId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should clear parameters on resetDeleteMeasure', () => {
      service.deleteMeasure(measureId);
      service.resetDeleteMeasure();

      service.deleteMeasureResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockBaseUrl}/measures/${measureId}`);
    });
  });

  describe('Favorites', () => {
    it('should call addFavorite', () => {
      service.addFavorite(measureId);

      service.addFavoriteResource.value();
      TestBed.tick();
      expect(service.addFavoriteResource.isLoading()).toBe(true);

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures/${measureId}/favorite`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('should clear parameters on resetAddFavorite', () => {
      service.addFavorite(measureId);
      service.resetAddFavorite();

      service.addFavoriteResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockBaseUrl}/measures/${measureId}/favorite`);
    });

    it('should call removeFavorite', () => {
      service.removeFavorite(measureId);

      service.removeFavoriteResource.value();
      TestBed.tick();
      expect(service.removeFavoriteResource.isLoading()).toBe(true);

      const req = httpTestingController.expectOne(`${mockBaseUrl}/measures/${measureId}/favorite`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should clear parameters on resetRemoveFavorite', () => {
      service.removeFavorite(measureId);
      service.resetRemoveFavorite();

      service.removeFavoriteResource.value();
      TestBed.tick();

      httpTestingController.expectNone(`${mockBaseUrl}/measures/${measureId}/favorite`);
    });
  });
});
