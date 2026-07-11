import { computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { CalibryCameraOption, VideoCameraOrientationState } from '../execution-state.models';

interface VideoCameraOrientationSlice {
  videoCameraOrientation: VideoCameraOrientationState;
}

const initialState: VideoCameraOrientationSlice = {
  videoCameraOrientation: {
    camera: null,
    serie: null,
    disparo: null,
    estimatedDistancePique: null,
    operatingHeight: null,
    operatingRange: null,
    cameraOptions: [
      { value: 'cam-01', label: 'Cámara 01', x: 120.5, y: 340.2 },
      { value: 'cam-02', label: 'Cámara 02', x: 95.0, y: 410.8 },
      { value: 'cam-03', label: 'Cámara 03', x: 200.3, y: 280.0 },
    ],
  },
};

export function withVideoCameraOrientation() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      // Video Camera Orientation — diferencia angular calculada
      videoCameraAngularDifference: computed((): number | null => {
        const vco = store.videoCameraOrientation();
        const cam = vco.cameraOptions.find((c) => c.value === vco.camera) ?? null;
        const height = vco.operatingHeight;
        const range = vco.operatingRange;

        if (!cam || height === null || range === null || range === 0) return null;

        // Coordenadas de la piqueta B4 en Calibry (placeholder hasta integración real)
        const b4 = { x: 0, y: 0 };
        const dX = cam.x - b4.x;
        const dY = cam.y - b4.y;
        const horizontalDist = Math.sqrt(dX * dX + dY * dY);

        if (horizontalDist === 0) return null;

        const angleCameraRad = Math.atan2(height, horizontalDist);
        const angleRangeRad = Math.atan2(height, range);
        return (angleCameraRad - angleRangeRad) * (180 / Math.PI);
      }),
    })),
    withMethods((store) => ({
      /** Actualiza la selección de cámara, serie y/o disparo del widget */
      updateVideoCameraSelection(
        updates: Partial<Pick<VideoCameraOrientationState, 'camera' | 'serie' | 'disparo'>>,
      ): void {
        patchState(store, (state) => ({
          videoCameraOrientation: { ...state.videoCameraOrientation, ...updates },
        }));
      },

      /**
       * Actualiza los campos de salida procedentes del widget MAO.
       * Llamar cuando el widget MAO persiste sus datos.
       */
      updateMaoOutputs(
        outputs: Partial<
          Pick<VideoCameraOrientationState, 'estimatedDistancePique' | 'operatingHeight' | 'operatingRange'>
        >,
      ): void {
        patchState(store, (state) => ({
          videoCameraOrientation: { ...state.videoCameraOrientation, ...outputs },
        }));
      },

      /** Reemplaza la lista de cámaras (cuando se integre con la API de Calibry) */
      setCameraOptions(options: CalibryCameraOption[]): void {
        patchState(store, (state) => ({
          videoCameraOrientation: { ...state.videoCameraOrientation, cameraOptions: options },
        }));
      },
    })),
  );
}
