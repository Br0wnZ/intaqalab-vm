import { computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { OverpressureChartState, OverpressureInfoState } from '../execution-state.models';

interface OverpressureSlice {
  overpressureInfo: OverpressureInfoState;
  overpressureChart: OverpressureChartState;
}

const initialState: OverpressureSlice = {
  overpressureInfo: {
    presionMaxima: 273.75,
    presionMinima: 262.05,
    presionRef: 233.97,
    unidadPresion: 'MPa',
    presionSeguridad: 379.0,
  },
  overpressureChart: {
    selectedSerie: null,
    presionSeguridad: 379.0,
    presionMaxima: 273.75,
    presionMinima: 262.05,
    dataPoints: [
      {
        wc: 120,
        rectaPresion: 261.59435,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie A',
        disparo: 1,
      },
      {
        wc: 120,
        rectaPresion: 267.7424,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie A',
        disparo: 2,
      },
      {
        wc: 125,
        rectaPresion: 269.17735,
        desviacionMax: 311.8796835,
        desviacionMin: 255.1275651,
        serie: 'Serie A',
        disparo: 3,
      },
      {
        wc: 125,
        rectaPresion: 268.17225,
        desviacionMax: 311.8796835,
        desviacionMin: 255.1275651,
        serie: 'Serie A',
        disparo: 4,
      },
      {
        wc: 125,
        rectaPresion: 300.93165,
        desviacionMax: 311.8796835,
        desviacionMin: 255.1275651,
        serie: 'Serie A',
        disparo: 5,
      },
      {
        wc: 125,
        rectaPresion: 273.0324,
        desviacionMax: 311.8796835,
        desviacionMin: 255.1275651,
        serie: 'Serie A',
        disparo: 6,
      },
      {
        wc: 120,
        rectaPresion: 260.88365,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 7,
      },
      {
        wc: 120,
        rectaPresion: 278.2398,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 8,
      },
      {
        wc: 120,
        rectaPresion: 274.41675,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 9,
      },
      {
        wc: 120,
        rectaPresion: 277.07555,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 10,
      },
      {
        wc: 120,
        rectaPresion: 270.29795,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 11,
      },
      {
        wc: 120,
        rectaPresion: 245.86525,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 12,
      },
      {
        wc: 120,
        rectaPresion: 265.59345,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 13,
      },
      {
        wc: 120,
        rectaPresion: 270.4705,
        desviacionMax: 301.269236,
        desviacionMin: 244.5171176,
        serie: 'Serie B',
        disparo: 14,
      },
    ],
    regression: {
      pendiente: 2.0768,
      ordenada: 12.10195,
      correlacion: 0.41,
    },
    serieOptions: [
      { value: 'Serie A', label: 'Serie A' },
      { value: 'Serie B', label: 'Serie B' },
    ],
  },
};

export function withOverpressure() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      /** Presión buscada = media aritmética entre presión máxima y presión mínima */
      overpressurePresionBuscada: computed((): number | null => {
        const s = store.overpressureInfo();
        if (s.presionMaxima === null || s.presionMinima === null) return null;
        return (s.presionMaxima + s.presionMinima) / 2;
      }),
    })),
    withMethods((store) => ({
      /** Actualiza el estado del widget Información Sobrepresión */
      updateOverpressureInfo(updates: Partial<OverpressureInfoState>): void {
        patchState(store, (state) => ({
          overpressureInfo: { ...state.overpressureInfo, ...updates },
        }));
      },

      /** Actualiza el estado del widget Gráfica Sobrepresión */
      updateOverpressureChart(updates: Partial<OverpressureChartState>): void {
        patchState(store, (state) => ({
          overpressureChart: { ...state.overpressureChart, ...updates },
        }));
      },
    })),
  );
}
