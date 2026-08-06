import { computed, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
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

      armamentResponse: computed(() => safeResourceValue(armamentService.armamentResource)),

      seriesArmament: computed<SeriesArmamentData[] | undefined>(() => {
        const response = safeResourceValue(armamentService.armamentResource);
        return response?.series;
      }),

      isLoadingArmament: computed(() => armamentService.armamentResource.isLoading()),

      armamentError: computed(() => armamentService.armamentResource.error()),

      hasArmamentError: computed(() => armamentService.armamentResource.error() !== null),

      updateArmamentStatus: computed(() => armamentService.updateArmamentResource.status()),

      isUpdatingArmament: computed(() => armamentService.updateArmamentResource.isLoading()),

      updateArmamentError: computed(() => armamentService.updateArmamentResource.error()),

      // Legacy weapons/tubes (carga inicial sin filtro)
      weapons: computed<SpecimenItem[]>(() => {
        const response = safeResourceValue(armamentService.weaponsResource);
        return response?.items ?? [];
      }),

      weaponsPagination: computed(() => {
        const response = safeResourceValue(armamentService.weaponsResource);
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
        const response = safeResourceValue(armamentService.tubesResource);
        return response?.items ?? [];
      }),

      tubesPagination: computed(() => {
        const response = safeResourceValue(armamentService.tubesResource);
        if (!response) return null;
        return {
          page: response.page,
          pageSize: response.pageSize,
          totalElements: response.totalElements,
        };
      }),

      isLoadingTubes: computed(() => armamentService.tubesResource.isLoading()),

      tubesError: computed(() => armamentService.tubesResource.error()),

      // Denominaciones arma reactivas (filtradas por itemType seleccionado)
      weaponDenominations: computed<SpecimenItem[]>(() => {
        const response = safeResourceValue(armamentService.weaponDenominationsResource);
        return response?.items ?? [];
      }),

      isLoadingWeaponDenominations: computed(() => armamentService.weaponDenominationsResource.isLoading()),

      // Equipos físicos de tubo reactivos (filtrados por familyId del arma seleccionada)
      tubeDenominations: computed<SpecimenItem[]>(() => {
        const response = safeResourceValue(armamentService.tubeDenominationsResource);
        return response?.items ?? [];
      }),

      isLoadingTubeDenominations: computed(() => armamentService.tubeDenominationsResource.isLoading()),

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
      armamentService.getWeapons();
      armamentService.getTubes();
    },

    /**
     * Carga denominaciones de arma filtradas por el itemType seleccionado.
     * Llama a GET /centers/{centerId}/equipment/denominations?itemType={itemType}
     */
    loadWeaponDenominations(itemType: string): void {
      armamentService.loadWeaponDenominations(itemType);
    },

    /**
     * Limpia el listado de denominaciones de arma.
     */
    clearWeaponDenominations(): void {
      armamentService.clearWeaponDenominations();
    },

    /**
     * Carga denominaciones de tubo filtradas por familyId del arma seleccionada.
     * Llama a GET /centers/{centerId}/equipment/denominations?itemType=TUBE&familyId={familyId}
     */
    loadTubeDenominations(familyId: number): void {
      armamentService.loadTubeDenominations(familyId);
    },

    /**
     * Limpia el listado de denominaciones de tubo.
     */
    clearTubeDenominations(): void {
      armamentService.clearTubeDenominations();
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
