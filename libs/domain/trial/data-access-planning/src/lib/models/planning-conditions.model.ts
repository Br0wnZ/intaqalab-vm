import type { AngleUnitEnum, DistanceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';

/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/conditions`
 * (Swagger planning-api v1.3.0 → TrialConditionsResponse).
 *
 * Subconjunto consumido por los widgets de ejecución (orientación, ángulo de tiro
 * y velocidad nominal por disparo).
 */
export type PlanningConditionsUnits = {
  orientation?: AngleUnitEnum | null;
  shootingAngle?: AngleUnitEnum | null;
  angle?: AngleUnitEnum | null;
  range?: DistanceUnitEnum | null;
  functioningHeight?: DistanceUnitEnum | null;
  nominalSpeed?: SpeedUnitEnum | null;
};

export type PlanningConditionsShot = {
  shotId: string;
  targetTypeId?: string | null;
  orientation?: number | null;
  orientationUnit?: AngleUnitEnum | null;
  shootingAngle?: number | null;
  shootingAngleUnit?: AngleUnitEnum | null;
  angle?: number | null;
  angleUnit?: AngleUnitEnum | null;
  range?: number | null;
  functioningHeight?: number | null;
  nominalSpeed?: number | null;
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
