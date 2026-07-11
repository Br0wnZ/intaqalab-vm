import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { DatosBlancoBolasState } from '../execution-state.models';

interface DatosBlancoBolaSlice {
  datosBlancoBola: DatosBlancoBolasState;
}

const initialState: DatosBlancoBolaSlice = {
  datosBlancoBola: {
    serie: 'funcionamiento-1',
    disparo: 'disparo-3',
    estadoDisparo: 'EN_CURSO',
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    blancoBolax: null,
    blancoBolay: null,
    blancoBolaz: null,
    bocaPiezaX: null,
    bocaPiezaY: null,
    bocaPiezaZ: null,
    diametroBola: null,
    alturaBola: null,
    altTripodeCamTransversal: null,
    camaraFrontalX: null,
    camaraFrontalY: null,
    camaraFrontalZ: null,
    altTripodeCamFrontal: null,
    camTransversalX: null,
    camTransversalY: null,
    camTransversalZ: null,
  },
};

export function withDatosBlancoBola() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Datos blanco bola */
      updateDatosBlancoBola(updates: Partial<DatosBlancoBolasState>): void {
        patchState(store, (state) => ({
          datosBlancoBola: { ...state.datosBlancoBola, ...updates },
        }));
      },
    })),
  );
}
