import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { PassCoordsState } from '../execution-state.models';

interface PassCoordsSlice {
  passCoords: PassCoordsState;
}

const initialState: PassCoordsSlice = {
  passCoords: {
    serie: null,
    disparo: null,
    alturaBocaBolaPieza: null,
    distanciaGeometricaBocaBola: null,
    distanciaCamaraFrontalBola: null,
    distanciaCamaraTransversalBola: null,
    incrementoCotaCamaraFrontalBola: null,
    incrementoCotaCamaraTransversalBola: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  },
};

export function withPassCoords() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Cálculo coordenadas de paso */
      updatePassCoords(updates: Partial<PassCoordsState>): void {
        patchState(store, (state) => ({
          passCoords: { ...state.passCoords, ...updates },
        }));
      },
    })),
  );
}
