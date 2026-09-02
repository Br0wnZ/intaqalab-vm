import { DistanceUnitEnum, TimeUnitEnum } from '@intaqalab/models';

import type {
  TrayectografiaFuncionamientosState,
  TrayectografiaIntroductionState,
  TrayectografiaTrayectoriaState,
  TrayectografiaTrazasState,
} from '../../../+state/execution-state.models';
import type {
  ShotTrajectography,
  ShotTrajectographyRequest,
  ShotTrajectographyResponse,
} from '../../models/shot-trajectography.models';

export type InputFieldValue = { value: string; unit: string } | null;

/**
 * Convierte un valor numérico y unidad a la estructura de InputSelect.
 */
export const numToField = (value: number | null | undefined, unit: string): InputFieldValue =>
  value !== null && value !== undefined ? { value: value.toString(), unit } : null;

/**
 * Parsea el valor string de un InputSelect a número o null.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field || !field.value || field.value.trim() === '') return null;
  const n = parseFloat(field.value);
  return isNaN(n) ? null : n;
};

/**
 * Mapea el estado del disparo al label legible del widget.
 */
export const mapShotStatusToLabel = (status: TrayectografiaIntroductionState['estadoDisparo']): string => {
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
 * Mapea el estado del disparo a la clase CSS correspondiente.
 */
export const mapShotStatusToClass = (status: TrayectografiaIntroductionState['estadoDisparo']): string => {
  switch (status) {
    case 'EN_CURSO':
      return 'bg-green-100 text-green-700';
    case 'PENDIENTE':
      return 'bg-amber-100 text-amber-700';
    case 'EJECUTADA':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

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
 * Mapea los disparos a opciones para el selector.
 */
export const mapShotsToDisparoOptions = (
  shots?: Array<{ shotId?: string; id?: string }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> => {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId ?? shot.id ?? `disparo-${index + 1}`,
      label: `Disparo ${index + 1}`,
    }));
  }
  return fallbackOptions;
};

/**
 * Mapea una unidad de distancia a enum DistanceUnitEnum para API.
 */
export const mapDistanceUnitToApi = (unit?: DistanceUnitEnum | string | null): DistanceUnitEnum | null => {
  if (!unit) return null;
  const u = unit.toUpperCase();
  if (u === 'M' || u === DistanceUnitEnum.M) return DistanceUnitEnum.M;
  if (u === 'KM' || u === DistanceUnitEnum.KM) return DistanceUnitEnum.KM;
  if (u === 'MM' || u === DistanceUnitEnum.MM) return DistanceUnitEnum.MM;
  if (u === 'UM' || u === 'ΜM' || u === DistanceUnitEnum.UM) return DistanceUnitEnum.UM;
  return DistanceUnitEnum.M;
};

/**
 * Mapea una unidad de distancia del enum API a representación UI.
 */
export const mapDistanceUnitToUi = (unit?: DistanceUnitEnum | string | null, fallback = 'm'): string => {
  if (!unit) return fallback;
  const u = unit.toUpperCase();
  if (u === 'KM') return 'km';
  if (u === 'MM') return 'mm';
  if (u === 'UM' || u === 'ΜM') return 'μm';
  if (u === 'M') return 'm';
  return unit;
};

/**
 * Mapea una unidad de tiempo a enum TimeUnitEnum para API.
 */
export const mapTimeUnitToApi = (unit?: TimeUnitEnum | string | null): TimeUnitEnum | null => {
  if (!unit) return null;
  const u = unit.toUpperCase();
  if (u === 'S' || u === TimeUnitEnum.S) return TimeUnitEnum.S;
  if (u === 'MS' || u === TimeUnitEnum.MS) return TimeUnitEnum.MS;
  return TimeUnitEnum.S;
};

/**
 * Mapea una unidad de tiempo del enum API a representación UI.
 */
export const mapTimeUnitToUi = (unit?: TimeUnitEnum | string | null, fallback = 's'): string => {
  if (!unit) return fallback;
  const u = unit.toUpperCase();
  if (u === 'MS') return 'ms';
  if (u === 'S') return 's';
  return unit;
};

/**
 * Extrae los datos de trayectografía de la respuesta.
 */
export const extractTrayectografiaData = (
  response: ShotTrajectographyResponse | null | undefined,
): ShotTrajectography | null => {
  return response?.trajectographyData ?? null;
};

/**
 * Mapea la respuesta del backend a la estructura de estado parcial del widget.
 */
