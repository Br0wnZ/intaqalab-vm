import type { Role } from '@intaqalab/core';
import { Role as RoleEnum } from '@intaqalab/core';

import type {
  EquipmentItemSelection,
  EquipmentMagnitudeSelectionGroup,
  EquipmentMeasureMagnitude,
  EquipmentMeasurementGroupApi,
} from '../models';
import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum, isEquipmentTypeEnum } from '../models';
import type { TagConfig, TagFieldConfig, TagRow, TagTableState } from '../models';

// ── Public Types ───────────────────────────────────────────────────────────────

export const SELECT_ALL_SERIES_VALUE = '__ALL_SERIES__';

export const MAGNITUDE_OPTIONS: Array<{ id: EquipmentMeasureMagnitude; label: string }> = [
  { id: 'ATTACK', label: 'Atacado' },
  { id: 'RECOIL', label: 'Retroceso' },
];

export type EquipmentItemSelectionEntry = EquipmentItemSelection;

// ── Role Groups ────────────────────────────────────────────────────────────────

export const ADMIN_ROLES: Role[] = [
  RoleEnum.INTAQALAB_ADMIN,
  RoleEnum.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  RoleEnum.HEAD_ARMAMENT_TRIALS,
];

export const BALLISTICS_ROLES: Role[] = [
  RoleEnum.INTAQALAB_BALLISTICS_UNIT_HEAD,
  RoleEnum.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
];

export const ARMAMENT_ROLES: Role[] = [
  RoleEnum.INTAQALAB_ARMAMENT_UNIT_HEAD,
  RoleEnum.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
];

export const MUNITIONS_ROLES: Role[] = [
  RoleEnum.INTAQALAB_MUNITIONS_UNIT_HEAD,
  RoleEnum.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
];

export const TOPOGRAPHY_ROLES: Role[] = [
  RoleEnum.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
  RoleEnum.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,
];

// ── Canonical Tag Definitions ─────────────────────────────────────────────────

export const TAG_CONFIGS: TagConfig[] = [
  {
    id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
    label: 'Velocidad Inicial',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'radar_doppler',
        label: 'Radar Doppler',
        sourceCategoryId: EquipmentTypeEnum.DOPPLER_RADAR,
        type: 'select',
      },
      { key: 'antena', label: 'Antena', sourceCategoryId: EquipmentTypeEnum.ANTENNA, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS,
    label: 'Presión Sensores Piezoeléctricos',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'sensor_piezoelectrico',
        label: 'Sensor piezoeléctrico',
        sourceCategoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
        type: 'select',
      },
      { key: 'amplificador', label: 'Amplificador', sourceCategoryId: EquipmentTypeEnum.AMPLIFIER, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA,
    label: 'Trayectografía',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'radar_trayectografia',
        label: 'Radar Trayectografía',
        sourceCategoryId: EquipmentTypeEnum.TRAJECTOGRAPHY_RADAR,
        type: 'select',
      },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.SONIDO,
    label: 'Sonido',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'sonometro',
        label: 'Sonómetro',
        sourceCategoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
        type: 'select',
      },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.VIDEO_AV,
    label: 'Vídeo AV',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'camara_av',
        label: 'Cámara AV',
        sourceCategoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
        type: 'select',
      },
      { key: 'grabador', label: 'Grabador', sourceCategoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA, type: 'select' },
      { key: 'canal', label: 'Canal (01 al 32)', sourceCategoryId: '', type: 'number', maxValue: 32 },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.VIDEO_C,
    label: 'Vídeo C',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'camara_c',
        label: 'Cámara C',
        sourceCategoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
        type: 'select',
      },
      {
        key: 'grabador',
        label: 'Grabador',
        sourceCategoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
        type: 'select',
      },
      { key: 'canal', label: 'Canal (01 al 32)', sourceCategoryId: '', type: 'number', maxValue: 32 },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.LONGITUD,
    label: 'Longitud',
    allowedRoles: [...ADMIN_ROLES, ...ARMAMENT_ROLES],
    fields: [
      {
        key: 'regla_trazos',
        label: 'Regla de Trazos',
        sourceCategoryId: EquipmentTypeEnum.TRACE_RULER,
        type: 'select',
      },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_MANOMETROS,
    label: 'Presión Manómetros',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'manometro', label: 'Manómetro', sourceCategoryId: EquipmentTypeEnum.PRESSURE_GAUGE, type: 'select' },
      { key: 'crusher', label: 'Crusher', sourceCategoryId: EquipmentTypeEnum.CRUSHER, type: 'select' },
      { key: 'palpador', label: 'Palpador', sourceCategoryId: EquipmentTypeEnum.PROBE, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_IPG,
    label: 'Presión IPG',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'sensor_ipg', label: 'Sensor IPG', sourceCategoryId: EquipmentTypeEnum.IPG_SENSOR, type: 'select' },
      { key: 'micromodulo', label: 'Micromódulo', sourceCategoryId: EquipmentTypeEnum.MICROMDULE, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PESOS,
    label: 'Pesos',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'balanza', label: 'Balanza', sourceCategoryId: EquipmentTypeEnum.BALANCE, type: 'select' },
      { key: 'municion', label: 'Munición', sourceCategoryId: 'municion', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.ACONDICIONAMIENTO,
    label: 'Acondicionamiento',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'camara', label: 'Cámara', sourceCategoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER, type: 'select' },
      { key: 'municion', label: 'Munición', sourceCategoryId: 'municion', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.TIEMPO,
    label: 'Tiempo',
    allowedRoles: [...ADMIN_ROLES, ...TOPOGRAPHY_ROLES],
    fields: [
      { key: 'cronometro', label: 'Cronómetro', sourceCategoryId: EquipmentTypeEnum.CHRONOMETER, type: 'select' },
    ],
  },
];

