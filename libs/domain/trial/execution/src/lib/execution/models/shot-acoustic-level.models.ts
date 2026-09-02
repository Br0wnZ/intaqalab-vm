import type { AcousticLevelUnitEnum, DistanceUnitEnum } from '@intaqalab/models';

export interface ShotAcousticLevel {
  soundLevelMeterId?: string | null;
  soundLevelMeterX?: number | null;
  soundLevelMeterXUnit?: DistanceUnitEnum | null;
  soundLevelMeterY?: number | null;
  soundLevelMeterYUnit?: DistanceUnitEnum | null;
  soundLevelMeterZ?: number | null;
  soundLevelMeterZUnit?: DistanceUnitEnum | null;
  soundLevelMeterMuzzleDistance?: number | null;
  soundLevelMeterMuzzleDistanceUnit?: DistanceUnitEnum | null;
  acousticLevel?: number | null;
  acousticLevelUnit?: AcousticLevelUnitEnum | null;
  observations?: string | null;
}

export type ShotAcousticLevelRequest = ShotAcousticLevel;

export interface ShotAcousticLevelResponse {
  acousticLevelData?: ShotAcousticLevel | null;
}
