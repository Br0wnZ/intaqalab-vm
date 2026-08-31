import type { DistanceUnitEnum } from '@intaqalab/models';

/**
 * Datos de presión con manómetros para un disparo.
 */
export interface ShotManometerPressures {
  pressureGaugeId?: string | null;
  crusherId?: string | null;
  probeId?: string | null;
  h1?: number | null;
  h1Unit?: DistanceUnitEnum | null;
  h2?: number | null;
  h2Unit?: DistanceUnitEnum | null;
  h3?: number | null;
  h3Unit?: DistanceUnitEnum | null;
  h4?: number | null;
  h4Unit?: DistanceUnitEnum | null;
  h5?: number | null;
  h5Unit?: DistanceUnitEnum | null;
  observations?: string | null;
}

/**
 * Request body para PUT /execution/manometer-pressures/series/{seriesId}/shots/{shotId} (Widget 21).
 */
export type ShotManometerPressuresRequest = ShotManometerPressures;

/**
 * Response body para GET / PUT /execution/manometer-pressures/series/{seriesId}/shots/{shotId} (Widget 21).
 */
export interface ShotManometerPressuresResponse {
  manometerPressuresData?: ShotManometerPressures | null;
}
