import type { DistanceUnitEnum } from '@intaqalab/models';

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
  observations?: string | null;
}

export type ShotMaoTopographyRequest = ShotMaoTopography;

export interface ShotMaoTopographyResponse {
  maoTopographyData?: ShotMaoTopography | null;
}
