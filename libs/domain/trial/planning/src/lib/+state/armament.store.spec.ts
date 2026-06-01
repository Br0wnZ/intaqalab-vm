import { TestBed } from '@angular/core/testing';
import {
  createArmamentCatalogTestData,
  createArmamentTestData,
  createMockArmamentService,
  createMockPlanningGeneralDataStore,
} from '@intaqalab/utils';

import { ArmamentService } from '../services/armament-service';
import type { ArmamentStoreType } from './armament.store';
import { ArmamentStore } from './armament.store';
import { PlanningGeneralDataStore } from './planning-general-data.store';

const createTestSetup = (options?: {
  trialId?: string | null;
  armamentData?: ReturnType<typeof createArmamentTestData>;
  catalogData?: ReturnType<typeof createArmamentCatalogTestData>;
}) => {
  const trialId = options && 'trialId' in options ? options.trialId : 'trial-123';
  const armamentData = options?.armamentData ?? createArmamentTestData();
  const catalogData = options?.catalogData ?? createArmamentCatalogTestData();

  const armamentServiceMock = createMockArmamentService({
    armament: armamentData,
    weapons: catalogData.weapons,
    tubes: catalogData.tubes,
  });

  const planningStoreMock = createMockPlanningGeneralDataStore({
    fireTrialId: trialId ?? undefined,
  });

  return {
    trialId,
    armamentData,
    catalogData,
    armamentServiceMock,
    planningStoreMock,
  };
};

