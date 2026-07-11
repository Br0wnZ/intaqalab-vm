import { computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

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

export function withRadarTrayectographyOrientation() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      /** OLT geográfico = difAngularTopografía + θ(arma→B4) */
      radarTrayectographyOltGeografico: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        if (s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
        return s.difAngularTopografia + thetaDeg;
      }),

      /** X P. Caída = xPieza + alcance·sin(OLT) + deriva·cos(OLT) */
      radarTrayectographyXPCaida: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        if (
          s.xPieza === null ||
          s.yPieza === null ||
          s.difAngularTopografia === null ||
          s.alcancePrevistoPique === null
        )
          return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const deriva = s.derivaTabular ?? 0;
        return s.xPieza + s.alcancePrevistoPique * Math.sin(oltRad) + deriva * Math.cos(oltRad);
      }),

      /** Y P. Caída = yPieza + alcance·cos(OLT) − deriva·sin(OLT) */
      radarTrayectographyYPCaida: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        if (
          s.xPieza === null ||
          s.yPieza === null ||
          s.difAngularTopografia === null ||
          s.alcancePrevistoPique === null
        )
          return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const deriva = s.derivaTabular ?? 0;
        return s.yPieza + s.alcancePrevistoPique * Math.cos(oltRad) - deriva * Math.sin(oltRad);
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
        const radar = s.radarOptions.find((r) => r.value === s.radar) ?? null;
        if (!radar || s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const dx = radar.x - s.xPieza;
        const dy = radar.y - s.yPieza;
        return dx * Math.cos(oltRad) - dy * Math.sin(oltRad);
      }),

      /** I. Longitudinal = componente paralela de (radar−arma) respecto al eje OLT */
      radarTrayectographyILongitudinal: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        const radar = s.radarOptions.find((r) => r.value === s.radar) ?? null;
        if (!radar || s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
        const b4 = { x: 0, y: 0 };
        const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
        const oltRad = ((s.difAngularTopografia + thetaDeg) * Math.PI) / 180;
        const dx = radar.x - s.xPieza;
        const dy = radar.y - s.yPieza;
        return dx * Math.sin(oltRad) + dy * Math.cos(oltRad);
      }),

      /** Altura de boca = zPieza + sin(anguloTiro) × longitudTubo */
      radarTrayectographyAlturaBoca: computed((): number | null => {
        const s = store.radarTrayectographyOrientation();
        if (s.zPieza === null || s.anguloTiro === null || s.longitudTubo === null) return null;
        return s.zPieza + Math.sin((s.anguloTiro * Math.PI) / 180) * s.longitudTubo;
      }),
    })),
    withMethods((store) => ({
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
