import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { CalibryCameraOption, CalibryEquipmentOption } from '../execution-state.models';

export interface VideoDataIntroductionState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Tipo de vídeo: AV (alta velocidad) o C (convencional) */
  tipoVideo: 'AV' | 'C' | null;
  /** Cámara seleccionada (id de Calibry) */
  camera: string | null;
  /** Grabador seleccionado (id de Calibry) */
  grabador: string | null;
  /** Canal seleccionado (01-32) */
  canal: string | null;
  /** Magnitud seleccionada (id de la magnitud planificada) */
  magnitud: string | null;
  /** Resultado observado (texto libre) */
  resultadoObservado: string | null;
  /** Observaciones (texto libre) */
  observaciones: string | null;
  /** Estado del disparo seleccionado (read-only, procedente del widget JLT MAO o similar) */
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
  /** Lista de tipos de vídeo */
  tipoVideoOptions: { value: string; label: string }[];
  /** Lista de cámaras disponibles en Calibry (filtradas por familia de video) */
  cameraOptions: CalibryCameraOption[];
  /** Lista de grabadores disponibles en Calibry (filtrados por familia de sistemas de video) */
  grabadorOptions: CalibryEquipmentOption[];
  /** Lista de canales (01-32) */
  canalOptions: { value: string; label: string }[];
  /** Lista de magnitudes disponibles (procedentes de planificación) */
  magnitudOptions: { value: string; label: string }[];
}

interface VideoDataIntroductionSlice {
  videoDataIntroduction: VideoDataIntroductionState;
}

const initialState: VideoDataIntroductionSlice = {
  videoDataIntroduction: {
    serie: null,
    disparo: null,
    tipoVideo: null,
    camera: null,
    grabador: null,
    canal: null,
    magnitud: null,
    resultadoObservado: null,
    observaciones: null,
    estadoDisparo: null,
    serieOptions: [],
    disparoOptions: [],
    tipoVideoOptions: [
      { value: 'AV', label: 'Video AV (alta velocidad)' },
      { value: 'C', label: 'Video C (convencional)' },
    ],
    cameraOptions: [],
    grabadorOptions: [],
    canalOptions: Array.from({ length: 32 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: String(i + 1).padStart(2, '0'),
    })),
    magnitudOptions: [],
  },
};

export function withVideoDataIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      updateVideoDataIntroduction(updates: Partial<VideoDataIntroductionState>) {
        patchState(store, (state) => ({
          ...state,
          videoDataIntroduction: {
            ...state.videoDataIntroduction,
            ...updates,
          },
        }));
      },
      resetVideoDataIntroduction() {
        patchState(store, initialState);
      },
    })),
  );
}