export const EMPTY_ROW = (): TagRow => ({ rowId: 'row-0', fieldValues: {}, series: [], disparos: [] });
export const INIT_STATE = (): TagTableState => ({ rows: [EMPTY_ROW()], nextId: 1, pageIndex: 0 });

// ── Mappers ───────────────────────────────────────────────────────────────────

/**
 * Mapea los datos provenientes del backend a la estructura local de EquipmentMagnitudeSelectionGroup.
 */
export function apiToDialogFormat(apiGroups: EquipmentMeasurementGroupApi[]): EquipmentMagnitudeSelectionGroup[] {
  return apiGroups.map((apiGroup) => ({
    id: apiGroup.measurementGroup,
    selections: apiGroup.selections.map((sel) => ({
      itemId: String(sel.equipmentDenominationId),
      categoryId: sel.categoryId,
      magnitude: sel.magnitude ?? null,
      channel: sel.channel ?? null,
      series: sel.seriesIds ?? [],
      disparos: sel.shotIds ?? sel.shootIds ?? [],
    })),
  }));
}

/**
 * Hidrata el estado de las tablas del diálogo a partir de la selección inicial.
 */
export function hydrateFromInitialEquipments(
  initialEquipments: EquipmentMagnitudeSelectionGroup[],
): Record<string, TagTableState> {
  const states: Record<string, TagTableState> = {};

  for (const group of initialEquipments) {
    const tag = TAG_CONFIGS.find((t) => t.id === group.id);
    if (!tag) continue;

    // Group selections by (series + disparos) to create one row per unique combination
    const rowMap = new Map<string, { fieldValues: Record<string, string>; series: string[]; disparos: string[] }>();

    for (const selection of group.selections) {
      // Find the field that matches this selection's categoryId
      const field = tag.fields.find(
        (f) => f.type === 'select' && f.sourceCategoryId && f.sourceCategoryId === selection.categoryId,
      );

      if (!field) continue;

      // Create a key based on (series + disparos) for grouping
      const rowKey = `${(selection.series ?? []).sort().join('|')}:${(selection.disparos ?? []).sort().join('|')}:${selection.magnitude ?? ''}:${selection.channel ?? ''}`;

      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, {
          fieldValues: {},
          series: selection.series ?? [],
          disparos: selection.disparos ?? [],
        });
      }

      const rowData = rowMap.get(rowKey);
      if (!rowData) continue;
      rowData.fieldValues[field.key] = selection.itemId;
      if (selection.magnitude) {
        rowData.fieldValues['magnitud'] = selection.magnitude;
      }
      if (selection.channel !== null && selection.channel !== undefined) {
        rowData.fieldValues['canal'] = String(selection.channel);
      }
    }

    // Convert map to rows array
    const rows: TagRow[] = Array.from(rowMap.entries()).map((entry, index) => {
      const [, data] = entry;
      return {
        rowId: `row-${index}`,
        fieldValues: data.fieldValues,
        series: data.series,
        disparos: data.disparos,
      };
    });

    states[group.id] = {
      rows: rows.length ? rows : [EMPTY_ROW()],
      nextId: rows.length || 1,
      pageIndex: 0,
    };
  }

  return states;
}

/**
 * Mapea el estado actual de las tablas al formato esperado para guardar.
 */
export function dialogStatesToApiFormat(tagStates: Record<string, TagTableState>): EquipmentMagnitudeSelectionGroup[] {
  const equipments: EquipmentMagnitudeSelectionGroup[] = [];

  for (const [tagId, state] of Object.entries(tagStates)) {
    const tag = TAG_CONFIGS.find((t) => t.id === tagId);
    if (!tag) continue;

    const selections: EquipmentItemSelectionEntry[] = [];

    for (const row of state.rows) {
      for (const field of tag.fields) {
        if (field.type !== 'select' || !field.sourceCategoryId) continue;

        const itemId = row.fieldValues[field.key];
        if (!itemId) continue;

        const sourceCategoryId = field.sourceCategoryId;
        if (!isEquipmentTypeEnum(sourceCategoryId)) continue;

        selections.push({
          itemId,
          categoryId: sourceCategoryId,
          magnitude: (row.fieldValues['magnitud'] as EquipmentMeasureMagnitude | undefined) ?? null,
          channel: row.fieldValues['canal'] ? Number(row.fieldValues['canal']) : null,
          series: row.series,
          disparos: row.disparos,
        });
      }
    }

    if (selections.length) {
      equipments.push({ id: tagId, selections });
    }
  }

  return equipments;
}
