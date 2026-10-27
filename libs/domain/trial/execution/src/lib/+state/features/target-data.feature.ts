import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { TargetDataState } from '../execution-state.models';

interface TargetDataSlice {
  targetData: TargetDataState;
}

const initialState: TargetDataSlice = {
  targetData: {
    serie: null,
    disparo: null,
    blanco: null,
    material: null,
    dimensiones: null,
    espesor: null,
    espesorUnit: 'mm',
    distancia: null,
    distanciaUnit: 'm',
    inclinacion: null,
    inclinacionUnit: 'º',
    serieOptions: [],
    disparoOptions: [],
    blancoOptions: [],
    materialOptions: [],
    dimensionesOptions: [],
    sameDataAcrossDisparos: false,
    sameDataAcrossSeries: false,
  },
};

export function withTargetData() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Datos del Blanco */
      updateTargetData(updates: Partial<TargetDataState>): void {
        patchState(store, (state) => ({
          targetData: { ...state.targetData, ...updates },
        }));
      },
    })),
  );
}
