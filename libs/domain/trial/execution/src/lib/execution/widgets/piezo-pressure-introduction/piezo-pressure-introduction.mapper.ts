import { MeasureUnitEnum } from '@intaqalab/models';

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
  response: ShotPressuresResponse | ShotPressuresData[] | null | undefined,
): ShotPressuresData[] => {
  if (!response) return [];
  if (Array.isArray(response)) {
    return response;
  }
  if ('pressuresData' in response) {
    return response.pressuresData;
  }
  return [];
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
export const buildShotPressureData = (params: {
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
}): ShotPressuresData => ({
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

/** Construye el payload completo del PUT, conservando una entrada por captador. */
export const buildShotPressuresRequest = (entries: ShotPressuresData[]): ShotPressuresRequest =>
  entries.map((entry) => ({
    piezoelectricSensorId: entry.piezoelectricSensorId ?? null,
    amplifierId: entry.amplifierId ?? null,
    dataAcquisitionSystemId: entry.dataAcquisitionSystemId ?? null,
    closingMaxPressure: entry.closingMaxPressure ?? null,
    closingMaxPressureUnit: entry.closingMaxPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    halfMaxPressure: entry.halfMaxPressure ?? null,
    halfMaxPressureUnit: entry.halfMaxPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    shellMaxPressure: entry.shellMaxPressure ?? null,
    shellMaxPressureUnit: entry.shellMaxPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    observations: entry.observations ?? null,
  }));
