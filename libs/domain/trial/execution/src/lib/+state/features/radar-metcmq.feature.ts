import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { RadarMetcmqState } from '../execution-state.models';

interface RadarMetcmqSlice {
  radarMetcmq: RadarMetcmqState;
}

const initialState: RadarMetcmqSlice = {
  radarMetcmq: {
    serie: null,
    disparo: null,
    texto: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  },
};

export function withRadarMetcmq() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Radar Trayectografía METCMQ */
      updateRadarMetcmq(updates: Partial<RadarMetcmqState>): void {
        patchState(store, (state) => ({
          radarMetcmq: { ...state.radarMetcmq, ...updates },
        }));
      },
    })),
  );
}
