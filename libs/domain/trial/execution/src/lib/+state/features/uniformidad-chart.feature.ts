import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { UniformidadChartState } from '../execution-state.models';

interface UniformidadChartSlice {
  uniformidadChart: UniformidadChartState;
}

const initialState: UniformidadChartSlice = {
  uniformidadChart: {
    selectedConfig: 'tarado-z1',
    selectedSerie: 'Baja Z1',
    selectedDisparo: null,
    dataPoints: [
      { wc: 445, v0c: 263.47, serie: 'Baja Z1', disparo: 3 },
      { wc: 445, v0c: 264.15, serie: 'Baja Z1', disparo: 4 },
      { wc: 445, v0c: 261.93, serie: 'Baja Z1', disparo: 5 },
      { wc: 445, v0c: 260.57, serie: 'Baja Z1', disparo: 6 },
      { wc: 445, v0c: 265.02, serie: 'Alta Z1', disparo: 7 },
      { wc: 445, v0c: 263.88, serie: 'Alta Z1', disparo: 8 },
      { wc: 445, v0c: 262.41, serie: 'Alta Z1', disparo: 9 },
      { wc: 445, v0c: 261.14, serie: 'Alta Z1', disparo: 10 },
    ],
    configOptions: [
      { id: 'tarado-z1', label: 'Tarado Zona 1', velocidadNominal: 260, pendiente: 0.28986, wcTarado: 445.0519 },
    ],
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
    ],
    disparoOptions: [
      { value: '3', label: 'Disparo 3' },
      { value: '4', label: 'Disparo 4' },
      { value: '5', label: 'Disparo 5' },
      { value: '6', label: 'Disparo 6' },
      { value: '7', label: 'Disparo 7' },
      { value: '8', label: 'Disparo 8' },
      { value: '9', label: 'Disparo 9' },
      { value: '10', label: 'Disparo 10' },
    ],
  },
};

export function withUniformidadChart() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Gráfica Uniformidad */
      updateUniformidadChart(updates: Partial<UniformidadChartState>): void {
        patchState(store, (state) => ({
          uniformidadChart: { ...state.uniformidadChart, ...updates },
        }));
      },
    })),
  );
}
