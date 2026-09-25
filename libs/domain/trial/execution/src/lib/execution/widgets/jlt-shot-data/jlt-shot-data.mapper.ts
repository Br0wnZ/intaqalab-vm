import { DistanceUnitEnum } from '@intaqalab/models';

import type { JltShotDataState } from '../../../+state/execution.store';
import type { JltShotDataPayload, JltShotDataRequest, JltShotDataResponse } from '../../../services/execution.service';

export type InputFieldValue = { value: string; unit: string } | null;

export interface SelectOption {
  value: string;
  label: string;
}

export interface JltInheritedDefaults {
  jet: string | null;
  pieceOperator: string | null;
}

export interface SeriesShotItem {
  shotId: string;
  status?: string | null;
}

export interface ProgressSeriesItem {
  seriesId: string;
  shots: SeriesShotItem[];
}

export interface PlanningShotItem {
  id: string;
  globalNumber?: number | null;
}

export interface PlanningSeriesItem {
  id: string;
  name?: string | null;
  shots?: PlanningShotItem[];
}

/**
 * Convierte un número y una unidad a la estructura InputFieldValue de UI.
 */
export const numToField = (value: number | null | undefined, unit: string): InputFieldValue =>
  value !== null && value !== undefined ? { value: value.toString(), unit } : null;

/**
 * Parsea un InputFieldValue a número flotante o null si está vacío/inválido.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field?.value || field.value.trim() === '') return null;
  const parsed = parseFloat(field.value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Mapea el estado del disparo al estado legible del widget.
 */
export const mapShotStatusToEstadoDisparo = (
  shotStatus: 'ACTIVE' | 'PENDING' | 'FIRED' | string | null | undefined,
  fallback: JltShotDataState['estadoDisparo'] = 'EN_CURSO',
): JltShotDataState['estadoDisparo'] => {
  switch (shotStatus) {
    case 'ACTIVE':
      return 'EN_CURSO';
    case 'PENDING':
      return 'PENDIENTE';
    case 'FIRED':
      return 'EJECUTADA';
    default:
      return fallback;
  }
};

/**
 * Devuelve la etiqueta i18n/texto legible para el badge de estado.
 */
export const mapEstadoDisparoToLabel = (estado: string | null | undefined): string => {
  switch (estado) {
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
 * Devuelve las clases CSS correspondientes al badge de estado.
 */
export const mapEstadoDisparoToClass = (estado: string | null | undefined): string => {
  switch (estado) {
    case 'EN_CURSO':
      return 'bg-green-100 text-green-700';
    case 'PENDIENTE':
      return 'bg-blue-100 text-blue-700';
    case 'EJECUTADA':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

/**
 * Mapea series de planificación a opciones para el selector.
 */
export const mapPlanningSeriesToOptions = (
  planningSeries?: PlanningSeriesItem[] | null,
  fallback: SelectOption[] = [],
): SelectOption[] => {
  if (planningSeries?.length) {
    return planningSeries.map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    }));
  }
  return fallback;
};

/**
 * Mapea disparos de planificación o progreso a opciones para el selector.
 */
export const mapPlanningShotsToDisparoOptions = (
  planningSerie?: PlanningSeriesItem | null,
  progressSerie?: ProgressSeriesItem | null,
  fallback: SelectOption[] = [],
): SelectOption[] => {
  if (planningSerie?.shots?.length) {
    return planningSerie.shots.map((shot, index) => ({
      value: shot.id,
      label: `Disparo ${shot.globalNumber ?? index + 1}`,
    }));
  }

  if (progressSerie?.shots?.length) {
    return progressSerie.shots.map((shot, index) => ({
      value: shot.shotId,
      label: `Disparo ${index + 1}`,
    }));
  }

  return fallback;
};

/**
 * Localiza el ID del último disparo de la serie dada en el progreso de ejecución.
 */
export const findLastShotId = (
  progressSeries: ProgressSeriesItem[] | null | undefined,
  serieId: string,
): string | null => {
  const shots = progressSeries?.find((item) => item.seriesId === serieId)?.shots ?? [];
  return shots.length > 0 ? (shots[shots.length - 1]?.shotId ?? null) : null;
};

/**
 * Calcula el orden secuencial del disparo seleccionado.
 */
export const calculateShotOrder = (
  progressSeries: ProgressSeriesItem[] | null | undefined,
  serie: string | null,
  disparo: string | null,
): number | null => {
  if (!serie || !disparo || !progressSeries) {
    return null;
  }

  let shotOrder = 0;
  for (const series of progressSeries) {
    for (const shot of series.shots) {
      if (series.seriesId === serie && shot.shotId === disparo) {
        return shotOrder;
      }
      shotOrder += 1;
    }
  }

  return null;
};

/**
 * Comprueba si un disparo pertenece a la serie indicada.
 */
export const isShotInSerie = (
  disparo: string | null,
  serie: string | null,
  progressSeries?: ProgressSeriesItem[] | null,
  planningSeries?: PlanningSeriesItem[] | null,
): boolean => {
  if (!disparo || !serie) {
    return false;
  }

  return (
    progressSeries?.some(
      (series) => series.seriesId === serie && series.shots.some((shot) => shot.shotId === disparo),
    ) ??
    planningSeries?.some((series) => series.id === serie && series.shots?.some((shot) => shot.id === disparo)) ??
    false
  );
};

/**
 * Extrae y normaliza el payload JLT de una respuesta de API.
 */
export const extractJltData = (response: JltShotDataResponse | null | undefined): JltShotDataPayload => {
  if (!response) {
    return {
      jet: '',
      pieceOperator: '',
      attackDistance: null,
      attackDistanceUnit: DistanceUnitEnum.MM,
      recoilDistance: null,
      recoilDistanceUnit: DistanceUnitEnum.MM,
      observations: null,
    };
  }

  const data = 'jltData' in response ? response.jltData : response;
  return (
    data ?? {
      jet: '',
      pieceOperator: '',
      attackDistance: null,
      attackDistanceUnit: DistanceUnitEnum.MM,
      recoilDistance: null,
      recoilDistanceUnit: DistanceUnitEnum.MM,
      observations: null,
    }
  );
};

/**
 * Mapea la respuesta de API al estado parcial del widget/store.
 */
export const mapRemoteToJltShotState = (
  response: JltShotDataResponse | null | undefined,
  inheritedDefaults: JltInheritedDefaults,
  selection: {
    serie: string | null;
    disparo: string | null;
    estadoDisparo: JltShotDataState['estadoDisparo'];
  },
): Partial<JltShotDataState> => {
  const data = extractJltData(response);
  return {
    serie: selection.serie,
    disparo: selection.disparo,
    jet: data.jet || inheritedDefaults.jet || null,
    operadorPieza: data.pieceOperator || inheritedDefaults.pieceOperator || null,
    observaciones: data.observations ?? null,
    atacado: data.attackDistance ?? null,
    retroceso: data.recoilDistance ?? null,
    estadoDisparo: selection.estadoDisparo,
  };
};

/**
 * Mapea el estado del componente/store al payload de petición PUT.
 */
export const mapJltShotStateToRequest = (
  state: Pick<JltShotDataState, 'jet' | 'operadorPieza' | 'atacado' | 'retroceso' | 'observaciones'>,
): JltShotDataRequest => ({
  jet: state.jet ?? '',
  pieceOperator: state.operadorPieza ?? '',
  attackDistance: state.atacado,
  attackDistanceUnit: DistanceUnitEnum.MM,
  recoilDistance: state.retroceso,
  recoilDistanceUnit: DistanceUnitEnum.MM,
  observations: state.observaciones,
});
