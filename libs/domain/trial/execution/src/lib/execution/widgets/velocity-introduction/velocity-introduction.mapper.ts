import { CadenceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';

import type { VelocityIntroductionState } from '../../../+state/execution-state.models';
import type {
  ShotVelocitiesRequest,
  ShotVelocitiesResponse,
  ShotVelocityItem,
} from '../../../services/execution.service';

export type InputFieldValue = { value: string; unit: string } | null;

/** Separador interno para el valor compuesto Radar / Antena */
const RADAR_ANTENA_SEPARATOR = '|';

/**
 * Construye el valor compuesto "radarId|antennaId" para el selector único.
 * Devuelve null si alguno de los IDs es nulo.
 */
export const buildRadarAntenaCombinedValue = (radarId: string | null, antennaId: string | null): string | null => {
  if (!radarId || !antennaId) return null;
  return `${radarId}${RADAR_ANTENA_SEPARATOR}${antennaId}`;
};

/**
 * Descompone el valor compuesto "radarId|antennaId" en sus partes.
 * Devuelve { radarId: null, antennaId: null } si el valor es nulo o inválido.
 */
export const splitRadarAntenaCombinedValue = (
  value: string | null,
): { radarId: string | null; antennaId: string | null } => {
  if (!value) return { radarId: null, antennaId: null };
  const idx = value.indexOf(RADAR_ANTENA_SEPARATOR);
  if (idx === -1) return { radarId: null, antennaId: null };
  return {
    radarId: value.slice(0, idx) || null,
    antennaId: value.slice(idx + 1) || null,
  };
};

/**
 * Convierte un valor numérico y unidad a la estructura de InputSelect.
 */
export const numToField = (value: number | null, unit: string): InputFieldValue =>
  value !== null ? { value: value.toString(), unit } : null;

/**
 * Parsea el valor string de un InputSelect a número o null.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field) return null;
  const n = parseFloat(field.value);
  return isNaN(n) ? null : n;
};

/**
 * Mapea el estado de ejecución de un disparo al estado legible del widget.
 */
export const mapShotStatusToEstadoDisparo = (
  shotStatus: 'ACTIVE' | 'PENDING' | 'FIRED' | string | null | undefined,
  fallbackEstado: VelocityIntroductionState['estadoDisparo'] = 'EN_CURSO',
): VelocityIntroductionState['estadoDisparo'] => {
  switch (shotStatus) {
    case 'ACTIVE':
      return 'EN_CURSO';
    case 'PENDING':
      return 'PENDIENTE';
    case 'FIRED':
      return 'EJECUTADA';
    default:
      return fallbackEstado;
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
 * Mapea la respuesta del backend a la estructura parcial de VelocityIntroductionState.
 */
export const mapRemoteToVelocityState = (
  response: ShotVelocitiesResponse,
  serie: string | null,
  disparo: string | null,
  estadoDisparo: VelocityIntroductionState['estadoDisparo'],
  currentDataForm?: { radarDoppler: string | null; antena: string | null },
): Partial<VelocityIntroductionState> => {
  const velocityItem: ShotVelocityItem | undefined = response.velocities?.[0];

  const radarDoppler =
    velocityItem?.radarDopplerId !== undefined && velocityItem?.radarDopplerId !== null
      ? String(velocityItem.radarDopplerId)
      : (currentDataForm?.radarDoppler ?? null);

  const antena =
    velocityItem?.antennaId !== undefined && velocityItem?.antennaId !== null
      ? String(velocityItem.antennaId)
      : (currentDataForm?.antena ?? null);

  const velocidad = velocityItem?.initialVelocity ?? null;
  const velocidadUnit = velocityItem?.initialVelocityUnit ?? SpeedUnitEnum.M_S;
  const softwareUncertainty = velocityItem?.softwareUncertainty ?? null;
  const softwareUncertaintyUnit = velocityItem?.softwareUncertaintyUnit ?? SpeedUnitEnum.M_S;
  const perdida = velocityItem?.velocityLoss ?? null;
  const perdidaUnit = velocityItem?.velocityLossUnit ?? SpeedUnitEnum.M_S;
  const cadencia = velocityItem?.cadence ?? null;
  const cadenciaUnit = velocityItem?.cadenceUnit ?? CadenceUnitEnum.SPM;
  const observaciones = velocityItem?.observations ?? null;

  return {
    serie,
    disparo,
    radarDoppler,
    antena,
    velocidad,
    velocidadUnit,
    incertidumbreSoftware: softwareUncertainty,
    incertidumbreSoftwareUnit: softwareUncertaintyUnit,
    perdida,
    perdidaUnit,
    cadencia,
    cadenciaUnit,
    observaciones,
    estadoDisparo,
  };
};

/**
 * Mapea los datos del formulario local al payload requerido por la API backend.
 */
export const mapVelocityFormToRequest = (params: {
  radarAntena: string | null;
  initialVelocity: number | null;
  initialVelocityUnit?: SpeedUnitEnum;
  softwareUncertainty?: number | null;
  softwareUncertaintyUnit?: SpeedUnitEnum;
  velocityLoss: number | null;
  velocityLossUnit?: SpeedUnitEnum;
  cadence: number | null;
  cadenceUnit?: CadenceUnitEnum;
  observations: string | null;
}): ShotVelocitiesRequest => {
  const { radarId, antennaId } = splitRadarAntenaCombinedValue(params.radarAntena);
  return [
    {
      radarDopplerId: radarId ? Number(radarId) || null : null,
      antennaId: antennaId ? Number(antennaId) || null : null,
      initialVelocity: params.initialVelocity,
      initialVelocityUnit: params.initialVelocityUnit ?? SpeedUnitEnum.M_S,
      softwareUncertainty: params.softwareUncertainty ?? null,
      softwareUncertaintyUnit: params.softwareUncertaintyUnit ?? SpeedUnitEnum.M_S,
      velocityLoss: params.velocityLoss,
      velocityLossUnit: params.velocityLossUnit ?? SpeedUnitEnum.M_S,
      cadence: params.cadence,
      cadenceUnit: params.cadenceUnit ?? CadenceUnitEnum.SPM,
      observations: params.observations,
    },
  ];
};

/**
 * Realiza una copia profunda de un objeto para resetear estados sin mutaciones.
 */
export const deepClone = <T>(data: T): T => structuredClone(data);
