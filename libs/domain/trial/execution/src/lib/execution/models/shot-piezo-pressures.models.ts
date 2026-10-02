export type PiezoPosition = 'CLOSING' | 'HALF' | 'SHELL' | 'OTHER';

export const PiezoPositionEnum = {
  CLOSING: 'CLOSING',
  HALF: 'HALF',
  SHELL: 'SHELL',
  OTHER: 'OTHER',
} as const;

export interface ShotPiezoPressureItem {
  position: PiezoPosition | string;
  piezoelectricSensorId?: number | null;
  amplifierId?: number | null;
  dataAcquisitionSystemId?: number | null;
  maxPressure?: number | null;
  maxPressureUnit?: string;
  observations?: string | null;
}

export interface ShotDifferentialPressureData {
  positiveDifferentialPressure?: number | null;
  positiveDifferentialPressureUnit?: string;
  negativeDifferentialPressure?: number | null;
  negativeDifferentialPressureUnit?: string;
  observations?: string | null;
}

export interface ShotTimesData {
  actionTime?: number | null;
  actionTimeUnit?: string;
  delayTime?: number | null;
  delayTimeUnit?: string;
  observations?: string | null;
}

export interface ShotPressuresResponse {
  timesData?: ShotTimesData;
  piezoPressures: ShotPiezoPressureItem[];
  differentialPressureData?: ShotDifferentialPressureData;
}

export type ShotPressuresRequest = ShotPressuresResponse;
