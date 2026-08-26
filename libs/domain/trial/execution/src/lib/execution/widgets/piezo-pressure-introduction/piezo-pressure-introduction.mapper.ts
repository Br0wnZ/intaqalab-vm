import { MEASURE_UNIT_LABELS, MeasureUnitEnum, PressureUnitEnum } from '@intaqalab/models';

import type {
  ShotPressuresData,
  ShotPressuresRequest,
  ShotPressuresResponse,
} from '../../../services/execution.service';

/** Unidad de presión por defecto */
export const DEFAULT_PRESSURE_UNIT = MeasureUnitEnum.BAR;

export type InputFieldValue = { value: string; unit: string } | null;

/**
 * Mapea las series de planificación a opciones para el selector.
 */
export const mapPlanningSeriesToOptions = (
  planningSeries?: Array<{ id: string; name?: string | null }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> => {
  if (planningSeries?.length) {
    return planningSeries.map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    }));
  }
  return fallbackOptions;
};

/**
 * Mapea los disparos de una serie a opciones para el selector.
 */
export const mapShotsToDisparoOptions = (
  shots?: Array<{ shotId: string }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> => {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId,
      label: `Disparo ${index + 1}`,
    }));
  }
  return fallbackOptions;
};

/**
 * Extrae y normaliza ShotPressuresData de la respuesta GET de la API.
 */
export const extractPressuresData = (
  response: ShotPressuresResponse | ShotPressuresData | null | undefined,
): ShotPressuresData | null => {
  if (!response) return null;
  if ('pressuresData' in response && response.pressuresData) {
    return response.pressuresData;
  }
  return response as ShotPressuresData;
};

/**
 * Convierte un número y unidad a la estructura de InputSelect.
 */
export const numToField = (value: number | null | undefined, unit: string = DEFAULT_PRESSURE_UNIT): InputFieldValue => {
  if (value === null || value === undefined) return null;
  return { value: value.toString(), unit };
};

/**
 * Parsea el valor string de un InputSelect a número o null.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field || (!field.value && field.value !== '0')) return null;
  const n = parseFloat(field.value.toString().replace(',', '.'));
  return isNaN(n) ? null : n;
};

/**
 * Convierte un ID numérico o nulo de equipo a string para el mat-select.
 */
export const equipmentIdToString = (id: number | null | undefined): string | null => {
  if (id === null || id === undefined) return null;
  return String(id);
};

/**
 * Convierte un string de selector de equipo a número o null.
 */
export const equipmentStringToId = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Construye el payload de ShotPressuresRequest para el PUT a la API.
 */
export const buildShotPressuresRequest = (params: {
  captador: string | null;
  amplificador: string | null;
  registrador: string | null;
  cierrePresion: number | null;
  cierreUnit?: string;
  intermedioPresion: number | null;
  intermedioUnit?: string;
  culotePresion: number | null;
  culoteUnit?: string;
  observations?: string | null;
}): ShotPressuresRequest => ({
  piezoelectricSensorId: equipmentStringToId(params.captador),
  amplifierId: equipmentStringToId(params.amplificador),
  dataAcquisitionSystemId: equipmentStringToId(params.registrador),
  closingMaxPressure: params.cierrePresion,
  closingMaxPressureUnit: params.cierreUnit ?? DEFAULT_PRESSURE_UNIT,
  halfMaxPressure: params.intermedioPresion,
  halfMaxPressureUnit: params.intermedioUnit ?? DEFAULT_PRESSURE_UNIT,
  shellMaxPressure: params.culotePresion,
  shellMaxPressureUnit: params.culoteUnit ?? DEFAULT_PRESSURE_UNIT,
  observations: params.observations ?? null,
});
