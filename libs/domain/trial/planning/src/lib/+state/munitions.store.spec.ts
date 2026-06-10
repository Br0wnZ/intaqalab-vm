import { TestBed } from '@angular/core/testing';
import {
  createMockMunitionsService,
  createMockPlanningGeneralDataStore,
  createMunitionsCatalogTestData,
  createMunitionsTestData,
} from '@intaqalab/utils';

import { MunitionsService } from '../services/munitions-service';
import type { MunitionsStoreType } from './munitions.store';
import { MunitionsStore } from './munitions.store';
import { PlanningGeneralDataStore } from './planning-general-data.store';

const createTestSetup = (options?: {
  trialId?: string | null;
  munitionsData?: ReturnType<typeof createMunitionsTestData>;
  catalogData?: ReturnType<typeof createMunitionsCatalogTestData>;
}) => {
  const trialId = options && 'trialId' in options ? options.trialId : 'trial-123';
  const munitionsData = options?.munitionsData ?? createMunitionsTestData();
  const catalogData = options?.catalogData ?? createMunitionsCatalogTestData();

  const munitionsServiceMock = createMockMunitionsService({
    munitions: munitionsData,
    componentTypes: catalogData.componentTypes,
    denominations: catalogData.denominations,
    fuseWorkingModes: catalogData.fuseWorkingModes,
  });

  const planningStoreMock = createMockPlanningGeneralDataStore({
    fireTrialId: trialId ?? undefined,
  });

  return {
    trialId,
    munitionsData,
    catalogData,
    munitionsServiceMock,
    planningStoreMock,
  };
};

