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
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
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
