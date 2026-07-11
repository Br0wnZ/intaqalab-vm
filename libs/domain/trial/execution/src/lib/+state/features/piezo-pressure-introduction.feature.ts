import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { PiezoPosicionState, PiezoPressureIntroductionState } from '../execution-state.models';

interface PiezoPressureIntroductionSlice {
  piezoPressureIntroduction: PiezoPressureIntroductionState;
}

const initialState: PiezoPressureIntroductionSlice = {
  piezoPressureIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    cierre: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    intermedio: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    culote: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    captadorOptions: [
      { value: 'captador-kistler-6215', label: 'Kistler 6215 / SN001' },
      { value: 'captador-kistler-6215b', label: 'Kistler 6215B / SN002' },
    ],
    amplificadorOptions: [
      { value: 'amp-kistler-5018', label: 'Kistler 5018 / SN101' },
      { value: 'amp-kistler-5019', label: 'Kistler 5019 / SN102' },
    ],
    registradorOptions: [
      { value: 'reg-yokogawa-dl850', label: 'Yokogawa DL850 / SN201' },
      { value: 'reg-yokogawa-dl9040', label: 'Yokogawa DL9040 / SN202' },
    ],
  },
};

export function withPiezoPressureIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos presión piezoeléctrica */
      updatePiezoPressureIntroduction(updates: Partial<PiezoPressureIntroductionState>): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, ...updates },
        }));
      },

      /** Actualiza los datos de una posición piezoeléctrica concreta */
      updatePiezoPressurePosicion(
        posicion: 'cierre' | 'intermedio' | 'culote',
        updates: Partial<PiezoPosicionState>,
      ): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: {
            ...state.piezoPressureIntroduction,
            [posicion]: { ...state.piezoPressureIntroduction[posicion], ...updates },
          },
        }));
      },
    })),
  );
}
