export interface TrialOverpressureInfoRequest {
  maximumPressure: number;
  minimumPressure: number;
  referencePressure: number;
  pressureUnit: 'BAR' | 'MPA' | 'KG_CM2';
}

export interface TrialOverpressureInfoResponse {
  overpressureInfo: TrialOverpressureInfoRequest & {
    targetPressure: number;
    safetyPressure: number | null;
  };
  warnings: { code: 'TUBE_UNAVAILABLE' | 'SAFETY_PRESSURE_UNAVAILABLE'; message: string }[];
}
