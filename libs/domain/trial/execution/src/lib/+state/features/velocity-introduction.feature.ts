import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { VelocityIntroductionState } from '../execution-state.models';

interface VelocityIntroductionSlice {
  velocityIntroduction: VelocityIntroductionState;
}

const initialState: VelocityIntroductionSlice = {
  velocityIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    radarDoppler: null,
    antena: null,
    velocidad: null,
    velocidadUnit: 'm/s',
    incertidumbreSoftware: null,
    incertidumbreSoftwareUnit: 'm/s',
    perdida: null,
    perdidaUnit: 'm/s',
    cadencia: null,
    cadenciaUnit: 'dpm',
    observaciones: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    radarDopplerOptions: [
      { value: 'W700I_SN8302', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'W700I_SN9001', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
    antenaOptions: [
      { value: 'SL520A_SN6124', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'SL520A_SN7200', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
  },
};

export function withVelocityIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos velocidades */
      updateVelocityIntroduction(updates: Partial<VelocityIntroductionState>): void {
        patchState(store, (state) => ({
          velocityIntroduction: { ...state.velocityIntroduction, ...updates },
        }));
      },
    })),
  );
}
