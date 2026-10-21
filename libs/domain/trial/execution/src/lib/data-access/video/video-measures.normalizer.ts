import { EquipmentMagnitudeTagEnum } from '../../execution/models/equipment.models';
import { readArray, readRecord, readString } from '../shared/unknown-readers';

export interface VideoMagnitudeOption {
  readonly id: string;
  readonly value: string;
  readonly label: string;
}

/**
 * Checks whether a measure item is a High-Speed Video measure (Video AV / HIGH_SPEED_VIDEO).
 * Zero `any`, fully defensive.
 */
export function isHighSpeedVideoMeasure(measure: unknown): boolean {
  const rec = readRecord(measure);
  if (!rec) return false;

  const measurements = readArray(rec['measurements']).map((item) => readString(item) ?? '');
  if (
    measurements.includes(EquipmentMagnitudeTagEnum.VIDEO_AV) ||
    measurements.includes('HIGH_SPEED_VIDEO') ||
    measurements.includes('HIGH_SPEED_CAMERA')
  ) {
    return true;
  }

  const code = (readString(rec['magnitudeCode']) ?? readString(rec['code']) ?? '').toUpperCase();
  if (code.includes('HIGH_VELOCITY') || code.includes('HIGH_SPEED') || code === 'HIGH_SPEED_RECORD') {
    return true;
  }

  const name = (readString(rec['name']) ?? readString(rec['label']) ?? '').toLowerCase();
  if (
    name.includes('alta velocidad') ||
    name.includes('high speed') ||
    name.includes('vídeo av') ||
    name.includes('video av')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether a measure item is a Conventional Video measure (Video C / CONVENTIONAL_VIDEO).
 * Zero `any`, fully defensive.
 */
export function isConventionalVideoMeasure(measure: unknown): boolean {
  const rec = readRecord(measure);
  if (!rec) return false;

  const measurements = readArray(rec['measurements']).map((item) => readString(item) ?? '');
  if (
    measurements.includes(EquipmentMagnitudeTagEnum.VIDEO_C) ||
    measurements.includes('CONVENTIONAL_VIDEO') ||
    measurements.includes('CONVENTIONAL_CAMERA')
  ) {
    return true;
  }

  const code = (readString(rec['magnitudeCode']) ?? readString(rec['code']) ?? '').toUpperCase();
  if (code.includes('CONV') || code === 'CONVENTIONAL_RECORD') {
    return true;
  }

  const name = (readString(rec['name']) ?? readString(rec['label']) ?? '').toLowerCase();
  if (name.includes('convencional') || name.includes('vídeo c') || name.includes('video c')) {
    return true;
  }

  return false;
}

/**
 * Normalizes and extracts Video AV or Video C planned magnitudes from a GET measures response.
 *
 * Supports:
 * - Scoping by series (`seriesIds`) with fallback to trial-wide measures if none in selected series.
 * - Matching via measure properties (`magnitudeCode`, `name`) and catalog measurement tags.
 * - Returns dual-accessible options (`{ id, value, label }`) compatible with both `<mat-select>` shapes.
 */
export function resolvePlannedVideoMagnitudes(
  measuresResponse: unknown,
  videoType: 'AV' | 'C' | EquipmentMagnitudeTagEnum | string | null | undefined,
  seriesIds?: readonly string[] | null,
  catalog?: ReadonlyArray<{ readonly id: string; readonly measurements?: readonly string[] }>,
): VideoMagnitudeOption[] {
  if (!measuresResponse || !videoType) return [];

  const isAv =
    videoType === 'AV' || videoType === 'HIGH_SPEED_VIDEO' || videoType === EquipmentMagnitudeTagEnum.VIDEO_AV;

  const isC =
    videoType === 'C' || videoType === 'CONVENTIONAL_VIDEO' || videoType === EquipmentMagnitudeTagEnum.VIDEO_C;

  if (!isAv && !isC) return [];

  const catalogIdsForType = new Set<string>();
  if (catalog) {
    for (const catItem of catalog) {
      if (isAv && isHighSpeedVideoMeasure(catItem)) {
        catalogIdsForType.add(catItem.id);
      } else if (isC && isConventionalVideoMeasure(catItem)) {
        catalogIdsForType.add(catItem.id);
      }
    }
  }

  const matcher = (measure: unknown): boolean => {
    const rec = readRecord(measure);
    if (!rec) return false;
    const id = readString(rec['id']);
    if (id && catalogIdsForType.has(id)) {
      return true;
    }
    return isAv ? isHighSpeedVideoMeasure(measure) : isConventionalVideoMeasure(measure);
  };

  const responseRec = readRecord(measuresResponse);
  if (!responseRec) return [];

  const seriesArray = readArray(responseRec['series']);
  if (seriesArray.length === 0) return [];

  const extractFromSeries = (targetSeries: unknown[]): VideoMagnitudeOption[] => {
    const result: VideoMagnitudeOption[] = [];
    const seen = new Set<string>();

    for (const serieEntry of targetSeries) {
      const sRec = readRecord(serieEntry);
      if (!sRec) continue;
      const measuresRec = readRecord(sRec['measures']);
      if (!measuresRec) continue;

      for (const group of Object.values(measuresRec)) {
        for (const item of readArray(group)) {
          if (!matcher(item)) continue;
          const iRec = readRecord(item);
          if (!iRec) continue;
          const id = readString(iRec['id']);
          if (!id || seen.has(id)) continue;
          seen.add(id);

          const label = readString(iRec['name']) ?? readString(iRec['label']) ?? id;
          result.push({ id, value: id, label });
        }
      }
    }
    return result;
  };

  if (seriesIds && seriesIds.length > 0) {
    const filteredSeries = seriesArray.filter((entry) => {
      const sRec = readRecord(entry);
      const sId = sRec ? readString(sRec['seriesId']) : null;
      return sId !== null && seriesIds.includes(sId);
    });

    const seriesScoped = extractFromSeries(filteredSeries);
    if (seriesScoped.length > 0) {
      return seriesScoped;
    }
  }

  return extractFromSeries(seriesArray);
}

export interface QualitativeValueOption {
  readonly value: string;
  readonly label: string;
}

export interface ObservedResultControlConfig {
  readonly type: 'numeric' | 'select' | 'text';
  readonly isQuantitative: boolean;
  readonly isQualitative: boolean;
  readonly min: number | null;
  readonly max: number | null;
  readonly options: readonly QualitativeValueOption[];
  readonly unit: string | null;
}

function findPlannedMeasure(
  measuresResponse: unknown,
  selectedMeasureId: string,
  selectedSeriesId?: string | null,
): Record<string, unknown> | null {
  const respRec = readRecord(measuresResponse);
  if (!respRec) return null;

  const seriesArray = readArray(respRec['series']);
  let fallbackMatch: Record<string, unknown> | null = null;

  for (const serieEntry of seriesArray) {
    const sRec = readRecord(serieEntry);
    if (!sRec) continue;
    const sId = readString(sRec['seriesId']);
    const isTargetSeries = Boolean(selectedSeriesId && sId === selectedSeriesId);

    const measuresRec = readRecord(sRec['measures']);
    if (!measuresRec) continue;

    for (const group of Object.values(measuresRec)) {
      for (const item of readArray(group)) {
        const iRec = readRecord(item);
        if (!iRec) continue;
        const id = readString(iRec['id']);
        const code = readString(iRec['magnitudeCode']) ?? readString(iRec['code']);

        if (id === selectedMeasureId || (code && code === selectedMeasureId)) {
          if (isTargetSeries) {
            return iRec;
          }
          if (!fallbackMatch) {
            fallbackMatch = iRec;
          }
        }
      }
    }
  }

  return fallbackMatch;
}

function findCatalogMeasure(
  catalog: readonly unknown[] | null | undefined,
  selectedMeasureId: string,
  plannedMeasure: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!catalog || catalog.length === 0) return null;

  const plannedCode = plannedMeasure
    ? (readString(plannedMeasure['magnitudeCode']) ?? readString(plannedMeasure['code']))
    : null;

  let matchByCode: Record<string, unknown> | null = null;

  for (const item of catalog) {
    const cRec = readRecord(item);
    if (!cRec) continue;
    const cId = readString(cRec['id']);
    const cCode = readString(cRec['magnitudeCode']) ?? readString(cRec['code']);

    if (cId === selectedMeasureId) {
      return cRec;
    }
    if (!matchByCode && ((plannedCode && cCode === plannedCode) || cCode === selectedMeasureId)) {
      matchByCode = cRec;
    }
  }

  return matchByCode;
}

/**
 * Cruza la magnitud elegida de planificación con el catálogo maestro de medidas y registros.
 * Determina:
 * - 'numeric': si es cuantitativa (con min y max recuperados).
 * - 'select': si es cualitativa y tiene valores definidos.
 * - 'text': si no tiene valores o no se reconoce su qualificationType (mantiene input original).
 */
export function resolveObservedResultControlConfig(
  selectedMeasureId: string | null | undefined,
  measuresResponse: unknown,
  catalog: readonly unknown[] | null | undefined,
  selectedSeriesId?: string | null,
): ObservedResultControlConfig {
  const fallbackConfig: ObservedResultControlConfig = {
    type: 'text',
    isQuantitative: false,
    isQualitative: false,
    min: null,
    max: null,
    options: [],
    unit: null,
  };

  if (!selectedMeasureId) {
    return fallbackConfig;
  }

  const plannedMeasure = findPlannedMeasure(measuresResponse, selectedMeasureId, selectedSeriesId);
  const catalogItem = findCatalogMeasure(catalog, selectedMeasureId, plannedMeasure);

  const qualificationType =
    readString(catalogItem?.['qualificationType']) ?? readString(plannedMeasure?.['qualificationType']) ?? '';

  const hasPlannedLimits =
    (plannedMeasure?.['minLimit'] !== undefined && plannedMeasure?.['minLimit'] !== null) ||
    (plannedMeasure?.['maxLimit'] !== undefined && plannedMeasure?.['maxLimit'] !== null);

  const isQuantitative = qualificationType === 'QUANTITATIVE' || (!qualificationType && hasPlannedLimits);
  const isQualitative = qualificationType === 'QUALITATIVE';

  if (isQuantitative) {
    const rawMin = plannedMeasure?.['minLimit'] ?? catalogItem?.['minValue'] ?? null;
    const rawMax = plannedMeasure?.['maxLimit'] ?? catalogItem?.['maxValue'] ?? null;
    const min = typeof rawMin === 'number' && Number.isFinite(rawMin) ? rawMin : null;
    const max = typeof rawMax === 'number' && Number.isFinite(rawMax) ? rawMax : null;
    const unit = readString(plannedMeasure?.['unit']) ?? readString(catalogItem?.['measureUnit']) ?? null;

    return {
      type: 'numeric',
      isQuantitative: true,
      isQualitative: false,
      min,
      max,
      options: [],
      unit,
    };
  }

  if (isQualitative) {
    const rawValues = readArray(catalogItem?.['values'] ?? plannedMeasure?.['values']);
    const options: QualitativeValueOption[] = [];

    for (const val of rawValues) {
      const vRec = readRecord(val);
      if (!vRec) continue;
      if (vRec['active'] === false) continue;

      const code = readString(vRec['code']) ?? readString(vRec['value']) ?? readString(vRec['id']);
      if (!code) continue;

      let label = readString(vRec['label']);
      if (!label) {
        const nameObj = readRecord(vRec['name']);
        if (nameObj) {
          label = readString(nameObj['es']) ?? readString(nameObj['en']) ?? code;
        } else {
          label = readString(vRec['name']) ?? code;
        }
      }

      options.push({ value: code, label: label ?? code });
    }

    if (options.length > 0) {
      return {
        type: 'select',
        isQuantitative: false,
        isQualitative: true,
        min: null,
        max: null,
        options,
        unit: null,
      };
    }

    return {
      type: 'text',
      isQuantitative: false,
      isQualitative: true,
      min: null,
      max: null,
      options: [],
      unit: null,
    };
  }

  return fallbackConfig;
}
