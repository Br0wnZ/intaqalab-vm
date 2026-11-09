import type { PiezoPosition } from './shot-piezo-pressures.models';

export type ExecutionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'CANCELED'
  // Legacy statuses still present in some mock/UI flows.
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

export interface ExecutionStateResponse {
  status: ExecutionStatus;
  activeSeriesId: string | null;
  activeShotId: string | null;
  // Backward compatibility with legacy payloads still sending this field.
  activeShootId?: string | null;
  updatedAt: string;
}

export interface ExecutionSeriesProgress {
  seriesId: string;
  shots: ExecutionShotProgress[];
}

export interface ExecutionShotProgress {
  shotId: string;
  status: 'PENDING' | 'ACTIVE' | 'FIRED';
  updatedAt: string;
}

export interface ExecutionProgressResponse {
  series: ExecutionSeriesProgress[];
}

export interface ShotMeasurementWeight {
  balanceId: number | null;
  weight: number | null;
  weightUnit: string | null;
}

export interface ShotMeasurementVelocity {
  radarDopplerId: number;
  antennaId: number;
  initialVelocity: number | null;
  initialVelocityUnit: string | null;
}

export interface ShotMeasurementPiezoPressure {
  position: PiezoPosition;
  piezoelectricSensorId?: number | null;
  amplifierId?: number | null;
  dataAcquisitionSystemId?: number | null;
  maxPressure?: number | null;
  maxPressureUnit?: string | null;
}

export interface ShotMeasurementShot {
  shotId: string;
  powderWeights: ShotMeasurementWeight[];
  projectileWeights: ShotMeasurementWeight[];
  velocities: ShotMeasurementVelocity[];
  piezoPressures: ShotMeasurementPiezoPressure[];
}

export interface ShotMeasurementSeries {
  seriesId: string;
  shots: ShotMeasurementShot[];
}

export interface ShotMeasurementsResponse {
  series: ShotMeasurementSeries[];
}

export type SecurityCountdownStatus = 'INACTIVE' | 'ACTIVE' | 'PAUSED';

export interface SecurityCountdownResponse {
  status: SecurityCountdownStatus;
  targetEndTime: string | null;
  remainingSeconds: number | null;
}

export type SecurityCountdownAction = 'START' | 'PAUSE' | 'RESUME' | 'UPDATE_DURATION';

export interface SecurityCountdownRequest {
  action: SecurityCountdownAction;
  durationSeconds?: number;
}

export interface TransitionWithReasonRequest {
  reason: string;
}

export interface ExecutionFinishResponse {
  finishedAt: string;
}
