import { TimeUnitEnum } from '@intaqalab/models';

import type { TopographyIntroductionState } from '../../../+state/execution.store';
import type {
  ShotTopography,
  ShotTopographyRequest,
  ShotTopographyResponse,
} from '../../models/shot-topography.models';

export interface SelectOption {
  value: string;
  label: string;
}

export type InputFieldValue = { value: string; unit: string } | null;

/**
 * Convierte un número y una unidad a la estructura InputFieldValue de UI.
 */
export const numToField = (num: number | null | undefined, unit = 's'): InputFieldValue => {
  if (num === null || num === undefined) return null;
  return { value: num.toString(), unit };
};

/**
 * Parsea un InputFieldValue a número flotante o null si está vacío/inválido.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field?.value || field.value.trim() === '') return null;
  const parsed = Number(field.value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Mapea una unidad de tiempo de string o enum al enum de la API (TimeUnitEnum).
 */
export const mapTimeUnitToApi = (unit?: TimeUnitEnum | string | null): TimeUnitEnum | null => {
  if (!unit) return null;
  const u = unit.toUpperCase();
  if (u === 'S' || u === TimeUnitEnum.S) return TimeUnitEnum.S;
  if (u === 'MS' || u === TimeUnitEnum.MS) return TimeUnitEnum.MS;
  return TimeUnitEnum.S;
};

/**
 * Mapea una unidad de tiempo de API a representación UI.
 */
export const mapTimeUnitToUi = (unit?: TimeUnitEnum | string | null, fallback = 's'): string => {
  if (!unit) return fallback;
  const u = unit.toUpperCase();
  if (u === 'MS') return 'ms';
  if (u === 'S') return 's';
  return unit;
};

/**
 * Obtiene la etiqueta para el estado del disparo.
 */
export const mapShotStatusToLabel = (status?: string | null): string => {
  switch (status) {
    case 'EN_CURSO':
      return 'En curso';
    case 'PENDIENTE':
      return 'Pendiente';
    case 'EJECUTADA':
      return 'Ejecutada';
    default:
      return '—';
  }
};

/**
 * Obtiene las clases CSS de estilo para el badge del estado del disparo.
 */
export const mapShotStatusToClass = (status?: string | null): string => {
  switch (status) {
    case 'EN_CURSO':
      return 'bg-green-100 text-green-700';
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-700';
    case 'EJECUTADA':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

/**
 * Mapea series de planificación a opciones de selector.
 */
export const mapPlanningSeriesToOptions = (
  series: { id: string; name?: string }[] | null | undefined,
  fallback: SelectOption[] = [],
): SelectOption[] => {
  if (!series || series.length === 0) return fallback;
  return series.map((s, idx) => ({
    value: s.id,
    label: s.name && s.name.trim() !== '' ? s.name : `Serie ${idx + 1}`,
  }));
};

/**
 * Mapea disparos a opciones de selector.
 */
export const mapShotsToDisparoOptions = (
  shots: { shotId?: string; id?: string }[] | null | undefined,
  fallback: SelectOption[] = [],
): SelectOption[] => {
  if (!shots || shots.length === 0) return fallback;
  return shots.map((s, idx) => ({
    value: s.shotId ?? s.id ?? '',
    label: `Disparo ${idx + 1}`,
  }));
};

/**
 * Extrae los datos de topografía de la respuesta.
 */
export const extractTopographyData = (response: ShotTopographyResponse | null | undefined): ShotTopography | null => {
  return response?.topographyData ?? null;
};

/**
 * Mapea la respuesta remota al estado del store/componente.
 */
export const mapRemoteToTopographyState = (
  response: ShotTopographyResponse | null | undefined,
): Partial<TopographyIntroductionState> => {
  const data = extractTopographyData(response);
  if (!data) return {};

  const state: Partial<TopographyIntroductionState> = {};

  if (data.chronometerId !== undefined) {
    state.equipo = data.chronometerId ?? null;
  }
  if (data.flightTime !== undefined) {
    state.tiempoVuelo = data.flightTime ?? null;
    state.tiempoVueloUnit = mapTimeUnitToUi(data.flightTimeUnit, 's');
  }
  if (data.illuminationTime !== undefined) {
    state.tiempoIluminacion = data.illuminationTime ?? null;
    state.tiempoIluminacionUnit = mapTimeUnitToUi(data.illuminationTimeUnit, 's');
  }
  if (data.smokeTrailCount !== undefined) {
    state.numeroEstelaHumo = data.smokeTrailCount ?? null;
  }
  if (data.observations !== undefined) {
    state.observaciones = data.observations ?? null;
  }

  return state;
};

/**
 * Mapea el estado del componente/store al payload de petición PUT.
 */
export const mapTopographyStateToRequest = (state: Partial<TopographyIntroductionState>): ShotTopographyRequest => {
  return {
    chronometerId: state.equipo ?? null,
    flightTime: state.tiempoVuelo ?? null,
    flightTimeUnit: mapTimeUnitToApi(state.tiempoVueloUnit),
    illuminationTime: state.tiempoIluminacion ?? null,
    illuminationTimeUnit: mapTimeUnitToApi(state.tiempoIluminacionUnit),
    smokeTrailCount: state.numeroEstelaHumo ?? null,
    observations: state.observaciones ?? null,
  };
};
