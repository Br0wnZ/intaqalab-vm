import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

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
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos topografía */
      updateTopographyIntroduction(updates: Partial<TopographyIntroductionState>): void {
        patchState(store, (state) => ({
          topographyIntroduction: { ...state.topographyIntroduction, ...updates },
        }));
      },
    })),
  );
}
