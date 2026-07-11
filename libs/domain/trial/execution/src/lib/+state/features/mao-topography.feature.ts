import { computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { CalibryObserverOption, MaoTopographyState } from '../execution-state.models';

interface MaoTopographySlice {
  maoTopography: MaoTopographyState;
}

const initialState: MaoTopographySlice = {
  maoTopography: {
    serie: null,
    disparo: null,
    olt: null,
    xPieza: null,
    yPieza: null,
    zPieza: null,
    observador: null,
    xBlanco: null,
    yBlanco: null,
    zBlanco: null,
    observadorOptions: [
      { value: 'obs-01', label: 'Observador 01' },
      { value: 'obs-02', label: 'Observador 02' },
    ],
    blancoEnabled: true,
  },
};

export function withMaoTopography() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      /** Distancia boca-blanco = sqrt((xB−xP)² + (yB−yP)² + (zB−zP)²) — salida de topografía */
      maoTopographyDistanciaBocaBlanco: computed((): number | null => {
        const s = store.maoTopography();
        if (
          s.xPieza === null ||
          s.yPieza === null ||
          s.zPieza === null ||
          s.xBlanco === null ||
          s.yBlanco === null ||
          s.zBlanco === null
        )
          return null;
        return Math.sqrt(
          Math.pow(s.xBlanco - s.xPieza, 2) + Math.pow(s.yBlanco - s.yPieza, 2) + Math.pow(s.zBlanco - s.zPieza, 2),
        );
      }),
    })),
    withMethods((store) => ({
      /** Actualiza los campos de entrada del widget MAO Topografía */
      updateMaoTopography(updates: Partial<MaoTopographyState>): void {
        patchState(store, (state) => ({
          maoTopography: { ...state.maoTopography, ...updates },
        }));
      },

      /** Reemplaza la lista de observadores (cuando se integre con la API de Calibry) */
      setObserverOptions(options: CalibryObserverOption[]): void {
        patchState(store, (state) => ({
          maoTopography: { ...state.maoTopography, observadorOptions: options },
        }));
      },
    })),
  );
}
