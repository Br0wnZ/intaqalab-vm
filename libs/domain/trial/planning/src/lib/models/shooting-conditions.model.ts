import type { FireTrial } from '@intaqalab/models';

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
  targetInclination: number;
  orientation: number;
  elevation: number;
  angle: number;
  range: number;
  impactZoneId: string;
  functioningHeight: number;
  projectileWeight: number;
  nominalSpeed: number;
  powderWeight: number;
  observations: string;
};

export type UpdateConditionsRequest = {
  trialId: FireTrial['id'];
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
  orientation: number;
  targetInclination: number;
  elevation: number;
  angle: number;
  range: number;
  impactZoneId: string;
  functioningHeight: number;
  projectileWeight: number;
  nominalSpeed: number;
  powderWeight: number;
  observations: string;
};
