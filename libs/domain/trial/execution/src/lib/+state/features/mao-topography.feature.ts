import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { ShotMaoTopographyRequest } from '../../execution/models/shot-mao-topography.models';
import { ExecutionService } from '../../services/execution.service';
import type { CalibryObserverOption, MaoTopographyState } from '../execution-state.models';

interface MaoTopographySlice {
  maoTopography: MaoTopographyState;
}

const initialState: MaoTopographySlice = {
  maoTopography: {
    serie: null,
    disparo: null,
    observador: null,
    xPieza: null,
    yPieza: null,
    zPieza: null,
    xBlanco: null,
    yBlanco: null,
    zBlanco: null,
    observadorOptions: [
      { value: 'obs-01', label: 'Observador 1 (OP-Norte)' },
      { value: 'obs-02', label: 'Observador 2 (OP-Sur)' },
      { value: 'obs-03', label: 'Observador 3 (OP-Este)' },
    ],
    blancoEnabled: true,
  },
};

export function withMaoTopography() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      isLoadingMaoTopography: computed(() => executionService.shotMaoTopographyResource.isLoading()),
      isSavingMaoTopography: computed(() => executionService.updateShotMaoTopographyResource.isLoading()),
      /** Distancia boca-blanco = sqrt((xB−xP)² + (yB−yP)² + (zB−zP)²) — salida de topografía */
      maoTopographyDistanciaBocaBlanco: computed((): number | null => {
        const s = store.maoTopography();
        if (
          s.xPieza === null ||
          s.yPieza === null ||
          s.zPieza === null ||
          s.xBlanco === null ||
          s.yBlanco === null ||
          s.zBlanco === null
        )
          return null;
        return Math.sqrt(
          Math.pow(s.xBlanco - s.xPieza, 2) + Math.pow(s.yBlanco - s.yPieza, 2) + Math.pow(s.zBlanco - s.zPieza, 2),
        );
      }),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      async loadShotMaoTopography(fireTrialId: string, seriesId: string, shotId: string): Promise<void> {
        try {
          const response = await executionService.fetchShotMaoTopography(fireTrialId, seriesId, shotId);
          if (response?.maoTopographyData) {
            const data = response.maoTopographyData;
            patchState(store, (state) => ({
              maoTopography: {
                ...state.maoTopography,
                xPieza: data.pieceX ?? state.maoTopography.xPieza,
                yPieza: data.pieceY ?? state.maoTopography.yPieza,
                zPieza: data.pieceZ ?? state.maoTopography.zPieza,
                xBlanco: data.targetX ?? state.maoTopography.xBlanco,
                yBlanco: data.targetY ?? state.maoTopography.yBlanco,
                zBlanco: data.targetZ ?? state.maoTopography.zBlanco,
              },
            }));
          }
        } catch (e) {
          console.error('Error loading MaoTopography', e);
        }
      },
      async saveShotMaoTopography(
        fireTrialId: string,
        seriesId: string,
        shotId: string,
        requestBody: ShotMaoTopographyRequest,
      ): Promise<void> {
        await executionService.updateShotMaoTopography(fireTrialId, seriesId, shotId, requestBody);
      },
      /** Actualiza los campos de entrada del widget MAO Topografía */
      updateMaoTopography(updates: Partial<MaoTopographyState>): void {
        patchState(store, (state) => ({
          maoTopography: { ...state.maoTopography, ...updates },
        }));
      },

      /** Reemplaza la lista de observadores (cuando se integre con la API de Calibry) */
      setObserverOptions(options: CalibryObserverOption[]): void {
        patchState(store, (state) => ({
          maoTopography: { ...state.maoTopography, observadorOptions: options },
        }));
      },
    })),
  );
}
