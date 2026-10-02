import { MeasureUnitEnum, TimeUnitEnum } from '@intaqalab/models';

import type {
  PiezoPosition,
  ShotDifferentialPressureData,
  ShotPiezoPressureItem,
  ShotPressuresRequest,
  ShotPressuresResponse,
  ShotTimesData,
} from '../../models';

/** Unidad de presión por defecto */
export const DEFAULT_PRESSURE_UNIT = MeasureUnitEnum.BAR;

/** Unidad de tiempo por defecto */
export const DEFAULT_TIME_UNIT = TimeUnitEnum.MS;

export const DEFAULT_PIEZO_POSITIONS: PiezoPosition[] = ['CLOSING', 'HALF', 'SHELL', 'OTHER'];

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
  shots?: Array<{ shotId: string; globalNumber?: number | null }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> => {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId,
      label: `Disparo ${shot.globalNumber ?? index + 1}`,
    }));
  }
  return fallbackOptions;
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
 * Normaliza la lista de presiones piezoeléctricas asegurando que existen las 4 posiciones.
 */
export const normalizePiezoPressures = (items?: ShotPiezoPressureItem[] | null): ShotPiezoPressureItem[] => {
  const result: ShotPiezoPressureItem[] = [];
  for (const pos of DEFAULT_PIEZO_POSITIONS) {
    const existing = items?.find((item) => item.position?.toUpperCase() === pos);
    if (existing) {
      result.push({
        position: pos,
        piezoelectricSensorId: existing.piezoelectricSensorId ?? null,
        amplifierId: existing.amplifierId ?? null,
        dataAcquisitionSystemId: existing.dataAcquisitionSystemId ?? null,
        maxPressure: existing.maxPressure ?? null,
        maxPressureUnit: existing.maxPressureUnit ?? DEFAULT_PRESSURE_UNIT,
        observations: existing.observations ?? null,
      });
    } else {
      result.push({
        position: pos,
        piezoelectricSensorId: null,
        amplifierId: null,
        dataAcquisitionSystemId: null,
        maxPressure: null,
        maxPressureUnit: DEFAULT_PRESSURE_UNIT,
        observations: null,
      });
    }
  }
  return result;
};

/**
 * Normaliza los datos de presión diferencial.
 */
export const normalizeDifferentialPressure = (
  data?: ShotDifferentialPressureData | null,
): ShotDifferentialPressureData => ({
  positiveDifferentialPressure: data?.positiveDifferentialPressure ?? null,
  positiveDifferentialPressureUnit: data?.positiveDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
  negativeDifferentialPressure: data?.negativeDifferentialPressure ?? null,
  negativeDifferentialPressureUnit: data?.negativeDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
  observations: data?.observations ?? null,
});

/**
 * Normaliza los datos de tiempos.
 */
export const normalizeTimesData = (data?: ShotTimesData | null): ShotTimesData => ({
  actionTime: data?.actionTime ?? null,
  actionTimeUnit: data?.actionTimeUnit ?? DEFAULT_TIME_UNIT,
  delayTime: data?.delayTime ?? null,
  delayTimeUnit: data?.delayTimeUnit ?? DEFAULT_TIME_UNIT,
  observations: data?.observations ?? null,
});

/**
 * Extrae y normaliza ShotPressuresResponse de la respuesta de la API.
 */
export const extractPressuresResponse = (
  response: ShotPressuresResponse | null | undefined,
): {
  piezoPressures: ShotPiezoPressureItem[];
  differentialPressureData: ShotDifferentialPressureData;
  timesData: ShotTimesData;
} => ({
  piezoPressures: normalizePiezoPressures(response?.piezoPressures),
  differentialPressureData: normalizeDifferentialPressure(response?.differentialPressureData),
  timesData: normalizeTimesData(response?.timesData),
});

/**
 * Construye el payload completo de ShotPressuresRequest para el PUT a la API.
 */
export const buildShotPressuresRequest = (params: {
  piezoPressures: ShotPiezoPressureItem[];
  differentialPressureData: ShotDifferentialPressureData;
  timesData: ShotTimesData;
}): ShotPressuresRequest => ({
  timesData: {
    actionTime: params.timesData.actionTime ?? null,
    actionTimeUnit: params.timesData.actionTimeUnit ?? DEFAULT_TIME_UNIT,
    delayTime: params.timesData.delayTime ?? null,
    delayTimeUnit: params.timesData.delayTimeUnit ?? DEFAULT_TIME_UNIT,
    observations: params.timesData.observations ?? null,
  },
  piezoPressures: params.piezoPressures.map((entry) => ({
    position: entry.position,
    piezoelectricSensorId: entry.piezoelectricSensorId ?? null,
    amplifierId: entry.amplifierId ?? null,
    dataAcquisitionSystemId: entry.dataAcquisitionSystemId ?? null,
    maxPressure: entry.maxPressure ?? null,
    maxPressureUnit: entry.maxPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    observations: entry.observations ?? null,
  })),
  differentialPressureData: {
    positiveDifferentialPressure: params.differentialPressureData.positiveDifferentialPressure ?? null,
    positiveDifferentialPressureUnit:
      params.differentialPressureData.positiveDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    negativeDifferentialPressure: params.differentialPressureData.negativeDifferentialPressure ?? null,
    negativeDifferentialPressureUnit:
      params.differentialPressureData.negativeDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    observations: params.differentialPressureData.observations ?? null,
  },
});

/**
 * Extrae y normaliza ShotPiezoPressureItem[] de la respuesta GET de la API (legacy helper).
 */
export const extractPressuresData = (
  response: ShotPressuresResponse | ShotPiezoPressureItem[] | null | undefined,
): ShotPiezoPressureItem[] => {
  if (!response) return [];
  if (Array.isArray(response)) {
    return normalizePiezoPressures(response);
  }
  if ('piezoPressures' in response && Array.isArray(response.piezoPressures)) {
    return normalizePiezoPressures(response.piezoPressures);
  }
  return normalizePiezoPressures([]);
};

/**
 * Helper legacy para construir ShotPiezoPressureItem.
 */
export const buildShotPressureData = (params: {
  position?: string;
  captador: string | null;
  amplificador: string | null;
  registrador: string | null;
  cierrePresion: number | null;
  cierreUnit?: string;
  intermedioPresion?: number | null;
  intermedioUnit?: string;
  culotePresion?: number | null;
  culoteUnit?: string;
  observations?: string | null;
}): ShotPiezoPressureItem => ({
  position: params.position ?? 'CLOSING',
  piezoelectricSensorId: equipmentStringToId(params.captador),
  amplifierId: equipmentStringToId(params.amplificador),
  dataAcquisitionSystemId: equipmentStringToId(params.registrador),
  maxPressure: params.cierrePresion,
  maxPressureUnit: params.cierreUnit ?? DEFAULT_PRESSURE_UNIT,
  observations: params.observations ?? null,
});
