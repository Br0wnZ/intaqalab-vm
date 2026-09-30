import type { AngleUnitEnum, DistanceUnitEnum } from '@intaqalab/models';

export interface ShotCameraOrientation {
  plannedImpactDistance: number | null;
  plannedImpactDistanceUnit: DistanceUnitEnum | null;
  functioningHeight: number | null;
  functioningHeightUnit: DistanceUnitEnum | null;
  functioningDistance: number | null;
  functioningDistanceUnit: DistanceUnitEnum | null;
  cameraAngularDifference: number | null;
  cameraAngularDifferenceUnit: AngleUnitEnum | null;
}

export interface ShotCameraOrientationResponse {
  cameraOrientationData: ShotCameraOrientation;
}
