import type { FireTrial } from '@intaqalab/models';

export type ShootingConditionsUnits = {
  distance: number | null;
  orientation: number | null;
  targetInclination: number | null;
  elevation: number | null;
  angle: number | null;
  range: number | null;
  functioningHeight: number | null;
  nominalSpeed: number | null;
  powderWeight: number | null;
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
  targetInclination: number;
  orientation: number;
  elevation: number;
  angle: number;
  range: number;
  impactZoneId: string;
  functioningHeight: number;
  projectWeight: number;
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
  projectWeight: number;
  nominalSpeed: number;
  powderWeight: number;
  observations: string;
};
