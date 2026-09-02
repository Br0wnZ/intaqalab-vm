import type { AngleUnitEnum, DistanceUnitEnum, SpeedUnitEnum, TimeUnitEnum } from '@intaqalab/models';

export interface ShotJltMao {
  numericFiringTable?: string | null;
  lineOfFireOrientation?: number | null;
  stakeId?: string | null;
  theoreticalInitialVelocity?: number | null;
  theoreticalInitialVelocityUnit?: SpeedUnitEnum | null;
  plannedImpactDistance?: number | null;
  plannedImpactDistanceUnit?: DistanceUnitEnum | null;
  tabularDrift?: number | null;
  tabularDriftUnit?: AngleUnitEnum | null;
  theoreticalFlightTime?: number | null;
  theoreticalFlightTimeUnit?: TimeUnitEnum | null;
  angularDifference?: number | null;
  angularDifferenceUnit?: AngleUnitEnum | null;
  shootingAngle?: number | null;
  shootingAngleUnit?: AngleUnitEnum | null;
  fuseGraduation?: number | null;
  fuseGraduationUnit?: TimeUnitEnum | null;
  functioningHeight?: number | null;
  functioningHeightUnit?: DistanceUnitEnum | null;
  functioningDistance?: number | null;
  functioningDistanceUnit?: DistanceUnitEnum | null;
  observations?: string | null;
}

export type ShotJltMaoRequest = ShotJltMao;

export interface ShotJltMaoResponse {
  jltMaoData?: ShotJltMao | null;
}
