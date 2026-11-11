import type { AngleUnitEnum, DistanceUnitEnum, SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';

/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/conditions`
 * (Swagger planning-api v1.3.0 → TrialConditionsResponse).
 *
 * Subconjunto consumido por widgets de ejecución (condiciones de blanco,
 * orientación, ángulo de tiro y velocidad nominal por disparo).
 */
export type PlanningConditionsUnits = {
  distance?: DistanceUnitEnum | null;
  targetInclination?: AngleUnitEnum | null;
  orientation?: AngleUnitEnum | null;
  shootingAngle?: AngleUnitEnum | null;
  elevation?: AngleUnitEnum | null;
  angle?: AngleUnitEnum | null;
  range?: DistanceUnitEnum | null;
  functioningHeight?: DistanceUnitEnum | null;
  nominalSpeed?: SpeedUnitEnum | null;
  powderWeight?: WeightUnitEnum | null;
  projectileWeight?: WeightUnitEnum | null;
};

export type PlanningConditionsShot = {
  shotId: string;
  targetTypeId?: string | null;
  targetMaterialId?: string | null;
  targetDimensionsId?: string | null;
  targetThicknessId?: string | null;
  distance?: number | null;
  targetInclination?: number | null;
  globalNumber?: number;
  date?: string | null;
  orientation?: number | null;
  orientationUnit?: AngleUnitEnum | null;
  shootingAngle?: number | null;
  shootingAngleUnit?: AngleUnitEnum | null;
  elevation?: number | null;
  angle?: number | null;
  angleUnit?: AngleUnitEnum | null;
  range?: number | null;
  functioningHeight?: number | null;
  nominalSpeed?: number | null;
  impactZoneId?: string | null;
  loadingZoneId?: string | null;
  powderWeight?: number | null;
  projectileWeight?: number | null;
  observations?: string | null;
  fuseWorkingModeId?: string | null;
  fuseMeasurement?: number | null;
  fuseGraduation?: number | null;
};

export type PlanningConditionsSeries = {
  seriesId: string;
  seriesName?: string;
  shots: PlanningConditionsShot[];
};

export type PlanningConditionsResponse = {
  units?: PlanningConditionsUnits;
  series: PlanningConditionsSeries[];
};
