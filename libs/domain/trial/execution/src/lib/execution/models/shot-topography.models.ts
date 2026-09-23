import type { TimeUnitEnum } from '@intaqalab/models';

export interface ShotTopography {
  chronometerId?: string | null;
  flightTime?: number | null;
  flightTimeUnit?: TimeUnitEnum | null;
  illuminationTime?: number | null;
  illuminationTimeUnit?: TimeUnitEnum | null;
  smokeTrailCount?: number | null;
  observations?: string | null;
}

export interface ShotTopographyRequest extends Omit<ShotTopography, 'chronometerId'> {
  chronometerId?: number | null;
}

export interface ShotTopographyResponse {
  topographyData?: ShotTopography | null;
}
