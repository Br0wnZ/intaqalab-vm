import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { MunitionsService } from '../services/munitions-service';
import type {
  CatalogQueryParams,
  MasterDataI18nItem,
  MasterDataI18nUpdateRequest,
  MasterDataIItem,
  MasterDataIItemUpdateRequest,
  WarehouseDenominationItem,
  WarehouseMunitionTypeItem,
} from '../utils-models/catalog.model';
import type {
  MunitionBulkUpdateRequest,
  MunitionConfigResponse,
  SeriesMunitionsData,
} from '../utils-models/munitions.model';
import { PlanningGeneralDataStore } from './planning-general-data.store';

interface MunitionsState {
  isInitialized: boolean;
  localConfigurations: MunitionConfigResponse[] | null;
}

const initialState: MunitionsState = {
  isInitialized: false,
  localConfigurations: null,
};

export const MunitionsStore = signalStore(
  withState(initialState),

  withComputed(
    (store, munitionsService = inject(MunitionsService), planningStore = inject(PlanningGeneralDataStore)) => ({
      fireTrialId: computed(() => planningStore.fireTrialId()),

      munitionsResponse: computed(() => munitionsService.munitionsResource.value()),

      seriesMunitions: computed<SeriesMunitionsData[] | undefined>(() => {
        const response = munitionsService.munitionsResource.value();
        return response?.series;
      }),

      allConfigurations: computed<MunitionConfigResponse[]>(() => {
        const response = munitionsService.munitionsResource.value();
        if (!response?.series) return [];
        return response.series.flatMap((serie) =>
          serie.configurations.map((config) => ({
            ...config,
            munitionTypeId: config.munitionTypeId ?? null,
          })),
        );
      }),

      isLoadingMunitions: computed(() => munitionsService.munitionsResource.isLoading()),

      munitionsError: computed(() => munitionsService.munitionsResource.error()),

      hasMunitionsError: computed(() => munitionsService.munitionsResource.error() !== null),

      munitionsStatus: computed(() => munitionsService.munitionsResource.status()),

      updateMunitionsStatus: computed(() => munitionsService.updateMunitionsResource.status()),

      isUpdatingMunitions: computed(() => munitionsService.updateMunitionsResource.isLoading()),
      updateMunitionsError: computed(() => munitionsService.updateMunitionsResource.error()),

      componentTypes: computed<WarehouseMunitionTypeItem[]>(() => {
        const response = munitionsService.componentTypesResource.value();
        return response?.items ?? [];
      }),

      munitionTypes: computed<MasterDataI18nItem[]>(() => {
        const response = munitionsService.componentTypesResource.value();
        return (
          response?.items
            .filter((item: WarehouseMunitionTypeItem) => item.category === 'MUNITION')
            .map(
              (item: WarehouseMunitionTypeItem): MasterDataI18nItem => ({
                id: item.id,
                name: item.name as Record<string, string>,
                label: item.label,
                active: item.active,
              }),
            ) ?? []
        );
      }),
      componentTypesPagination: computed(() => {
        const response = munitionsService.componentTypesResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingComponentTypes: computed(() => munitionsService.componentTypesResource.isLoading()),

      componentTypesError: computed(() => munitionsService.componentTypesResource.error()),

      createComponentTypeStatus: computed(() => munitionsService.createComponentTypeResource.status()),

      isCreatingComponentType: computed(() => munitionsService.createComponentTypeResource.isLoading()),
      updateComponentTypeStatus: computed(() => munitionsService.updateComponentTypeResource.status()),

      isUpdatingComponentType: computed(() => munitionsService.updateComponentTypeResource.isLoading()),

      deleteComponentTypeStatus: computed(() => munitionsService.deleteComponentTypeResource.status()),

      isDeletingComponentType: computed(() => munitionsService.deleteComponentTypeResource.isLoading()),

      denominations: computed<MasterDataI18nItem[]>(() => {
        const response = munitionsService.denominationsResource.value();
        return (
          response?.items.map(
            (item: WarehouseDenominationItem): MasterDataI18nItem => ({
              id: item.id,
              name: { es: item.name, en: item.name },
              label: item.name,
              active: item.active,
            }),
          ) ?? []
        );
      }),

      denominationsRaw: computed<WarehouseDenominationItem[]>(() => {
        return munitionsService.denominationsResource.value()?.items ?? [];
      }),

      denominationsPagination: computed(() => {
        const response = munitionsService.denominationsResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingDenominations: computed(() => munitionsService.denominationsResource.isLoading()),

      denominationsError: computed(() => munitionsService.denominationsResource.error()),

      createDenominationStatus: computed(() => munitionsService.createDenominationResource.status()),

      isCreatingDenomination: computed(() => munitionsService.createDenominationResource.isLoading()),
      updateDenominationStatus: computed(() => munitionsService.updateDenominationResource.status()),

      isUpdatingDenomination: computed(() => munitionsService.updateDenominationResource.isLoading()),

      deleteDenominationStatus: computed(() => munitionsService.deleteDenominationResource.status()),

      isDeletingDenomination: computed(() => munitionsService.deleteDenominationResource.isLoading()),

      fuseWorkingModes: computed<MasterDataIItem[]>(() => {
        const response = munitionsService.fuseWorkingModesResource.value();
        return response?.items ?? [];
      }),

      fuseWorkingModesPagination: computed(() => {
        const response = munitionsService.fuseWorkingModesResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingFuseWorkingModes: computed(() => munitionsService.fuseWorkingModesResource.isLoading()),

      fuseWorkingModesError: computed(() => munitionsService.fuseWorkingModesResource.error()),

      createFuseWorkingModeStatus: computed(() => munitionsService.createFuseWorkingModeResource.status()),

      isCreatingFuseWorkingMode: computed(() => munitionsService.createFuseWorkingModeResource.isLoading()),
      updateFuseWorkingModeStatus: computed(() => munitionsService.updateFuseWorkingModeResource.status()),

      isUpdatingFuseWorkingMode: computed(() => munitionsService.updateFuseWorkingModeResource.isLoading()),

      deleteFuseWorkingModeStatus: computed(() => munitionsService.deleteFuseWorkingModeResource.status()),

      isDeletingFuseWorkingMode: computed(() => munitionsService.deleteFuseWorkingModeResource.isLoading()),

      isLoadingAnyCatalog: computed(
        () =>
          munitionsService.componentTypesResource.isLoading() ||
          munitionsService.denominationsResource.isLoading() ||
          munitionsService.fuseWorkingModesResource.isLoading(),
      ),

      isLoading: computed(
        () =>
          munitionsService.munitionsResource.isLoading() ||
          munitionsService.updateMunitionsResource.isLoading() ||
          munitionsService.componentTypesResource.isLoading() ||
          munitionsService.denominationsResource.isLoading() ||
          munitionsService.fuseWorkingModesResource.isLoading(),
      ),
    }),
  ),

  withMethods(
    (store, munitionsService = inject(MunitionsService), planningStore = inject(PlanningGeneralDataStore)) => ({
      loadMunitions(): void {
        const trialId = planningStore.fireTrialId();
        if (trialId) {
          munitionsService.getMunitions(trialId);
          patchState(store, { isInitialized: true });
        }
      },

      reloadMunitions(): void {
        munitionsService.munitionsResource.reload();
      },
      updateMunitions(request: MunitionBulkUpdateRequest): void {
        const trialId = planningStore.fireTrialId();
        if (trialId) {
          munitionsService.updateMunitions(trialId, request);
        }
      },

      resetUpdateMunitions(): void {
        munitionsService.resetUpdateMunitions();
      },

      loadComponentTypes(params: CatalogQueryParams = {}): void {
        munitionsService.getComponentTypes({
          ...params,
          active: true,
        });
      },

      createComponentType(request: MasterDataI18nUpdateRequest): void {
        munitionsService.createComponentType(request);
      },
      updateComponentType(id: string, request: MasterDataI18nUpdateRequest): void {
        munitionsService.updateComponentType(id, request);
      },
      deleteComponentType(id: string): void {
        munitionsService.deleteComponentType(id);
      },
      resetCreateComponentType(): void {
        munitionsService.resetCreateComponentType();
      },

      resetUpdateComponentType(): void {
        munitionsService.resetUpdateComponentType();
      },

      resetDeleteComponentType(): void {
        munitionsService.resetDeleteComponentType();
      },

      loadDenominations(params: CatalogQueryParams = {}): void {
        munitionsService.getDenominations(params);
      },

      createDenomination(request: MasterDataI18nUpdateRequest): void {
        munitionsService.createDenomination(request);
      },

      updateDenomination(id: string, request: MasterDataI18nUpdateRequest): void {
        munitionsService.updateDenomination(id, request);
      },
      deleteDenomination(id: string): void {
        munitionsService.deleteDenomination(id);
      },

      resetCreateDenomination(): void {
        munitionsService.resetCreateDenomination();
      },
      resetUpdateDenomination(): void {
        munitionsService.resetUpdateDenomination();
      },

      resetDeleteDenomination(): void {
        munitionsService.resetDeleteDenomination();
      },

      loadFuseWorkingModes(params: CatalogQueryParams = {}): void {
        munitionsService.getFuseWorkingModes(params);
      },

      createFuseWorkingMode(request: MasterDataIItemUpdateRequest): void {
        munitionsService.createFuseWorkingMode(request);
      },

      updateFuseWorkingMode(id: string, request: MasterDataIItemUpdateRequest): void {
        munitionsService.updateFuseWorkingMode(id, request);
      },
      deleteFuseWorkingMode(id: string): void {
        munitionsService.deleteFuseWorkingMode(id);
      },

      resetCreateFuseWorkingMode(): void {
        munitionsService.resetCreateFuseWorkingMode();
      },
      resetUpdateFuseWorkingMode(): void {
        munitionsService.resetUpdateFuseWorkingMode();
      },

      resetDeleteFuseWorkingMode(): void {
        munitionsService.resetDeleteFuseWorkingMode();
      },

      loadAllCatalogs(): void {
        munitionsService.getComponentTypes({ active: true });
        munitionsService.getDenominations({ active: true });
        munitionsService.getFuseWorkingModes({ page: 1, pageSize: 10 });
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type MunitionsStoreType = InstanceType<typeof MunitionsStore>;
