import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createMeasuresCatalogTestData,
  createMeasuresTestData,
  createMockMeasuresService,
  createMockPlanningGeneralDataStore,
} from '@intaqalab/utils';

import { MeasuresService } from '../services/measures-service';
import { MeasuresStore } from './measures.store';
import { PlanningGeneralDataStore } from './planning-general-data.store';

describe('MeasuresStore', () => {
  let store: InstanceType<typeof MeasuresStore>;
  let measuresServiceMock: ReturnType<typeof createMockMeasuresService>;
  let planningStoreMock: ReturnType<typeof createMockPlanningGeneralDataStore>;

  beforeEach(() => {
    measuresServiceMock = createMockMeasuresService();
    planningStoreMock = createMockPlanningGeneralDataStore();

    planningStoreMock.fireTrialId.mockReturnValue(signal('trial-123')());

    TestBed.configureTestingModule({
      providers: [
        MeasuresStore,
        { provide: MeasuresService, useValue: measuresServiceMock },
        { provide: PlanningGeneralDataStore, useValue: planningStoreMock },
      ],
    });

    store = TestBed.inject(MeasuresStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('Computed Signals', () => {
    it('should select fireTrialId from planning store', () => {
      expect(store.fireTrialId()).toBe('trial-123');
    });

    describe('Planning Computed', () => {
      it('should select measuresResponse from service', () => {
        const testData = createMeasuresTestData();
        measuresServiceMock._measuresResource._setValue(testData);
        expect(store.measuresResponse()).toEqual(testData);
      });

      it('should select seriesMeasures from service', () => {
        const testData = createMeasuresTestData();
        measuresServiceMock._measuresResource._setValue(testData);
        expect(store.seriesMeasures()).toEqual(testData.series);
      });

      it('should select isLoadingMeasures', () => {
        measuresServiceMock._measuresResource._setLoading(true);
        expect(store.isLoadingMeasures()).toBe(true);
      });

      it('should select measuresError', () => {
        const error = new Error('Test error');
        measuresServiceMock._measuresResource._setError(error);
        expect(store.measuresError()).toBe(error);
        expect(store.hasMeasuresError()).toBe(true);
      });

      it('should select favorite statuses', () => {
        measuresServiceMock._addFavoriteResource._setLoading(true);
        expect(store.isAddingFavorite()).toBe(true);

        measuresServiceMock._removeFavoriteResource._setLoading(true);
        expect(store.isRemovingFavorite()).toBe(true);
      });
    });

    describe('Catalog Computed', () => {
      it('should select measuresCatalog items', () => {
        const testData = createMeasuresCatalogTestData();
        measuresServiceMock._measuresCatalogResource._setValue(testData);
        expect(store.measuresCatalog()).toEqual(testData.items);
      });

      it('should select measuresCatalogPagination', () => {
        const testData = createMeasuresCatalogTestData();
        measuresServiceMock._measuresCatalogResource._setValue(testData);
        expect(store.measuresCatalogPagination()).toEqual({
          page: testData.page,
          pageSize: testData.pageSize,
          totalElements: testData.totalElements,
        });
      });
    });

    describe('Global Loading', () => {
      it('should be loading if measuresResource is loading', () => {
        measuresServiceMock._measuresResource._setLoading(true);
        expect(store.isLoading()).toBe(true);
      });

      it('should be loading if updateMeasuresResource is loading', () => {
        measuresServiceMock._updateMeasuresResource._setLoading(true);
        expect(store.isLoading()).toBe(true);
      });

      it('should be loading if measuresCatalogResource is loading', () => {
        measuresServiceMock._measuresCatalogResource._setLoading(true);
        expect(store.isLoading()).toBe(true);
      });
    });
  });

  describe('Methods', () => {
    describe('Planning Methods', () => {
      it('loadMeasures should call service.getMeasures with trialId', () => {
        store.loadMeasures();
        expect(measuresServiceMock.getMeasures).toHaveBeenCalledWith('trial-123');
      });

      it('loadMeasures should NOT call service if trialId is missing', () => {
        planningStoreMock.fireTrialId.mockReturnValue(null);
        TestBed.resetTestingModule();
        const noTrialPlanningMock = createMockPlanningGeneralDataStore({ fireTrialId: undefined });
        TestBed.configureTestingModule({
          providers: [
            MeasuresStore,
            { provide: MeasuresService, useValue: measuresServiceMock },
            { provide: PlanningGeneralDataStore, useValue: noTrialPlanningMock },
          ],
        });
        store = TestBed.inject(MeasuresStore);

        store.loadMeasures();
        expect(measuresServiceMock.getMeasures).not.toHaveBeenCalled();
      });

      it('reloadMeasures should reload measuresResource', () => {
        store.reloadMeasures();
        expect(measuresServiceMock.measuresResource.reload).toHaveBeenCalled();
      });

      it('updateMeasures should call service.updateMeasures', () => {
        const request = { series: [] };
        store.updateMeasures(request);
        expect(measuresServiceMock.updateMeasures).toHaveBeenCalledWith('trial-123', request);
      });

      it('resetUpdateMeasures should call service.resetUpdateMeasures', () => {
        store.resetUpdateMeasures();
        expect(measuresServiceMock.resetUpdateMeasures).toHaveBeenCalled();
      });
    });

    describe('Catalog Methods', () => {
      it('loadMeasuresCatalog should call service.getMeasuresCatalog', () => {
        const params = { page: 1 };
        store.loadMeasuresCatalog(params);
        expect(measuresServiceMock.getMeasuresCatalog).toHaveBeenCalledWith(params);
      });

      it('createMeasure should call service.createMeasure', () => {
        const request = { name: 'New', active: false };
        store.createMeasure(request);
        expect(measuresServiceMock.createMeasure).toHaveBeenCalledWith(request);
      });

      it('updateMeasure should call service.updateMeasure', () => {
        const id = '1';
        const request = { name: 'Upd', active: true };
        store.updateMeasure(id, request);
        expect(measuresServiceMock.updateMeasure).toHaveBeenCalledWith(id, request);
      });

      it('deleteMeasure should call service.deleteMeasure', () => {
        store.deleteMeasure('1');
        expect(measuresServiceMock.deleteMeasure).toHaveBeenCalledWith('1');
      });

      it('reset methods should call corresponding service reset methods', () => {
        store.resetCreateMeasure();
        expect(measuresServiceMock.resetCreateMeasure).toHaveBeenCalled();

        store.resetUpdateMeasure();
        expect(measuresServiceMock.resetUpdateMeasure).toHaveBeenCalled();

        store.resetDeleteMeasure();
        expect(measuresServiceMock.resetDeleteMeasure).toHaveBeenCalled();
      });

      it('favorite methods should call corresponding service methods', () => {
        const id = '123';

        store.addFavorite(id);
        expect(measuresServiceMock.addFavorite).toHaveBeenCalledWith(id);

        store.removeFavorite(id);
        expect(measuresServiceMock.removeFavorite).toHaveBeenCalledWith(id);

        store.resetAddFavorite();
        expect(measuresServiceMock.resetAddFavorite).toHaveBeenCalled();

        store.resetRemoveFavorite();
        expect(measuresServiceMock.resetRemoveFavorite).toHaveBeenCalled();
      });
    });

    describe('General Methods', () => {
      it('reset should reset store state', () => {
        store.loadMeasures();
        expect(store.isInitialized()).toBe(true);

        store.reset();
        expect(store.isInitialized()).toBe(false);
      });
    });
  });
});
