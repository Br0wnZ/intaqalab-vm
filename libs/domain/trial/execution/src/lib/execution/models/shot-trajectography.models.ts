import type { DistanceUnitEnum, TimeUnitEnum } from '@intaqalab/models';

export interface ShotTrajectographyTrajectoryData {
  range?: number | null;
  rangeUnit?: DistanceUnitEnum | null;
  drift?: number | null;
  driftUnit?: DistanceUnitEnum | null;
  flightTime?: number | null;
  flightTimeUnit?: TimeUnitEnum | null;
  fuseFunctioningTime?: number | null;
  fuseFunctioningTimeUnit?: TimeUnitEnum | null;
  fuseFunctioningHeight?: number | null;
  fuseFunctioningHeightUnit?: DistanceUnitEnum | null;
  fuseFunctioningRange?: number | null;
  fuseFunctioningRangeUnit?: DistanceUnitEnum | null;
  arrow?: number | null;
  arrowUnit?: DistanceUnitEnum | null;
  flightQualification?: string | null;
  aerodynamicCoefficient?: number | null;
  smokeCanisterEjectionTime?: number | null;
  smokeCanisterEjectionTimeUnit?: TimeUnitEnum | null;
  observations?: string | null;
}

export interface ShotTrajectographyFunctioningData {
  fuseTrajectographyFunctioning?: string | null;
  smokeMunitionRadarFunctioning?: string | null;
  illuminatingMunitionRadarFunctioning?: string | null;
  ejectedCanisterCount?: number | null;
  observations?: string | null;
}

export interface ShotTrajectographyTraceData {
  traceTime?: number | null;
  traceTimeUnit?: TimeUnitEnum | null;
  radarTraceExistence?: string | null;
  observations?: string | null;
}

export interface ShotTrajectography {
  trajectographyRadarId?: string | null;
  trajectoryData?: ShotTrajectographyTrajectoryData | null;
  functioningData?: ShotTrajectographyFunctioningData | null;
  traceData?: ShotTrajectographyTraceData | null;
}

export type ShotTrajectographyRequest = ShotTrajectography;

export interface ShotTrajectographyResponse {
  trajectographyData?: ShotTrajectography | null;
}
