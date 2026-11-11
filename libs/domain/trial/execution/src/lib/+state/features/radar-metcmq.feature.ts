import { computed, effect, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { ShotMetcmService } from '../../data-access';
import type { RadarMetcmqState } from '../execution-state.models';

interface RadarMetcmqSlice {
  radarMetcmq: RadarMetcmqState;
}

const initialState: RadarMetcmqSlice = {
  radarMetcmq: {
    serie: null,
    disparo: null,
    texto: null,
    isLoading: false,
    error: null,
    serieOptions: [],
    disparoOptions: [],
  },
};

export function withRadarMetcmq() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      isLoadingRadarMetcm: computed(() => store.radarMetcmq().isLoading),
      radarMetcmError: computed(() => store.radarMetcmq().error),
    })),
    withMethods((store, shotMetcmService = inject(ShotMetcmService)) => {
      return {
        loadRadarMetcm(fireTrialId: string | null, seriesId: string | null, shotId: string | null): void {
          patchState(store, (state) => ({
            radarMetcmq: {
              ...state.radarMetcmq,
              serie: seriesId,
              disparo: shotId,
              texto: null,
              error: null,
              isLoading: !!fireTrialId && !!seriesId && !!shotId,
            },
          }));
          if (fireTrialId && seriesId && shotId) {
            shotMetcmService.loadShotMetcm(fireTrialId, seriesId, shotId);
          } else {
            shotMetcmService.resetShotMetcm();
          }
        },
        /** Actualiza los campos del widget Radar Trayectografía METCMQ */
        updateRadarMetcmq(updates: Partial<RadarMetcmqState>): void {
          patchState(store, (state) => ({
            radarMetcmq: { ...state.radarMetcmq, ...updates },
          }));
        },
      };
    }),
    withHooks((store, shotMetcmService = inject(ShotMetcmService)) => ({
      onInit(): void {
        effect(() => {
          const response = shotMetcmService.shotMetcmResource.value();
          const error = shotMetcmService.error();
          const isLoading = shotMetcmService.isLoading();
          const request = shotMetcmService.shotParams();
          if (!request) return;
          patchState(store, (state) => ({
            radarMetcmq: {
              ...state.radarMetcmq,
              texto: isLoading ? null : (response?.metcmData.blockText ?? null),
              error: error ? (error instanceof Error ? error.message : 'METCM_REQUEST_FAILED') : null,
              isLoading,
            },
          }));
        });
      },
    })),
  );
}
