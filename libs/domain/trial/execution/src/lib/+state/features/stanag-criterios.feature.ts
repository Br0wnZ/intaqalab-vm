import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { StanagCriteriosState } from '../execution-state.models';

interface StanagCriteriosSlice {
  stanagCriterios: StanagCriteriosState;
}

const initialState: StanagCriteriosSlice = {
  stanagCriterios: {
    lastChecked: null,
    criterios: [
      {
        id: 'c1',
        texto: 'Velocidad inicial V0 dentro del ±2\u202f% de la velocidad nominal especificada en el contrato.',
        cumple: true,
      },
      {
        id: 'c2',
        texto:
          'Dispersión D50 inferior al límite establecido en la tabla de requisitos del pliego de prescripciones técnicas.',
        cumple: false,
      },
      {
        id: 'c3',
        texto: 'Presión de recámara máxima Pm ≤ 530\u202fMPa en todas las mediciones efectuadas.',
        cumple: true,
      },
      {
        id: 'c4',
        texto: 'Variación de velocidad entre disparos σV ≤ desviación máxima especificada en planificación.',
        cumple: null,
      },
      {
        id: 'c5',
        texto: 'Funcionamiento correcto del elemento impulsor en el 100\u202f% de los disparos del ensayo.',
        cumple: true,
      },
      {
        id: 'c6',
        texto:
          'Temperatura ambiente dentro del rango operativo −20\u202f°C a +52\u202f°C durante toda la sesión de fuego.',
        cumple: true,
      },
    ],
  },
};

export function withStanagCriterios() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Criterios STANAG */
      updateStanagCriterios(updates: Partial<StanagCriteriosState>): void {
        patchState(store, (state) => ({
          stanagCriterios: { ...state.stanagCriterios, ...updates },
        }));
      },
    })),
  );
}
