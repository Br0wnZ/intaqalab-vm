import { SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';

import type { InformacionTaradoSerie } from '../../../+state/execution-state.models';
import type {
  PropellantChargeParametersResponse,
  PropellantChargeParametersSeries,
} from '../../models/propelling-charge-parameters.models';

/**
 * Normaliza el peso de pólvora a gramos (g) para coincidir con la cabecera Wc/g de la UI.
 */
export function normalizePowderWeightToGrams(
  weight: number | null | undefined,
  unit: WeightUnitEnum | null | undefined,
): number | null {
  if (weight === null || weight === undefined) return null;

  if (unit === WeightUnitEnum.KG) {
    return Math.round(weight * 1000 * 100) / 100;
  }
  if (unit === WeightUnitEnum.G) {
    return weight;
  }
  // Si no se especifica unidad, por defecto en balística valores pequeños (< 50) son kg
  return weight < 50 ? Math.round(weight * 1000 * 100) / 100 : weight;
}

/**
 * Normaliza la velocidad a m/s (por defecto M_S en el Swagger de tarado).
 */
export function normalizeSpeedToMs(
  speed: number | null | undefined,
  unit: SpeedUnitEnum | null | undefined,
): number | null {
  if (speed === null || speed === undefined) return null;
  if (unit === SpeedUnitEnum.KM_H) {
    return Math.round((speed / 3.6) * 100) / 100;
  }
  return speed;
}

/**
 * Mapea una serie individual de la respuesta API al modelo de estado del widget Información Tarado.
 */
export function mapPropellantChargeSeriesItem(item: PropellantChargeParametersSeries): InformacionTaradoSerie {
  const numStr =
    item.seriesNumber !== null && item.seriesNumber !== undefined
      ? String(item.seriesNumber).startsWith('S')
        ? String(item.seriesNumber)
        : `S${item.seriesNumber}`
      : '—';

  return {
    numero: numStr,
    nombre: item.seriesName ?? null,
    zona: item.loadingZone ?? null,
    velocidadNominal: normalizeSpeedToMs(item.nominalSpeed, item.nominalSpeedUnit),
    desviacionVelocidadMax: normalizeSpeedToMs(item.maximumSpeedDeviation, item.maximumSpeedDeviationUnit),
    pesoPolvora: normalizePowderWeightToGrams(item.powderWeight, item.powderWeightUnit),
    seriesId: item.seriesId,
    observations: item.observations ?? null,
  };
}

/**
 * Mapea la respuesta del endpoint GET propelling-charge-parameters a la lista de series del widget.
 */
export function mapPropellantChargeParametersToSeries(
  response: PropellantChargeParametersResponse | null | undefined,
): InformacionTaradoSerie[] {
  if (!response?.series || !Array.isArray(response.series)) {
    return [];
  }
  return response.series.map(mapPropellantChargeSeriesItem);
}