export const mapRemoteToTrayectografiaState = (
  response: ShotTrajectographyResponse | null | undefined,
): {
  equipo?: string | null;
  trayectorias?: Partial<TrayectografiaTrayectoriaState>;
  funcionamientos?: Partial<TrayectografiaFuncionamientosState>;
  trazas?: Partial<TrayectografiaTrazasState>;
} => {
  const data = extractTrayectografiaData(response);
  if (!data) return {};

  const result: {
    equipo?: string | null;
    trayectorias?: Partial<TrayectografiaTrayectoriaState>;
    funcionamientos?: Partial<TrayectografiaFuncionamientosState>;
    trazas?: Partial<TrayectografiaTrazasState>;
  } = {};

  if (data.trajectographyRadarId !== undefined) {
    result.equipo = data.trajectographyRadarId ?? null;
  }

  if (data.trajectoryData) {
    const t = data.trajectoryData;
    result.trayectorias = {
      alcance: t.range ?? null,
      alcanceUnit: mapDistanceUnitToUi(t.rangeUnit, 'm'),
      deriva: t.drift ?? null,
      derivaUnit: mapDistanceUnitToUi(t.driftUnit, 'm'),
      tiempoVuelo: t.flightTime ?? null,
      tiempoVueloUnit: mapTimeUnitToUi(t.flightTimeUnit, 's'),
      tiempoFuncionamientoEspoleta: t.fuseFunctioningTime ?? null,
      tiempoFuncionamientoEspoletaUnit: mapTimeUnitToUi(t.fuseFunctioningTimeUnit, 's'),
      alturaFuncionamientoEspoleta: t.fuseFunctioningHeight ?? null,
      alturaFuncionamientoEspoletaUnit: mapDistanceUnitToUi(t.fuseFunctioningHeightUnit, 'm'),
      alcanceFuncionamientoEspoleta: t.fuseFunctioningRange ?? null,
      alcanceFuncionamientoEspoletaUnit: mapDistanceUnitToUi(t.fuseFunctioningRangeUnit, 'm'),
      flecha: t.arrow ?? null,
      flechaUnit: mapDistanceUnitToUi(t.arrowUnit, 'm'),
      calificacionVuelo: t.flightQualification ?? null,
      coeficienteAerodinamico: t.aerodynamicCoefficient ?? null,
      tiempoEyeccionBotesFumigenos: t.smokeCanisterEjectionTime ?? null,
      tiempoEyeccionBotesFumigenosUnit: mapTimeUnitToUi(t.smokeCanisterEjectionTimeUnit, 's'),
      observaciones: t.observations ?? null,
    };
  }

  if (data.functioningData) {
    const f = data.functioningData;
    result.funcionamientos = {
      funcionamientoEspoletasTrayectografia: f.fuseTrajectographyFunctioning ?? null,
      funcionamientoMunicionFumigenaRadar: f.smokeMunitionRadarFunctioning ?? null,
      funcionamientoMunicionIluminanteRadar: f.illuminatingMunitionRadarFunctioning ?? null,
      numeroBotesEyectados: f.ejectedCanisterCount ?? null,
      observaciones: f.observations ?? null,
    };
  }

  if (data.traceData) {
    const tr = data.traceData;
    result.trazas = {
      tiempoTraza: tr.traceTime ?? null,
      tiempoTrazaUnit: mapTimeUnitToUi(tr.traceTimeUnit, 's'),
      existenciaTrazaRadar: tr.radarTraceExistence ?? null,
      observaciones: tr.observations ?? null,
    };
  }

  return result;
};

/**
 * Convierte el estado actual del widget en una petición ShotTrajectographyRequest.
 */
export const mapTrayectografiaStateToRequest = (params: {
  equipo: string | null;
  trayectorias: TrayectografiaTrayectoriaState;
  funcionamientos: TrayectografiaFuncionamientosState;
  trazas: TrayectografiaTrazasState;
}): ShotTrajectographyRequest => {
  const { equipo, trayectorias, funcionamientos, trazas } = params;

  return {
    trajectographyRadarId: equipo,
    trajectoryData: {
      range: trayectorias.alcance,
      rangeUnit: mapDistanceUnitToApi(trayectorias.alcanceUnit),
      drift: trayectorias.deriva,
      driftUnit: mapDistanceUnitToApi(trayectorias.derivaUnit),
      flightTime: trayectorias.tiempoVuelo,
      flightTimeUnit: mapTimeUnitToApi(trayectorias.tiempoVueloUnit),
      fuseFunctioningTime: trayectorias.tiempoFuncionamientoEspoleta,
      fuseFunctioningTimeUnit: mapTimeUnitToApi(trayectorias.tiempoFuncionamientoEspoletaUnit),
      fuseFunctioningHeight: trayectorias.alturaFuncionamientoEspoleta,
      fuseFunctioningHeightUnit: mapDistanceUnitToApi(trayectorias.alturaFuncionamientoEspoletaUnit),
      fuseFunctioningRange: trayectorias.alcanceFuncionamientoEspoleta,
      fuseFunctioningRangeUnit: mapDistanceUnitToApi(trayectorias.alcanceFuncionamientoEspoletaUnit),
      arrow: trayectorias.flecha,
      arrowUnit: mapDistanceUnitToApi(trayectorias.flechaUnit),
      flightQualification: trayectorias.calificacionVuelo,
      aerodynamicCoefficient: trayectorias.coeficienteAerodinamico,
      smokeCanisterEjectionTime: trayectorias.tiempoEyeccionBotesFumigenos,
      smokeCanisterEjectionTimeUnit: mapTimeUnitToApi(trayectorias.tiempoEyeccionBotesFumigenosUnit),
      observations: trayectorias.observaciones,
    },
    functioningData: {
      fuseTrajectographyFunctioning: funcionamientos.funcionamientoEspoletasTrayectografia,
      smokeMunitionRadarFunctioning: funcionamientos.funcionamientoMunicionFumigenaRadar,
      illuminatingMunitionRadarFunctioning: funcionamientos.funcionamientoMunicionIluminanteRadar,
      ejectedCanisterCount: funcionamientos.numeroBotesEyectados,
      observations: funcionamientos.observaciones,
    },
    traceData: {
      traceTime: trazas.tiempoTraza,
      traceTimeUnit: mapTimeUnitToApi(trazas.tiempoTrazaUnit),
      radarTraceExistence: trazas.existenciaTrazaRadar,
      observations: trazas.observaciones,
    },
  };
};