describe('MunitionsStore', () => {
  let store: MunitionsStoreType;
  let testSetup: ReturnType<typeof createTestSetup>;

  beforeEach(() => {
    testSetup = createTestSetup();

    TestBed.configureTestingModule({
      providers: [
        MunitionsStore,
        { provide: MunitionsService, useValue: testSetup.munitionsServiceMock },
        { provide: PlanningGeneralDataStore, useValue: testSetup.planningStoreMock },
      ],
    });

    store = TestBed.inject(MunitionsStore);
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      expect(store.isInitialized()).toBe(false);
    });

    it('should expose fireTrialId from planning store', () => {
      expect(store.fireTrialId()).toBe('trial-123');
    });
  });

  describe('Trial Munitions', () => {
    describe('loadMunitions', () => {
      it('should call getMunitions with current trial ID', () => {
        store.loadMunitions();

        expect(testSetup.munitionsServiceMock.getMunitions).toHaveBeenCalledWith('trial-123');
      });

      it('should mark store as initialized after loading', () => {
        store.loadMunitions();

        expect(store.isInitialized()).toBe(true);
      });

      it('should not call getMunitions if trial ID is null', () => {
        const nullTrialSetup = createTestSetup({ trialId: null });

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            MunitionsStore,
            { provide: MunitionsService, useValue: nullTrialSetup.munitionsServiceMock },
            { provide: PlanningGeneralDataStore, useValue: nullTrialSetup.planningStoreMock },
          ],
        });

        const storeWithNullTrial = TestBed.inject(MunitionsStore);
        storeWithNullTrial.loadMunitions();

        expect(nullTrialSetup.munitionsServiceMock.getMunitions).not.toHaveBeenCalled();
      });
    });

    describe('reloadMunitions', () => {
      it('should call reload on munitions resource', () => {
        store.reloadMunitions();

        expect(testSetup.munitionsServiceMock.munitionsResource.reload).toHaveBeenCalled();
      });
    });

    describe('updateMunitions', () => {
      it('should call updateMunitions with trial ID and request body', () => {
        const request = {
          configurations: [
            {
              seriesId: 'series-1',
              denomination: 'Test Denom',
              batch: 'Batch-1',
            },
          ],
        };

        store.updateMunitions(request);

        expect(testSetup.munitionsServiceMock.updateMunitions).toHaveBeenCalledWith('trial-123', request);
      });
    });

    describe('resetUpdateMunitions', () => {
      it('should call resetUpdateMunitions on service', () => {
        store.resetUpdateMunitions();

        expect(testSetup.munitionsServiceMock.resetUpdateMunitions).toHaveBeenCalled();
      });
    });

    describe('computed signals', () => {
      it('should return series munitions from resource', () => {
        const seriesMunitions = store.seriesMunitions();

        expect(seriesMunitions).toEqual(testSetup.munitionsData.series);
      });

      it('should flatten all configurations from all series', () => {
        const allConfigs = store.allConfigurations();

        expect(allConfigs.length).toBe(4);
      });

      it('should return loading state from resource', () => {
        expect(store.isLoadingMunitions()).toBe(false);

        testSetup.munitionsServiceMock._munitionsResource._setLoading(true);

        expect(store.isLoadingMunitions()).toBe(true);
      });

      it('should return error state from resource', () => {
        expect(store.munitionsError()).toBeUndefined();

        const error = new Error('Test error');
        testSetup.munitionsServiceMock._munitionsResource._setError(error);

        expect(store.munitionsError()).toBe(error);
        expect(store.hasMunitionsError()).toBe(true);
      });
    });
  });

  describe('Component Types Catalog', () => {
    describe('loadComponentTypes', () => {
      it('should call getComponentTypes with default params', () => {
        store.loadComponentTypes();

        expect(testSetup.munitionsServiceMock.getComponentTypes).toHaveBeenCalledWith({ active: true });
      });

      it('should call getComponentTypes with custom params', () => {
        const params = { active: true, page: 1, pageSize: 20 };
        store.loadComponentTypes(params);

        expect(testSetup.munitionsServiceMock.getComponentTypes).toHaveBeenCalledWith(params);
      });

      it('should force active=true even when custom params set active=false', () => {
        store.loadComponentTypes({ active: false, page: 2 });

        expect(testSetup.munitionsServiceMock.getComponentTypes).toHaveBeenCalledWith({ active: true, page: 2 });
      });
    });

    describe('createComponentType', () => {
      it('should call createComponentType on service', () => {
        const request = { name: { es: 'Nuevo', en: 'New' }, active: true };
        store.createComponentType(request);

        expect(testSetup.munitionsServiceMock.createComponentType).toHaveBeenCalledWith(request);
      });
    });

    describe('updateComponentType', () => {
      it('should call updateComponentType with id and request', () => {
        const request = { name: { es: 'Actualizado', en: 'Updated' }, active: true };
        store.updateComponentType('ct-1', request);

        expect(testSetup.munitionsServiceMock.updateComponentType).toHaveBeenCalledWith('ct-1', request);
      });
    });

    describe('deleteComponentType', () => {
      it('should call deleteComponentType with id', () => {
        store.deleteComponentType('ct-1');

        expect(testSetup.munitionsServiceMock.deleteComponentType).toHaveBeenCalledWith('ct-1');
      });
    });

    describe('reset methods', () => {
      it('should call resetCreateComponentType', () => {
        store.resetCreateComponentType();
        expect(testSetup.munitionsServiceMock.resetCreateComponentType).toHaveBeenCalled();
      });

      it('should call resetUpdateComponentType', () => {
        store.resetUpdateComponentType();
        expect(testSetup.munitionsServiceMock.resetUpdateComponentType).toHaveBeenCalled();
      });

      it('should call resetDeleteComponentType', () => {
        store.resetDeleteComponentType();
        expect(testSetup.munitionsServiceMock.resetDeleteComponentType).toHaveBeenCalled();
      });
    });

    describe('computed signals', () => {
      it('should return component types from resource', () => {
        const types = store.componentTypes();

        expect(types).toEqual([
          {
            id: 'ct-1',
            name: { es: 'Espoleta', en: 'Fuse' },
            label: 'Espoleta',
            category: 'MUNITION_COMPONENT',
            active: true,
            observations: '',
          },
          {
            id: 'ct-2',
            name: { es: 'Proyectil', en: 'Projectile' },
            label: 'Proyectil',
            category: 'MUNITION_COMPONENT',
            active: true,
            observations: '',
          },
        ]);
      });

      it('should return pagination info', () => {
        const pagination = store.componentTypesPagination();

        expect(pagination).toEqual({
          page: 0,
          pageSize: 100,
          totalElements: 2,
        });
      });
    });
  });

  describe('Denominations Catalog', () => {
    describe('loadDenominations', () => {
      it('should call getDenominations with params', () => {
        const params = { active: true };
        store.loadDenominations(params);

        expect(testSetup.munitionsServiceMock.getDenominations).toHaveBeenCalledWith(params);
      });
    });

    describe('CRUD operations', () => {
      it('should create denomination', () => {
        const request = { name: { es: 'Nueva', en: 'New' }, active: true };
        store.createDenomination(request);

        expect(testSetup.munitionsServiceMock.createDenomination).toHaveBeenCalledWith(request);
      });

      it('should update denomination', () => {
        const request = { name: { es: 'Actualizada', en: 'Updated' }, active: true };
        store.updateDenomination('denom-1', request);

        expect(testSetup.munitionsServiceMock.updateDenomination).toHaveBeenCalledWith('denom-1', request);
      });

      it('should delete denomination', () => {
        store.deleteDenomination('denom-1');

        expect(testSetup.munitionsServiceMock.deleteDenomination).toHaveBeenCalledWith('denom-1');
      });
    });

    describe('computed signals', () => {
      it('should return denominations from resource', () => {
        const denominations = store.denominations();

        expect(denominations).toEqual([
          { id: 'denom-1', name: { es: 'Denom 1', en: 'Denom 1' }, label: 'Denom 1', active: true },
          { id: 'denom-2', name: { es: 'Denom 2', en: 'Denom 2' }, label: 'Denom 2', active: true },
        ]);
      });
    });
  });

  describe('Fuse Working Modes Catalog', () => {
    describe('loadFuseWorkingModes', () => {
      it('should call getFuseWorkingModes with params', () => {
        const params = { active: true };
        store.loadFuseWorkingModes(params);

        expect(testSetup.munitionsServiceMock.getFuseWorkingModes).toHaveBeenCalledWith(params);
      });
    });

    describe('CRUD operations', () => {
      it('should create fuse working mode', () => {
        const request = { name: 'Nuevo Modo', active: true };
        store.createFuseWorkingMode(request);

        expect(testSetup.munitionsServiceMock.createFuseWorkingMode).toHaveBeenCalledWith(request);
      });

      it('should update fuse working mode', () => {
        const request = { name: 'Modo Actualizado', active: true };
        store.updateFuseWorkingMode('fwm-1', request);

        expect(testSetup.munitionsServiceMock.updateFuseWorkingMode).toHaveBeenCalledWith('fwm-1', request);
      });

      it('should delete fuse working mode', () => {
        store.deleteFuseWorkingMode('fwm-1');

        expect(testSetup.munitionsServiceMock.deleteFuseWorkingMode).toHaveBeenCalledWith('fwm-1');
      });
    });

    describe('computed signals', () => {
      it('should return fuse working modes from resource', () => {
        const modes = store.fuseWorkingModes();

        expect(modes).toEqual(testSetup.catalogData.fuseWorkingModes.items);
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('loadAllCatalogs', () => {
      it('should load catalogs with expected default queries', () => {
        store.loadAllCatalogs();

        expect(testSetup.munitionsServiceMock.getComponentTypes).toHaveBeenCalledWith({ active: true });
        expect(testSetup.munitionsServiceMock.getDenominations).toHaveBeenCalledWith({ active: true });
        expect(testSetup.munitionsServiceMock.getFuseWorkingModes).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
      });
    });
  });

  describe('Aggregate Loading State', () => {
    it('should return true for isLoadingAnyCatalog when any catalog is loading', () => {
      expect(store.isLoadingAnyCatalog()).toBe(false);

      testSetup.munitionsServiceMock._componentTypesResource._setLoading(true);

      expect(store.isLoadingAnyCatalog()).toBe(true);
    });

    it('should return true for isLoading when any resource is loading', () => {
      expect(store.isLoading()).toBe(false);

      testSetup.munitionsServiceMock._munitionsResource._setLoading(true);

      expect(store.isLoading()).toBe(true);
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      store.loadMunitions();
      expect(store.isInitialized()).toBe(true);

      store.reset();

      expect(store.isInitialized()).toBe(false);
    });
  });
});
