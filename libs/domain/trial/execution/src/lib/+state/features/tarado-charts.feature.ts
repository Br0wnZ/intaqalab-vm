import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { TaradoPresionChartState, TaradoVelocidadChartState } from '../execution-state.models';

interface TaradoChartsSlice {
  taradoVelocidadChart: TaradoVelocidadChartState;
  taradoPresionChart: TaradoPresionChartState;
}

const initialState: TaradoChartsSlice = {
  taradoVelocidadChart: {
    selectedSerie: null,
    selectedDisparo: null,
    selectedVelocidadNominal: '445',
    selectedConfiguracion: null,
    dataPoints: [
      { wc: 400, v0c: 240.93, serie: 'Baja Z1', disparo: 3 },
      { wc: 400, v0c: 244.96, serie: 'Baja Z1', disparo: 4 },
      { wc: 400, v0c: 243.27, serie: 'Baja Z1', disparo: 5 },
      { wc: 500, v0c: 278.47, serie: 'Alta Z1', disparo: 6 },
      { wc: 500, v0c: 281.56, serie: 'Alta Z1', disparo: 7 },
      { wc: 500, v0c: 280.99, serie: 'Alta Z1', disparo: 8 },
      { wc: 810, v0c: 367.63, serie: 'Baja Z3', disparo: 9 },
      { wc: 810, v0c: 366.84, serie: 'Baja Z3', disparo: 10 },
      { wc: 810, v0c: 368.12, serie: 'Baja Z3', disparo: 11 },
      { wc: 910, v0c: 392.59, serie: 'Alta Z3', disparo: 12 },
      { wc: 910, v0c: 392.27, serie: 'Alta Z3', disparo: 13 },
      { wc: 910, v0c: 392.65, serie: 'Alta Z3', disparo: 14 },
    ],
    regression: {
      pendiente: 0.28986,
      ordenada: 130.99553,
      correlacion: 0.99841,
      wcTarado: 445.0519,
      pesoTarado: 445,
    },
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
      { value: 'Baja Z3', label: 'Baja Z3' },
      { value: 'Alta Z3', label: 'Alta Z3' },
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
      { value: '11', label: 'Disparo 11' },
      { value: '12', label: 'Disparo 12' },
      { value: '13', label: 'Disparo 13' },
      { value: '14', label: 'Disparo 14' },
    ],
    velocidadNominalOptions: [{ value: '445', label: '445 m/s' }],
    configuracionOptions: [{ value: 'tarado-z1', label: 'Tarado Z1' }],
  },
  taradoPresionChart: {
    selectedSerie: null,
    selectedDisparo: null,
    presionBuscada: 335,
    dataPoints: [
      { wc: 400, presion: 246.93, serie: 'Baja Z1', disparo: 3 },
      { wc: 400, presion: 250.96, serie: 'Baja Z1', disparo: 4 },
      { wc: 400, presion: 249.27, serie: 'Baja Z1', disparo: 5 },
      { wc: 500, presion: 276.47, serie: 'Alta Z1', disparo: 6 },
      { wc: 500, presion: 279.56, serie: 'Alta Z1', disparo: 7 },
      { wc: 500, presion: 278.99, serie: 'Alta Z1', disparo: 8 },
      { wc: 810, presion: 365.63, serie: 'Baja Z3', disparo: 9 },
      { wc: 810, presion: 364.84, serie: 'Baja Z3', disparo: 10 },
      { wc: 810, presion: 366.12, serie: 'Baja Z3', disparo: 11 },
      { wc: 910, presion: 440.59, serie: 'Alta Z3', disparo: 12 },
      { wc: 910, presion: 440.27, serie: 'Alta Z3', disparo: 13 },
      { wc: 910, presion: 440.65, serie: 'Alta Z3', disparo: 14 },
    ],
    regression: {
      pendiente: 0.28986,
      ordenada: 130.99553,
      correlacion: 0.99841,
      wcTarado: 703.6,
      pesoTarado: 704,
    },
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
      { value: 'Baja Z3', label: 'Baja Z3' },
      { value: 'Alta Z3', label: 'Alta Z3' },
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
      { value: '11', label: 'Disparo 11' },
      { value: '12', label: 'Disparo 12' },
      { value: '13', label: 'Disparo 13' },
      { value: '14', label: 'Disparo 14' },
    ],
  },
};

export function withTaradoCharts() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza el estado del widget Gráfica Tarado - Velocidad */
      updateTaradoVelocidadChart(updates: Partial<TaradoVelocidadChartState>): void {
        patchState(store, (state) => ({
          taradoVelocidadChart: { ...state.taradoVelocidadChart, ...updates },
        }));
      },

      /** Actualiza los campos del widget Gráfica Tarado - Presiones */
      updateTaradoPresionChart(updates: Partial<TaradoPresionChartState>): void {
        patchState(store, (state) => ({
          taradoPresionChart: { ...state.taradoPresionChart, ...updates },
        }));
      },
    })),
  );
}
