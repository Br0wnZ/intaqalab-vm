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
    serieOptions: [],
    disparoOptions: [],
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
