import { computed, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type {
  TrajectographyRadarOrientationData,
  TrajectographyRadarOrientationResponse,
} from '../../execution/models';
import { ExecutionService } from '../../services/execution.service';
import type { CalibryRadarOption, RadarTrayectographyOrientationState } from '../execution-state.models';

interface RadarTrayectographyOrientationSlice {
  radarTrayectographyOrientation: RadarTrayectographyOrientationState;
}

const initialState: RadarTrayectographyOrientationSlice = {
  radarTrayectographyOrientation: {
    serie: null,
    disparo: null,
    radar: null,
    xPieza: null,
    yPieza: null,
    zPieza: null,
    difAngularTopografia: null,
    alcancePrevistoPique: null,
    velocidadInicialTeorica: null,
    tiempoVueloTeorico: null,
    graduacionEspoleta: null,
    anguloTiro: null,
    pesoNominalProyectil: null,
    longitudTubo: null,
    derivaTabular: null,
    radarOptions: [
      { value: 'radar-01', label: 'Radar 01', x: 450.0, y: 120.5 },
      { value: 'radar-02', label: 'Radar 02', x: 380.0, y: 250.0 },
    ],
  },
};

function getSelectedOrientationData(
  response: TrajectographyRadarOrientationResponse | undefined,
  selection: RadarTrayectographyOrientationState,
): TrajectographyRadarOrientationData | null {
  const series = response?.series.find((item) => item.seriesId === selection.serie) ?? response?.series[0] ?? null;
  return (
    series?.shots.find((item) => item.shotId === selection.disparo)?.orientationData ??
    series?.shots[0]?.orientationData ??
    null
  );
}

export function withRadarTrayectographyOrientation() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      radarTrayectographyOrientationResponse: computed(() =>
        safeResourceValue(executionService.radarTrayectographyOrientationResource),
      ),

      radarTrayectographyOrientationData: computed(() => {
        const response = safeResourceValue(executionService.radarTrayectographyOrientationResource);
        return getSelectedOrientationData(response, store.radarTrayectographyOrientation());
      }),

      /** OLT geográfico = difAngularTopografía + θ(arma→B4) */
      radarTrayectographyOltGeografico: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const xPieza = data === null ? s.xPieza : data.pieceX;
        const yPieza = data === null ? s.yPieza : data.pieceY;
        if (xPieza === null || yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - yPieza, b4.x - xPieza) * (180 / Math.PI);
        return s.difAngularTopografia + thetaDeg;
      }),

      /** X P. Caída = xPieza + alcance·sin(OLT) + deriva·cos(OLT) */
      radarTrayectographyXPCaida: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const xPieza = data === null ? s.xPieza : data.pieceX;
        const yPieza = data === null ? s.yPieza : data.pieceY;
        const alcancePrevistoPique = data === null ? s.alcancePrevistoPique : data.plannedImpactDistance;
        if (xPieza === null || yPieza === null || s.difAngularTopografia === null || alcancePrevistoPique === null)
          return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - yPieza, b4.x - xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const deriva = s.derivaTabular ?? 0;
        return xPieza + alcancePrevistoPique * Math.sin(oltRad) + deriva * Math.cos(oltRad);
      }),

      /** Y P. Caída = yPieza + alcance·cos(OLT) − deriva·sin(OLT) */
      radarTrayectographyYPCaida: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const xPieza = data === null ? s.xPieza : data.pieceX;
        const yPieza = data === null ? s.yPieza : data.pieceY;
        const alcancePrevistoPique = data === null ? s.alcancePrevistoPique : data.plannedImpactDistance;
        if (xPieza === null || yPieza === null || s.difAngularTopografia === null || alcancePrevistoPique === null)
          return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - yPieza, b4.x - xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const deriva = s.derivaTabular ?? 0;
        return yPieza + alcancePrevistoPique * Math.cos(oltRad) - deriva * Math.sin(oltRad);
      }),

      /** Diferencia angular radar = atan2(radar.y − B4.y, radar.x − B4.x) */
      radarTrayectographyDifAngularRadar: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const radar = s.radarOptions.find((r) => r.value === s.radar) ?? null;
        if (!radar) return null;
        const b4 = { x: 0, y: 0 };
        return Math.atan2(radar.y - b4.y, radar.x - b4.x) * (180 / Math.PI);
      }),

      /** I. Transversal = componente perpendicular de (radar−arma) respecto al eje OLT */
      radarTrayectographyITransversal: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const xPieza = data === null ? s.xPieza : data.pieceX;
        const yPieza = data === null ? s.yPieza : data.pieceY;
        const radar = s.radarOptions.find((r) => r.value === s.radar) ?? null;
        if (!radar || xPieza === null || yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - yPieza, b4.x - xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const dx = radar.x - xPieza;
        const dy = radar.y - yPieza;
        return dx * Math.cos(oltRad) - dy * Math.sin(oltRad);
      }),

      /** I. Longitudinal = componente paralela de (radar−arma) respecto al eje OLT */
      radarTrayectographyILongitudinal: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const xPieza = data === null ? s.xPieza : data.pieceX;
        const yPieza = data === null ? s.yPieza : data.pieceY;
        const radar = s.radarOptions.find((r) => r.value === s.radar) ?? null;
        if (!radar || xPieza === null || yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - yPieza, b4.x - xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const dx = radar.x - xPieza;
        const dy = radar.y - yPieza;
        return dx * Math.sin(oltRad) + dy * Math.cos(oltRad);
      }),

      /** Altura de boca = zPieza + sin(anguloTiro) × longitudTubo */
      radarTrayectographyAlturaBoca: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const data = getSelectedOrientationData(
          safeResourceValue(executionService.radarTrayectographyOrientationResource),
          s,
        );
        const zPieza = data === null ? s.zPieza : data.pieceZ;
        const anguloTiro = data === null ? s.anguloTiro : data.shootingAngle;
        if (zPieza === null || anguloTiro === null || s.longitudTubo === null) return null;
        return zPieza + Math.sin((anguloTiro * Math.PI) / 180) * s.longitudTubo;
      }),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      loadRadarTrayectographyOrientation(fireTrialId: string, radarId: string | null): void {
        executionService.getRadarTrayectographyOrientation(fireTrialId, radarId);
      },

      /** Actualiza los filtros de selección del widget (serie, disparo, radar) */
      updateRadarTrayectographySelection(
        updates: Partial<Pick<RadarTrayectographyOrientationState, 'serie' | 'disparo' | 'radar'>>,
      ): void {
        patchState(store, (state) => ({
          radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, ...updates },
        }));
      },

      /**
       * Actualiza los datos procedentes de los widgets MAO.
       * Llamar cuando MAO Topografía o MAO JLT persistan sus datos.
       */
      updateRadarTrayectographyMaoData(
        data: Partial<Omit<RadarTrayectographyOrientationState, 'serie' | 'disparo' | 'radar' | 'radarOptions'>>,
      ): void {
        patchState(store, (state) => ({
          radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, ...data },
        }));
      },

      /** Reemplaza la lista de radares (cuando se integre con la API de Calibry) */
      setRadarOptions(options: CalibryRadarOption[]): void {
        patchState(store, (state) => ({
          radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, radarOptions: options },
        }));
      },
    })),
  );
}
