import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { VigilanciaState } from '../execution-state.models';

interface VigilanciaSlice {
  vigilancia: VigilanciaState;
}

const initialState: VigilanciaSlice = {
  vigilancia: {
    serie: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    velocidadUnit: 'm/s',
    presionUnit: 'bar',
    lastChecked: null,
    v0c: { util1min: null, util1max: null, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    v0cMedia: { util1min: 818, util1max: 828, inutilmin: 806.5, inutilmax: 839.5, value: null, calificacion: null },
    sigmaV0c: { util1min: null, util1max: 5, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    presion: { util1min: null, util1max: 2680, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    presionMedia: { util1min: null, util1max: null, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    proyectil: { util1min: null, util1max: 0, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    espoleta: { util1min: null, util1max: 2, inutilmin: null, inutilmax: null, value: null, calificacion: null },
    estopin: { util1min: null, util1max: 1, inutilmin: null, inutilmax: null, value: null, calificacion: null },
  },
};

export function withVigilancia() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza el estado del widget Vigilancia */
      updateVigilancia(updates: Partial<VigilanciaState>): void {
        patchState(store, (state) => ({
          vigilancia: { ...state.vigilancia, ...updates },
        }));
      },
    })),
  );
}
