import type { AngleUnitEnum, DistanceUnitEnum, FireTrial, SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';

export const MAX_DISTANCE_VALUE = 10_000;
export const MAX_ANGULAR_VALUE = 6_400;
export const MAX_WEIGHT_VALUE = 10_000;

/**
 * Unidades que devuelve el backend para cada campo numérico del disparo.
 * Los valores son cadenas del enum correspondiente (ej: "M", "DEGREES").
 */
export type ShootingConditionsUnits = {
  distance: DistanceUnitEnum | null;
  orientation: AngleUnitEnum | null;
  targetInclination: AngleUnitEnum | null;
  elevation: AngleUnitEnum | null;
  angle: AngleUnitEnum | null;
  range: DistanceUnitEnum | null;
  functioningHeight: DistanceUnitEnum | null;
  nominalSpeed: SpeedUnitEnum | null;
  powderWeight: WeightUnitEnum | null;
  projectileWeight: WeightUnitEnum | null;
};

export type ShootingConditionsResponse = {
  units: ShootingConditionsUnits;
  series: Serie[];
};

export type Serie = {
  seriesId: string;
  seriesName: string;
  shots: Shot[];
};

export type Shot = {
  shotId: string;
  globalNumber: number;
  date: string;
  targetTypeId: string;
  targetMaterialId: string;
  targetDimensionsId: string;
  targetThicknessId: string;
  distance: number;
  distanceUnit: string;
  targetInclination: number;
  targetInclinationUnit: string;
  orientation: number;
  orientationUnit: string;
  elevation: number;
  elevationUnit: string;
  angle: number;
  angleUnit: string;
  range: number;
  rangeUnit: string;
  impactZoneId: string;
  functioningHeight: number;
  functioningHeightUnit: string;
  projectileWeight: number;
  projectileWeightUnit: string;
  nominalSpeed: number;
  nominalSpeedUnit: string;
  powderWeight: number;
  powderWeightUnit: string;
  observations: string;
};

export type UpdateConditionsRequest = {
  trialId: FireTrial['id'];
  units?: ShootingConditionsUnits;
  shots: UpdateShot[];
};

export type UpdateShot = {
  shotId: string;
  date: string;
  targetTypeId: string;
  targetMaterialId: string;
  targetDimensionsId: string;
  targetThicknessId: string;
  distance: number;
  distanceUnit?: string;
  orientation: number;
  orientationUnit?: string;
  targetInclination: number;
  targetInclinationUnit?: string;
  elevation: number;
  elevationUnit?: string;
  angle: number;
  angleUnit?: string;
  range: number;
  rangeUnit?: string;
  impactZoneId: string;
  functioningHeight: number;
  functioningHeightUnit?: string;
  projectileWeight: number;
  projectileWeightUnit?: string;
  nominalSpeed: number;
  nominalSpeedUnit?: string;
  powderWeight: number;
  powderWeightUnit?: string;
  observations: string;
};
