import type { SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';

/**
 * Parámetros de carga propulsora para una serie (Widget 9 - Tarado).
 * Fuente: Swagger planning-api.json -> PropellantChargeParametersSeries
 */
export interface PropellantChargeParametersSeries {
  seriesId: string;
  seriesNumber: number;
  seriesName: string;
  loadingZone: string | null;
  nominalSpeed: number | null;
  nominalSpeedUnit?: SpeedUnitEnum | null;
  maximumSpeedDeviation: number | null;
  maximumSpeedDeviationUnit?: SpeedUnitEnum | null;
  powderWeight: number | null;
  powderWeightUnit?: WeightUnitEnum | null;
  observations: string | null;
}

/**
 * Respuesta del endpoint GET /planning/propelling-charge-parameters.
 * Fuente: Swagger planning-api.json -> PropellantChargeParametersResponse
 */
export interface PropellantChargeParametersResponse {
  series: PropellantChargeParametersSeries[];
}

/** Alias con la nomenclatura del endpoint */
export type PropellingChargeParametersSeries = PropellantChargeParametersSeries;
export type PropellingChargeParametersResponse = PropellantChargeParametersResponse;
