import type { AngleUnitEnum, DistanceUnitEnum } from '@intaqalab/models';

export interface ShotMaoTopography {
  pieceX?: number | null;
  pieceXUnit?: DistanceUnitEnum | null;
  pieceY?: number | null;
  pieceYUnit?: DistanceUnitEnum | null;
  pieceZ?: number | null;
  pieceZUnit?: DistanceUnitEnum | null;
  targetX?: number | null;
  targetXUnit?: DistanceUnitEnum | null;
  targetY?: number | null;
  targetYUnit?: DistanceUnitEnum | null;
  targetZ?: number | null;
  targetZUnit?: DistanceUnitEnum | null;
  olt?: number | null;
  oltUnit?: AngleUnitEnum | null;
  angularDifference?: number | null;
  angularDifferenceUnit?: AngleUnitEnum | null;
  observations?: string | null;
}

export type ShotMaoTopographyRequest = ShotMaoTopography;

export interface MaoTopographyBulkConfigurationRequest extends ShotMaoTopography {
  assignedShotIds: string[];
}

export interface MaoTopographyBulkConfigurationResponse {
  updatedShotIds: string[];
}

export interface ShotMaoTopographyResponse {
  maoTopographyData?: ShotMaoTopography | null;
}
