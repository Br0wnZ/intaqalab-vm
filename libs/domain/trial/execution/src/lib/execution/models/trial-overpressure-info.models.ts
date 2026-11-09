import type { PressureUnitEnum } from '@intaqalab/models';

export interface TrialOverpressureInfoRequest {
  maximumPressure: number;
  minimumPressure: number;
  referencePressure: number;
  pressureUnit: PressureUnitEnum;
}

export interface TrialOverpressureWarning {
  code: 'TUBE_UNAVAILABLE' | 'SAFETY_PRESSURE_UNAVAILABLE';
  message: string;
}

export interface TrialOverpressureInfoResponse {
  overpressureInfo: TrialOverpressureInfoRequest & {
    safetyPressure: number | null;
    targetPressure: number;
  };
  warnings: TrialOverpressureWarning[];
}

export interface TrialOverpressureInfoParams {
  fireTrialId: string;
}

export interface TrialOverpressureInfoUpdateParams extends TrialOverpressureInfoParams {
  body: TrialOverpressureInfoRequest;
}

export interface OverpressureFormModel {
  presionMaxima: number | null;
  presionMinima: number | null;
  presionRef: number | null;
  unidadPresion: PressureUnitEnum;
}
