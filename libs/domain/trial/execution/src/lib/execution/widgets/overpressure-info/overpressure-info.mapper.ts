import type { OverpressureInfoState } from '../../../+state/execution-state.models';
import type {
  OverpressureFormModel,
  TrialOverpressureInfoRequest,
  TrialOverpressureInfoResponse,
} from '../../models/trial-overpressure-info.models';

export function mapRemoteToOverpressureState(response: TrialOverpressureInfoResponse): OverpressureInfoState {
  const data = response.overpressureInfo;
  return {
    presionMaxima: data.maximumPressure,
    presionMinima: data.minimumPressure,
    presionRef: data.referencePressure,
    unidadPresion: data.pressureUnit,
    presionSeguridad: data.safetyPressure,
  };
}

export function mapOverpressureFormToRequest(model: OverpressureFormModel): TrialOverpressureInfoRequest {
  const { presionMaxima, presionMinima, presionRef, unidadPresion } = model;
  if (
    presionMaxima === null ||
    presionMinima === null ||
    presionRef === null ||
    ![presionMaxima, presionMinima, presionRef].every((value) => Number.isFinite(value) && value >= 0) ||
    presionMinima > presionMaxima
  ) {
    throw new Error('Invalid overpressure configuration');
  }
  return {
    maximumPressure: presionMaxima,
    minimumPressure: presionMinima,
    referencePressure: presionRef,
    pressureUnit: unidadPresion,
  };
}
