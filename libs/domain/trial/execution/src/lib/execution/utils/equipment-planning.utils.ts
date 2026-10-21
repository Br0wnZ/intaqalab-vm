import type { Role } from '@intaqalab/core';
import { Role as RoleEnum } from '@intaqalab/core';
import { resolveMagnitudeDisplayConfig } from '@intaqalab/utils';

import type {
  EquipmentMagnitudeSelectionGroup,
  EquipmentMeasureMagnitude,
  EquipmentTypeEnum,
  PlanningMagnitudeSelection,
  TagConfig,
  TrialPlanningMeasuresResponse,
} from '../models';
import { EquipmentMagnitudeTagEnum, isEquipmentMagnitudeTagEnum, isEquipmentTypeEnum } from '../models';

export const ADMIN_ROLES: readonly Role[] = [RoleEnum.INTAQALAB_ADMIN, RoleEnum.INTAQALAB_PLANNING_ANALYSIS_HEAD];

export const MAGNITUDE_OPTIONS: ReadonlyArray<{ readonly id: EquipmentMeasureMagnitude; readonly label: string }> = [
  { id: 'ATTACK', label: 'Atacado' },
  { id: 'RECOIL', label: 'Retroceso' },
];

const LENGTH_MAGNITUDE_CODES: Readonly<Record<string, EquipmentMeasureMagnitude>> = {
  ARMAMENT_BLOCKED: 'ATTACK',
  ARMAMENT_RETREAT: 'RECOIL',
};

const LENGTH_MAGNITUDE_IDS: Readonly<Record<string, EquipmentMeasureMagnitude>> = {
  '213b71b3-f9bc-4254-bfb1-884385bd4843': 'ATTACK',
  'afd3b7d8-3c31-4c9f-b2dc-2e3640eaf5ad': 'RECOIL',
};

/**
 * Extrae todos los IDs de medidas planificadas en todas las series del ensayo.
 */
export function collectPlannedMeasureIds(response: TrialPlanningMeasuresResponse): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const series of response.series) {
    for (const group of Object.values(series.measures)) {
      for (const measure of group ?? []) {
        if (measure?.id) {
          ids.add(measure.id);
        }
      }
    }
  }
  return ids;
}

/**
 * Resuelve los tags de equipamiento necesarios según las medidas planificadas válidas.
 * Descarta borradores sin qualificationType reconocido.
 */
export function resolveNeededEquipmentTags(
  planningMeasures: readonly PlanningMagnitudeSelection[],
): EquipmentMagnitudeTagEnum[] {
  const neededTags = new Set<EquipmentMagnitudeTagEnum>();

  for (const measure of planningMeasures) {
    if (!resolveMagnitudeDisplayConfig(measure)) continue;

    for (const measurement of measure.measurements) {
      if (isEquipmentMagnitudeTagEnum(measurement)) {
        neededTags.add(measurement);
      }
    }
  }

  return [...neededTags];
}

/**
 * Cruza los IDs de medidas planificadas con el catálogo completo para resolver los tags de equipos requeridos.
 */
export function resolvePlannedEquipmentTags(
  plannedMeasureIds: ReadonlySet<string>,
  catalog: readonly PlanningMagnitudeSelection[],
): EquipmentMagnitudeTagEnum[] {
  return resolveNeededEquipmentTags(catalog.filter((measure) => plannedMeasureIds.has(measure.id)));
}

/**
 * Agrupa las series planificadas que tienen medidas asignadas a cada tag de equipamiento.
 */
export function resolvePlannedSeriesByTag(
  response: TrialPlanningMeasuresResponse,
  catalog: readonly PlanningMagnitudeSelection[],
): ReadonlyMap<string, ReadonlySet<string>> {
  const seriesByTag = new Map<string, Set<string>>();

  for (const series of response.series) {
    const ids = collectPlannedMeasureIds({ series: [series] });
    for (const tagId of resolvePlannedEquipmentTags(ids, catalog)) {
      const seriesIds = seriesByTag.get(tagId) ?? new Set<string>();
      seriesIds.add(series.seriesId);
      seriesByTag.set(tagId, seriesIds);
    }
  }

  return seriesByTag;
}

/**
 * Filtra la lista de configuraciones de tags según los roles del usuario autenticado.
 * Administradores y Jefes de Planificación y Análisis ven todos los tags.
 */
export function resolveVisibleEquipmentTags(userRoles: readonly Role[], allTags: readonly TagConfig[]): TagConfig[] {
  const isAdmin = userRoles.some((role) => ADMIN_ROLES.includes(role));
  if (isAdmin) {
    return [...allTags];
  }
  return allTags.filter((tag) => tag.allowedRoles.some((role) => userRoles.includes(role)));
}

/**
 * Extrae las categorías de equipo de Calibry requeridas para renderizar los selectores de los tags indicados.
 */
export function resolveRequiredEquipmentCategories(tags: readonly TagConfig[]): EquipmentTypeEnum[] {
  const seen = new Set<EquipmentTypeEnum>();
  for (const tag of tags) {
    for (const field of tag.fields) {
      if (field.type === 'select' && isEquipmentTypeEnum(field.sourceCategoryId as string)) {
        seen.add(field.sourceCategoryId as EquipmentTypeEnum);
      }
    }
  }
  return [...seen];
}

/**
 * Resuelve las opciones de magnitud para Longitud según las medidas planificadas.
 */
export function resolvePlannedLengthMagnitudes(
  plannedMeasures: readonly PlanningMagnitudeSelection[],
): Array<{ readonly id: EquipmentMeasureMagnitude; readonly label: string }> {
  const plannedCodes = new Set(
    plannedMeasures
      .filter((measure) => measure.measurements.includes(EquipmentMagnitudeTagEnum.LONGITUD))
      .map((measure) => LENGTH_MAGNITUDE_CODES[measure.magnitudeCode] ?? LENGTH_MAGNITUDE_IDS[measure.id]),
  );
  return MAGNITUDE_OPTIONS.filter((option) => plannedCodes.has(option.id));
}

export {
  isConventionalVideoMeasure,
  isHighSpeedVideoMeasure,
  resolvePlannedVideoMagnitudes,
  type VideoMagnitudeOption,
} from '../../data-access/video/video-measures.normalizer';
