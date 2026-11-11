import type { AngleUnitEnum, DistanceUnitEnum } from '@intaqalab/models';

export type PlanningTargetConditionsData = {
  targetTypeId: string;
  targetTypeLabel: string;
  targetMaterialId: string | null;
  targetMaterialLabel: string | null;
  targetDimensionsId: string | null;
  targetDimensionsLabel: string | null;
  targetThicknessId: string | null;
  targetThicknessName: string | null;
  distance: number | null;
  distanceUnit: DistanceUnitEnum | null;
  targetInclination: number | null;
  targetInclinationUnit: AngleUnitEnum | null;
};

export type PlanningTargetConditionsShot = {
  shotId: string;
  targetConditionsData: PlanningTargetConditionsData;
};

export type PlanningTargetConditionsSeries = {
  seriesId: string;
  sameForAllShots: boolean;
  shots: PlanningTargetConditionsShot[];
};

export type PlanningTargetConditionsResponse = {
  sameForAllSeries: boolean;
  series: PlanningTargetConditionsSeries[];
};
