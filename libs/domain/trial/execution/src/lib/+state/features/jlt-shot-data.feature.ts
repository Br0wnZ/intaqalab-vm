import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { JltShotDataState } from '../execution-state.models';

interface JltShotDataSlice {
  jltShotData: JltShotDataState;
}

const initialState: JltShotDataSlice = {
  jltShotData: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    jet: null,
    operadorPieza: null,
    equipoAtacado: null,
    atacado: null,
    equipoRetroceso: null,
    retroceso: null,
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
    equipoAtacadoOptions: [
      { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
      { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
    ],
    equipoRetrocesoOptions: [
      { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
      { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
    ],
  },
};

export function withJltShotData() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción de datos JLT */
      updateJltShotData(updates: Partial<JltShotDataState>): void {
        patchState(store, (state) => ({
          jltShotData: { ...state.jltShotData, ...updates },
        }));
      },
    })),
  );
}
