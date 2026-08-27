import type { TemperatureUnitEnum, TimeUnitEnum, WeightUnitEnum } from '@intaqalab/models';

/**
 * Datos de identificación de un componente de munición para un disparo.
 */
export interface ShotMunitionIdentificationData {
  denominationId?: string | null;
  batch?: string | null;
  clientNumber?: string | null;
  fuseWorkingModeId?: string | null;
  fuseGraduation?: number | null;
  fuseGraduationUnit?: TimeUnitEnum | null;
  loadingZone?: string | null;
  modules?: number | null;
  observations?: string | null;
}

/**
 * Datos de peso de un componente de munición para un disparo (Request).
 */
export interface ShotMunitionWeightData {
  balanceId?: number | null;
  weight?: number | null;
  weightUnit?: WeightUnitEnum | null;
  weightAdded?: number | null;
  weightAddedUnit?: WeightUnitEnum | null;
  weightRemoved?: number | null;
  weightRemovedUnit?: WeightUnitEnum | null;
  weighingDateTime?: string | null;
  observations?: string | null;
}

/**
 * Datos de peso de un componente de munición para un disparo (Response).
 */
export interface ShotMunitionWeightDataResponse extends ShotMunitionWeightData {
  weighingRange?: string | null;
}

/**
 * Datos de acondicionamiento de un componente de munición para un disparo (Request).
 */
export interface ShotMunitionConditioningData {
  climaticChamberId?: number | null;
  chamberEntryDateTime?: string | null;
  chamberExitDateTime?: string | null;
  observations?: string | null;
}

/**
 * Datos de acondicionamiento de un componente de munición para un disparo (Response).
 */
export interface ShotMunitionConditioningDataResponse extends ShotMunitionConditioningData {
  temperature?: number | null;
  temperatureUnit?: TemperatureUnitEnum | null;
  programmedTemperature?: number | null;
  programmedTemperatureUnit?: TemperatureUnitEnum | null;
  chamberTime?: string | null;
}

/**
 * Solicitud de datos de un componente de munición individual.
 */
export interface ShotMunitionComponentRequest {
  componentId: string;
  identificationData?: ShotMunitionIdentificationData | null;
  weightData?: ShotMunitionWeightData | null;
  conditioningData?: ShotMunitionConditioningData | null;
}

/**
 * Respuesta de datos de un componente de munición individual.
 */
export interface ShotMunitionComponentResponse {
  componentId: string;
  identificationData?: ShotMunitionIdentificationData | null;
  weightData?: ShotMunitionWeightDataResponse | null;
  conditioningData?: ShotMunitionConditioningDataResponse | null;
}

/**
 * Request body para PUT /execution/munitions/series/{seriesId}/shots/{shotId} (Widget 20).
 */
export interface ShotMunitionRequest {
  components: ShotMunitionComponentRequest[];
}

/**
 * Response body para GET / PUT /execution/munitions/series/{seriesId}/shots/{shotId} (Widget 20).
 */
export interface ShotMunitionResponse {
  munitionData: ShotMunitionComponentResponse[];
}
