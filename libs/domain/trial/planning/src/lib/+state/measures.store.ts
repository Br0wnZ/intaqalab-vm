import { computed, inject } from '@angular/core';
import { injectApiUrl, injectFireTrialsEndpoint } from '@intaqalab/config';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { MeasuresService } from '../services/measures-service';
import type {
  CatalogQueryParams,
  MasterDataI18nItem,
  MasterDataIItemUpdateRequest,
  MeasuresMasterDataIItem,
} from '../utils-models/catalog.model';
import type { MeasuresBulkUpdateRequest, SeriesMeasuresData } from '../utils-models/measures.model';
import { PlanningGeneralDataStore } from './planning-general-data.store';

export type { CatalogQueryParams, MeasuresMasterDataIItem };

interface MeasuresState {
  isInitialized: boolean;
}

const initialState: MeasuresState = {
  isInitialized: false,
};

export const MeasuresStore = signalStore(
  withState(initialState),

  withComputed(
    (store, measuresService = inject(MeasuresService), planningStore = inject(PlanningGeneralDataStore)) => ({
      fireTrialId: computed(() => planningStore.fireTrialId()),

      measuresResponse: computed(() => measuresService.measuresResource.value()),

      seriesMeasures: computed<SeriesMeasuresData[] | undefined>(() => {
        const response = measuresService.measuresResource.value();
        return response?.series;
      }),

      isLoadingMeasures: computed(() => measuresService.measuresResource.isLoading()),
      measuresError: computed(() => measuresService.measuresResource.error()),
      hasMeasuresError: computed(() => measuresService.measuresResource.error() !== null),

      updateMeasuresStatus: computed(() => measuresService.updateMeasuresResource.status()),
      isUpdatingMeasures: computed(() => measuresService.updateMeasuresResource.isLoading()),
      updateMeasuresError: computed(() => measuresService.updateMeasuresResource.error()),

      measuresCatalog: computed<MeasuresMasterDataIItem[]>(() => {
        const response = measuresService.measuresCatalogResource.value();
        return response?.items ?? [];
      }),

      measuresCatalogPagination: computed(() => {
        const response = measuresService.measuresCatalogResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingMeasuresCatalog: computed(() => measuresService.measuresCatalogResource.isLoading()),
      measuresCatalogError: computed(() => measuresService.measuresCatalogResource.error()),

      createMeasureStatus: computed(() => measuresService.createMeasureResource.status()),
      isCreatingMeasure: computed(() => measuresService.createMeasureResource.isLoading()),

      updateMeasureStatus: computed(() => measuresService.updateMeasureResource.status()),
      isUpdatingMeasure: computed(() => measuresService.updateMeasureResource.isLoading()),

      deleteMeasureStatus: computed(() => measuresService.deleteMeasureResource.status()),
      isDeletingMeasure: computed(() => measuresService.deleteMeasureResource.isLoading()),

      addFavoriteStatus: computed(() => measuresService.addFavoriteResource.status()),
      isAddingFavorite: computed(() => measuresService.addFavoriteResource.isLoading()),

      removeFavoriteStatus: computed(() => measuresService.removeFavoriteResource.status()),
      isRemovingFavorite: computed(() => measuresService.removeFavoriteResource.isLoading()),

      isLoading: computed(
        () =>
          measuresService.measuresResource.isLoading() ||
          measuresService.updateMeasuresResource.isLoading() ||
          measuresService.measuresCatalogResource.isLoading(),
      ),
    }),
  ),

  withMethods((store, measuresService = inject(MeasuresService), planningStore = inject(PlanningGeneralDataStore)) => ({
    loadMeasures(): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        measuresService.getMeasures(trialId);
        patchState(store, { isInitialized: true });
      }
    },

    reloadMeasures(): void {
      measuresService.measuresResource.reload();
    },

    updateMeasures(request: MeasuresBulkUpdateRequest): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        measuresService.updateMeasures(trialId, request);
      }
    },

    resetUpdateMeasures(): void {
      measuresService.resetUpdateMeasures();
    },

    loadMeasuresCatalog(params: CatalogQueryParams = {}): void {
      measuresService.getMeasuresCatalog(params);
    },

    createMeasure(request: MasterDataIItemUpdateRequest): void {
      measuresService.createMeasure(request);
    },

    updateMeasure(id: string, request: MasterDataIItemUpdateRequest): void {
      measuresService.updateMeasure(id, request);
    },

    deleteMeasure(id: string): void {
      measuresService.deleteMeasure(id);
    },

    resetCreateMeasure(): void {
      measuresService.resetCreateMeasure();
    },

    resetUpdateMeasure(): void {
      measuresService.resetUpdateMeasure();
    },

    resetDeleteMeasure(): void {
      measuresService.resetDeleteMeasure();
    },

    addFavorite(id: string): void {
      measuresService.addFavorite(id);
    },

    removeFavorite(id: string): void {
      measuresService.removeFavorite(id);
    },

    resetAddFavorite(): void {
      measuresService.resetAddFavorite();
    },

    resetRemoveFavorite(): void {
      measuresService.resetRemoveFavorite();
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type MeasuresStoreType = InstanceType<typeof MeasuresStore>;
