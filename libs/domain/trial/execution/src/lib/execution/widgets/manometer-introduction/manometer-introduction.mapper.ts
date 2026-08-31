import { DistanceUnitEnum } from '@intaqalab/models';

import type {
  ShotManometerPressures,
  ShotManometerPressuresRequest,
  ShotManometerPressuresResponse,
} from '../../models/shot-manometer-pressures.models';

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
  shots?: Array<{ shotId?: string; id?: string }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> => {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId ?? shot.id ?? `shot-${index + 1}`,
      label: `Disparo ${index + 1}`,
    }));
  }
  return fallbackOptions;
};

/**
 * Convierte unidad de distancia API a etiqueta de UI ('UM' -> 'μm', 'MM' -> 'mm').
 */
export const mapDistanceUnitToUi = (unit?: DistanceUnitEnum | string | null): string => {
  if (!unit) return 'μm';
  const u = String(unit).toUpperCase();
  if (u === 'MM') return 'mm';
  if (u === 'UM' || u === 'ΜM') return 'μm';
  return 'μm';
};

/**
 * Convierte etiqueta de UI a unidad de distancia API ('μm' -> 'UM', 'mm' -> 'MM').
 */
export const mapDistanceUnitToApi = (unit?: string | null): DistanceUnitEnum => {
  if (!unit) return DistanceUnitEnum.UM;
  const u = unit.trim().toLowerCase();
  if (u === 'mm') return DistanceUnitEnum.MM;
  return DistanceUnitEnum.UM;
};

/**
 * Convierte un número y unidad a la estructura de InputFieldValue.
 */
export const numToField = (value: number | null | undefined, unit = 'μm'): InputFieldValue => {
  if (value === null || value === undefined) return null;
  return { value: value.toString(), unit };
};

/**
 * Parsea el valor string de un InputFieldValue a número o null.
 */
export const parseNum = (field: InputFieldValue): number | null => {
  if (!field || (!field.value && field.value !== '0')) return null;
  const n = parseFloat(field.value.toString().replace(',', '.'));
  return isNaN(n) ? null : n;
};

/**
 * Extrae y normaliza ShotManometerPressures de la respuesta GET de la API.
 */
export const extractManometerPressuresData = (
  response: ShotManometerPressuresResponse | ShotManometerPressures | null | undefined,
): ShotManometerPressures | null => {
  if (!response) return null;
  if ('manometerPressuresData' in response && response.manometerPressuresData) {
    return response.manometerPressuresData;
  }
  return response as ShotManometerPressures;
};

/**
 * Mapea la respuesta remota a campos de estado del widget.
 */
export const mapRemoteToManometerState = (
  response: ShotManometerPressuresResponse | ShotManometerPressures | null | undefined,
): {
  manometro: string | null;
  crusher: string | null;
  micrometroPalpador: string | null;
  h1: number | null;
  h1Unit: string;
  h2: number | null;
  h2Unit: string;
  h3: number | null;
  h3Unit: string;
  h4: number | null;
  h4Unit: string;
  h5: number | null;
  h5Unit: string;
  observaciones: string | null;
} => {
  const data = extractManometerPressuresData(response);
  if (!data) {
    return {
      manometro: null,
      crusher: null,
      micrometroPalpador: null,
      h1: null,
      h1Unit: 'μm',
      h2: null,
      h2Unit: 'μm',
      h3: null,
      h3Unit: 'μm',
      h4: null,
      h4Unit: 'μm',
      h5: null,
      h5Unit: 'μm',
      observaciones: null,
    };
  }

  return {
    manometro: data.pressureGaugeId ?? null,
    crusher: data.crusherId ?? null,
    micrometroPalpador: data.probeId ?? null,
    h1: data.h1 ?? null,
    h1Unit: mapDistanceUnitToUi(data.h1Unit),
    h2: data.h2 ?? null,
    h2Unit: mapDistanceUnitToUi(data.h2Unit),
    h3: data.h3 ?? null,
    h3Unit: mapDistanceUnitToUi(data.h3Unit),
    h4: data.h4 ?? null,
    h4Unit: mapDistanceUnitToUi(data.h4Unit),
    h5: data.h5 ?? null,
    h5Unit: mapDistanceUnitToUi(data.h5Unit),
    observaciones: data.observations ?? null,
  };
};

/**
 * Construye el payload de ShotManometerPressuresRequest para el PUT a la API.
 */
export const buildShotManometerPressuresRequest = (params: {
  manometro: string | null;
  crusher: string | null;
  micrometroPalpador: string | null;
  h1Field: InputFieldValue;
  h2Field: InputFieldValue;
  h3Field: InputFieldValue;
  h4Field: InputFieldValue;
  h5Field: InputFieldValue;
  observaciones: string | null;
}): ShotManometerPressuresRequest => ({
  pressureGaugeId: params.manometro ?? null,
  crusherId: params.crusher ?? null,
  probeId: params.micrometroPalpador ?? null,
  h1: parseNum(params.h1Field),
  h1Unit: mapDistanceUnitToApi(params.h1Field?.unit),
  h2: parseNum(params.h2Field),
  h2Unit: mapDistanceUnitToApi(params.h2Field?.unit),
  h3: parseNum(params.h3Field),
  h3Unit: mapDistanceUnitToApi(params.h3Field?.unit),
  h4: parseNum(params.h4Field),
  h4Unit: mapDistanceUnitToApi(params.h4Field?.unit),
  h5: parseNum(params.h5Field),
  h5Unit: mapDistanceUnitToApi(params.h5Field?.unit),
  observations: params.observaciones ?? null,
});
