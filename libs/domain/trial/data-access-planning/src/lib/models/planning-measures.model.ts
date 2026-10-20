/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/measures`
 * (Swagger planning-api v1.3.0 → TrialMeasuresResponse o TrialMunitionsResponse equivalente).
 * Incluye los metadatos del catálogo (unit, measurementArea, magnitudeCode) que los
 * widgets de ejecución usan para localizar medidas por familia y por código de magnitud.
 */
export type FunctionalFamilies = {
  topography: string;
  ballistics: string;
  munitions: string;
  armament: string;
};

export type MeasureData = {
  id: string;
  name: string;
  unit?: string | null;
  measurementArea?: string | null;
  magnitudeCode?: string | null;
  minLimit?: number | null;
  maxLimit?: number | null;
  deviation?: number | null;
};

export type SeriesMeasuresData = {
  seriesId: string;
  seriesName?: string;
  measures: {
    topographyMeasures: MeasureData[];
    munitionsMeasures: MeasureData[];
    armamentMeasures: MeasureData[];
    ballisticsMeasures: MeasureData[];
  };
};

export type TrialMeasuresResponse = {
  series: SeriesMeasuresData[];
};

/** Familias de medidas soportadas en la configuración por serie. */
export type MeasureFamilyKey = 'topographyMeasures' | 'munitionsMeasures' | 'armamentMeasures' | 'ballisticsMeasures';
