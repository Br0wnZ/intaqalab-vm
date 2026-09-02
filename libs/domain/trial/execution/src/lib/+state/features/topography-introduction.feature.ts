import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { ShotTopographyRequest } from '../../execution/models/shot-topography.models';
import { ExecutionService } from '../../services/execution.service';
import type { TopographyIntroductionState } from '../execution-state.models';

interface TopographyIntroductionSlice {
  topographyIntroduction: TopographyIntroductionState;
}

const initialState: TopographyIntroductionSlice = {
  topographyIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: null,
    equipo: null,
    tiempoVuelo: null,
    tiempoVueloUnit: 's',
    tiempoIluminacion: null,
    tiempoIluminacionUnit: 's',
    numeroEstelaHumo: null,
    observaciones: null,
    equipoOptions: [
      { value: 'cron-01', label: 'Cronómetro 01' },
      { value: 'cron-02', label: 'Cronómetro 02' },
      { value: 'timer-01', label: 'Temporizador 01' },
    ],
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  },
};

export function withTopographyIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      isLoadingTopography: computed(() => executionService.shotTopographyResource.isLoading()),
      isSavingTopography: computed(() => executionService.updateShotTopographyResource.isLoading()),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      async loadShotTopography(fireTrialId: string, seriesId: string, shotId: string): Promise<void> {
        try {
          const response = await executionService.fetchShotTopography(fireTrialId, seriesId, shotId);
          if (response?.topographyData) {
            const data = response.topographyData;
            patchState(store, (state) => ({
              topographyIntroduction: {
                ...state.topographyIntroduction,
                equipo: data.chronometerId ?? state.topographyIntroduction.equipo,
                tiempoVuelo: data.flightTime ?? state.topographyIntroduction.tiempoVuelo,
                tiempoIluminacion: data.illuminationTime ?? state.topographyIntroduction.tiempoIluminacion,
                numeroEstelaHumo: data.smokeTrailCount ?? state.topographyIntroduction.numeroEstelaHumo,
                observaciones: data.observations ?? state.topographyIntroduction.observaciones,
              },
            }));
          }
        } catch (e) {
          console.error('Error loading Topography', e);
        }
      },
      async saveShotTopography(
        fireTrialId: string,
        seriesId: string,
        shotId: string,
        requestBody: ShotTopographyRequest,
      ): Promise<void> {
        await executionService.updateShotTopography(fireTrialId, seriesId, shotId, requestBody);
      },
      /** Actualiza los campos del widget Introducción datos topografía */
      updateTopographyIntroduction(updates: Partial<TopographyIntroductionState>): void {
        patchState(store, (state) => ({
          topographyIntroduction: { ...state.topographyIntroduction, ...updates },
        }));
      },
    })),
  );
}
