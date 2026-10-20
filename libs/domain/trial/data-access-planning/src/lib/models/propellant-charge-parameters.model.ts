/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/propelling-charge-parameters`
 * (Swagger planning-api v1.3.0 → PropellantChargeParametersResponse), widget 9 (Información Tarado).
 */
export type PropellantChargeParametersSeries = {
  seriesId: string;
  seriesNumber?: number;
  seriesName?: string;
  loadingZone?: string | null;
  nominalSpeed?: number | null;
  nominalSpeedUnit?: string | null;
  maximumSpeedDeviation?: number | null;
  maximumSpeedDeviationUnit?: string | null;
  powderWeight?: number | null;
  powderWeightUnit?: string | null;
  observations?: string | null;
};

export type PropellantChargeParametersResponse = {
  series: PropellantChargeParametersSeries[];
};

export type PropellingChargeParametersSeries = PropellantChargeParametersSeries;
export type PropellingChargeParametersResponse = PropellantChargeParametersResponse;
