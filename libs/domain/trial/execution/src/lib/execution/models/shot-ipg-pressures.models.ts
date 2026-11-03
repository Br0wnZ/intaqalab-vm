import type { MeasureUnitEnum, PressureUnitEnum } from '@intaqalab/models';

/**
 * Par de sensor IPG y micromódulo con su presión máxima.
 */
export interface ShotIpgPressures {
  ipgSensorId: number | null;
  micromoduleId: number | null;
  maxPressure: number | null;
  maxPressureUnit?: PressureUnitEnum | MeasureUnitEnum | null;
  observations?: string | null;
}

/**
 * Request body para PUT /execution/ipg-pressures/series/{seriesId}/shots/{shotId} (Widget 32).
 */
export interface ShotIpgPressuresRequest {
  ipgPressuresData: ShotIpgPressures[];
}

/**
 * Response body para GET / PUT /execution/ipg-pressures/series/{seriesId}/shots/{shotId} (Widget 32).
 */
export interface ShotIpgPressuresResponse {
  ipgPressuresData: ShotIpgPressures[];
}
