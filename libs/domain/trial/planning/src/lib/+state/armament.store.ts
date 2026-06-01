import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type {
  ArmamentBulkUpdateRequest,
  CatalogQueryParams,
  SeriesArmamentData,
  SpecimenItem,
} from '../services/armament-service';
import { ArmamentService } from '../services/armament-service';
import { PlanningGeneralDataStore } from './planning-general-data.store';

interface ArmamentState {
  isInitialized: boolean;
}

const initialState: ArmamentState = {
  isInitialized: false,
};

export const ArmamentStore = signalStore(
  withState(initialState),

  withComputed(
    (store, armamentService = inject(ArmamentService), planningStore = inject(PlanningGeneralDataStore)) => ({
      fireTrialId: computed(() => planningStore.fireTrialId()),

      armamentResponse: computed(() => armamentService.armamentResource.value()),

      seriesArmament: computed<SeriesArmamentData[] | undefined>(() => {
        const response = armamentService.armamentResource.value();
        return response?.series;
      }),

      isLoadingArmament: computed(() => armamentService.armamentResource.isLoading()),

      armamentError: computed(() => armamentService.armamentResource.error()),

      hasArmamentError: computed(() => armamentService.armamentResource.error() !== null),

      updateArmamentStatus: computed(() => armamentService.updateArmamentResource.status()),

      isUpdatingArmament: computed(() => armamentService.updateArmamentResource.isLoading()),

      updateArmamentError: computed(() => armamentService.updateArmamentResource.error()),

      weapons: computed<SpecimenItem[]>(() => {
        const response = armamentService.weaponsResource.value();
        return response?.items ?? [];
      }),

      weaponsPagination: computed(() => {
        const response = armamentService.weaponsResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingWeapons: computed(() => armamentService.weaponsResource.isLoading()),

      weaponsError: computed(() => armamentService.weaponsResource.error()),

      tubes: computed<SpecimenItem[]>(() => {
        const response = armamentService.tubesResource.value();
        return response?.items ?? [];
      }),

      tubesPagination: computed(() => {
        const response = armamentService.tubesResource.value();
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingTubes: computed(() => armamentService.tubesResource.isLoading()),

      tubesError: computed(() => armamentService.tubesResource.error()),

      isLoadingCatalogs: computed(
        () => armamentService.weaponsResource.isLoading() || armamentService.tubesResource.isLoading(),
      ),

      isLoading: computed(
        () =>
          armamentService.armamentResource.isLoading() ||
          armamentService.updateArmamentResource.isLoading() ||
          armamentService.weaponsResource.isLoading() ||
          armamentService.tubesResource.isLoading(),
      ),
    }),
  ),

  withMethods((store, armamentService = inject(ArmamentService), planningStore = inject(PlanningGeneralDataStore)) => ({
    loadArmament(): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        armamentService.getArmament(trialId);
        patchState(store, { isInitialized: true });
      }
    },

    reloadArmament(): void {
      armamentService.armamentResource.reload();
    },

    updateArmament(request: ArmamentBulkUpdateRequest): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        armamentService.updateArmament(trialId, request);
      }
    },

    resetUpdateArmament(): void {
      armamentService.resetUpdateArmament();
    },

    loadWeapons(params: CatalogQueryParams = {}): void {
      armamentService.getWeapons(params);
    },

    loadTubes(params: CatalogQueryParams = {}): void {
      armamentService.getTubes(params);
    },

    loadAllCatalogs(): void {
      armamentService.getWeapons({ active: true });
      armamentService.getTubes({ active: true });
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

export type ArmamentStoreType = InstanceType<typeof ArmamentStore>;
