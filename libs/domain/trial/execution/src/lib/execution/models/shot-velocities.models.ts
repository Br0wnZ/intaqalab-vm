import type { CadenceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';

export interface ShotVelocityItem {
  radarDopplerId?: number | null;
  antennaId?: number | null;
  initialVelocity?: number | null;
  initialVelocityUnit?: SpeedUnitEnum;
  softwareUncertainty?: number | null;
  softwareUncertaintyUnit?: SpeedUnitEnum;
  cadence?: number | null;
  cadenceUnit?: CadenceUnitEnum;
  velocityLoss?: number | null;
  velocityLossUnit?: SpeedUnitEnum;
  observations?: string | null;
}

export type ShotVelocitiesRequest = ShotVelocityItem[];

export interface ShotVelocitiesResponse {
  velocities: ShotVelocityItem[];
}
