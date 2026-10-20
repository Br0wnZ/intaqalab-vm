import type { AngleUnitEnum, SpeedUnitEnum } from '@intaqalab/models';

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
  nominalSpeed?: SpeedUnitEnum | null;
};

export type PlanningConditionsShot = {
  shotId: string;
  orientation?: number | null;
  orientationUnit?: AngleUnitEnum | null;
  shootingAngle?: number | null;
  shootingAngleUnit?: AngleUnitEnum | null;
  nominalSpeed?: number | null;
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