describe('ArmamentStore', () => {
  let store: ArmamentStoreType;
  let testSetup: ReturnType<typeof createTestSetup>;

  beforeEach(() => {
    testSetup = createTestSetup();

    TestBed.configureTestingModule({
      providers: [
        ArmamentStore,
        { provide: ArmamentService, useValue: testSetup.armamentServiceMock },
        { provide: PlanningGeneralDataStore, useValue: testSetup.planningStoreMock },
      ],
    });

    store = TestBed.inject(ArmamentStore);
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      expect(store.isInitialized()).toBe(false);
    });

    it('should expose fireTrialId from planning store', () => {
      expect(store.fireTrialId()).toBe('trial-123');
    });
  });

  describe('Trial Armament', () => {
    describe('loadArmament', () => {
      it('should call getArmament with current trial ID', () => {
        store.loadArmament();

        expect(testSetup.armamentServiceMock.getArmament).toHaveBeenCalledWith('trial-123');
      });

      it('should mark store as initialized after loading', () => {
        store.loadArmament();

        expect(store.isInitialized()).toBe(true);
      });

      it('should not call getArmament if trial ID is null', () => {
        const nullTrialSetup = createTestSetup({ trialId: null });

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            ArmamentStore,
            { provide: ArmamentService, useValue: nullTrialSetup.armamentServiceMock },
            { provide: PlanningGeneralDataStore, useValue: nullTrialSetup.planningStoreMock },
          ],
        });

        const storeWithNullTrial = TestBed.inject(ArmamentStore);
        storeWithNullTrial.loadArmament();

        expect(nullTrialSetup.armamentServiceMock.getArmament).not.toHaveBeenCalled();
      });
    });

    describe('reloadArmament', () => {
      it('should call reload on armament resource', () => {
        store.reloadArmament();

        expect(testSetup.armamentServiceMock.armamentResource.reload).toHaveBeenCalled();
      });
    });

    describe('updateArmament', () => {
      it('should call updateArmament with trial ID and request body', () => {
        const request = {
          shots: [
            {
              shotId: 'shot-1',
              weaponExternalId: 'weapon-1',
              tubeExternalId: 'tube-1',
              isInstrumented: true,
              lifeUsefulPercentage: 80,
              observations: 'Test observation',
            },
          ],
        };

        store.updateArmament(request);

        expect(testSetup.armamentServiceMock.updateArmament).toHaveBeenCalledWith('trial-123', request);
      });
    });

    describe('resetUpdateArmament', () => {
      it('should call resetUpdateArmament on service', () => {
        store.resetUpdateArmament();

        expect(testSetup.armamentServiceMock.resetUpdateArmament).toHaveBeenCalled();
      });
    });

    describe('computed signals', () => {
      it('should return series armament from resource', () => {
        const seriesArmament = store.seriesArmament();

        expect(seriesArmament).toEqual(testSetup.armamentData.series);
      });

      it('should return loading state from resource', () => {
        expect(store.isLoadingArmament()).toBe(false);

        testSetup.armamentServiceMock._armamentResource._setLoading(true);

        expect(store.isLoadingArmament()).toBe(true);
      });

      it('should return error state from resource', () => {
        expect(store.armamentError()).toBeUndefined();

        const error = new Error('Test error');
        testSetup.armamentServiceMock._armamentResource._setError(error);
        expect(store.armamentError()).toBe(error);

        // Not exposed in ArmamentStore but good to know
        expect(store.hasArmamentError()).toBe(true);
      });
    });
  });

  describe('Weapons Catalog', () => {
    describe('loadWeapons', () => {
      it('should call getWeapons with default params', () => {
        store.loadWeapons();

        expect(testSetup.armamentServiceMock.getWeapons).toHaveBeenCalledWith({});
      });

      it('should call getWeapons with custom params', () => {
        const params = { active: true, page: 1, pageSize: 20 };
        store.loadWeapons(params);

        expect(testSetup.armamentServiceMock.getWeapons).toHaveBeenCalledWith(params);
      });
    });

    describe('computed signals', () => {
      it('should return weapons from resource', () => {
        const weapons = store.weapons();

        expect(weapons).toEqual(testSetup.catalogData.weapons.items);
      });

      it('should return pagination info', () => {
        const pagination = store.weaponsPagination();

        expect(pagination).toEqual({
          page: 0,
          pageSize: 10,
          totalElements: 2,
        });
      });
    });
  });

  describe('Tubes Catalog', () => {
    describe('loadTubes', () => {
      it('should call getTubes with default params', () => {
        store.loadTubes();

        expect(testSetup.armamentServiceMock.getTubes).toHaveBeenCalledWith({});
      });

      it('should call getTubes with custom params', () => {
        const params = { active: true };
        store.loadTubes(params);

        expect(testSetup.armamentServiceMock.getTubes).toHaveBeenCalledWith(params);
      });
    });

    describe('computed signals', () => {
      it('should return tubes from resource', () => {
        const tubes = store.tubes();

        expect(tubes).toEqual(testSetup.catalogData.tubes.items);
      });

      it('should return pagination info', () => {
        const pagination = store.tubesPagination();

        expect(pagination).toEqual({
          page: 0,
          pageSize: 10,
          totalElements: 2,
        });
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('loadAllCatalogs', () => {
      it('should load all catalogs with active=true', () => {
        store.loadAllCatalogs();

        expect(testSetup.armamentServiceMock.getWeapons).toHaveBeenCalledWith({ active: true });
        expect(testSetup.armamentServiceMock.getTubes).toHaveBeenCalledWith({ active: true });
      });
    });
  });

  describe('Aggregate Loading State', () => {
    it('should return true for isLoadingCatalogs when any catalog is loading', () => {
      expect(store.isLoadingCatalogs()).toBe(false);

      testSetup.armamentServiceMock._weaponsResource._setLoading(true);
      expect(store.isLoadingCatalogs()).toBe(true);

      testSetup.armamentServiceMock._weaponsResource._setLoading(false);
      testSetup.armamentServiceMock._tubesResource._setLoading(true);
      expect(store.isLoadingCatalogs()).toBe(true);
    });

    it('should return true for isLoading when any resource is loading', () => {
      expect(store.isLoading()).toBe(false);

      testSetup.armamentServiceMock._armamentResource._setLoading(true);
      expect(store.isLoading()).toBe(true);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      store.loadArmament();
      expect(store.isInitialized()).toBe(true);

      store.reset();

      expect(store.isInitialized()).toBe(false);
    });
  });
});
