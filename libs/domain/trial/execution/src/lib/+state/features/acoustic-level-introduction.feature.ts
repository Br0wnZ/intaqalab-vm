import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { ShotAcousticLevelRequest } from '../../execution/models/shot-acoustic-level.models';
import { ExecutionService } from '../../services/execution.service';
import type { AcousticLevelIntroductionState } from '../execution-state.models';

interface AcousticLevelIntroductionSlice {
  acousticLevelIntroduction: AcousticLevelIntroductionState;
}

const initialState: AcousticLevelIntroductionSlice = {
  acousticLevelIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    equipo: null,
    xSonometro: null,
    ySonometro: null,
    zSonometro: null,
    distanciaSonometroBoca: null,
    distanciaSonometroBocaUnit: 'm',
    nivelAcustico: null,
    nivelAcusticoUnit: 'db',
    observaciones: null,
    equipoOptions: [
      { value: 'sonometro-norsonic-140', label: 'Norsonic 140 / SN001' },
      { value: 'sonometro-norsonic-145', label: 'Norsonic 145 / SN002' },
      { value: 'sonometro-bruel-2270', label: 'Brüel & Kjær 2270 / SN003' },
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

export function withAcousticLevelIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      isLoadingAcousticLevel: computed(() => executionService.shotAcousticLevelResource.isLoading()),
      isSavingAcousticLevel: computed(() => executionService.updateShotAcousticLevelResource.isLoading()),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      async loadShotAcousticLevel(fireTrialId: string, seriesId: string, shotId: string): Promise<void> {
        try {
          const response = await executionService.fetchShotAcousticLevel(fireTrialId, seriesId, shotId);
          if (response?.acousticLevelData) {
            const data = response.acousticLevelData;
            patchState(store, (state) => ({
              acousticLevelIntroduction: {
                ...state.acousticLevelIntroduction,
                equipo: data.soundLevelMeterId ?? state.acousticLevelIntroduction.equipo,
                xSonometro: data.soundLevelMeterX ?? state.acousticLevelIntroduction.xSonometro,
                ySonometro: data.soundLevelMeterY ?? state.acousticLevelIntroduction.ySonometro,
                zSonometro: data.soundLevelMeterZ ?? state.acousticLevelIntroduction.zSonometro,
                distanciaSonometroBoca:
                  data.soundLevelMeterMuzzleDistance ?? state.acousticLevelIntroduction.distanciaSonometroBoca,
                nivelAcustico: data.acousticLevel ?? state.acousticLevelIntroduction.nivelAcustico,
                observaciones: data.observations ?? state.acousticLevelIntroduction.observaciones,
              },
            }));
          }
        } catch (e) {
          console.error('Error loading AcousticLevel', e);
        }
      },
      async saveShotAcousticLevel(
        fireTrialId: string,
        seriesId: string,
        shotId: string,
        requestBody: ShotAcousticLevelRequest,
      ): Promise<void> {
        await executionService.updateShotAcousticLevel(fireTrialId, seriesId, shotId, requestBody);
      },
      /** Actualiza los campos del widget Introducción datos nivel acústico */
      updateAcousticLevelIntroduction(updates: Partial<AcousticLevelIntroductionState>): void {
        patchState(store, (state) => ({
          acousticLevelIntroduction: { ...state.acousticLevelIntroduction, ...updates },
        }));
      },
    })),
  );
}
