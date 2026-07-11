import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { InformacionTaradoState } from '../execution-state.models';

interface InformacionTaradoSlice {
  informacionTarado: InformacionTaradoState;
}

const initialState: InformacionTaradoSlice = {
  informacionTarado: {
    velocidadUnit: 'm/s',
    series: [
      {
        numero: 'S1',
        nombre: 'Tarado pólvora tipo A Zona 1 (baja)',
        zona: '1',
        velocidadNominal: 260,
        desviacionVelocidadMax: 2.5,
        pesoPolvora: 400,
      },
      {
        numero: 'S2',
        nombre: 'Tarado pólvora tipo A Zona 1 (alta)',
        zona: '1',
        velocidadNominal: 285,
        desviacionVelocidadMax: 2.5,
        pesoPolvora: 450,
      },
      {
        numero: 'S3',
        nombre: 'Tarado pólvora tipo B Zona 3 (baja)',
        zona: '3',
        velocidadNominal: 310,
        desviacionVelocidadMax: 3.0,
        pesoPolvora: 810,
      },
      {
        numero: 'S4',
        nombre: 'Tarado pólvora tipo B Zona 3 (alta)',
        zona: '3',
        velocidadNominal: 340,
        desviacionVelocidadMax: 3.0,
        pesoPolvora: 910,
      },
    ],
  },
};

export function withInformacionTarado() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Información Tarado */
      updateInformacionTarado(updates: Partial<InformacionTaradoState>): void {
        patchState(store, (state) => ({
          informacionTarado: { ...state.informacionTarado, ...updates },
        }));
      },
    })),
  );
}
