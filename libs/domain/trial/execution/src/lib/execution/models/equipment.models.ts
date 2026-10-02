import type { Role } from '@intaqalab/core';
import type { FireTrial, MagnitudeMeasureSource } from '@intaqalab/models';

export enum EquipmentTypeEnum {
  DOPPLER_RADAR = 'DOPPLER_RADAR',
  TRAJECTOGRAPHY_RADAR = 'TRAJECTOGRAPHY_RADAR',
  ANTENNA = 'ANTENNA',
  PIEZOELECTRIC_SENSOR = 'PIEZOELECTRIC_SENSOR',
  AMPLIFIER = 'AMPLIFIER',
  SOUND_LEVEL_METER = 'SOUND_LEVEL_METER',
  CONVENTIONAL_CAMERA = 'CONVENTIONAL_CAMERA',
  HIGH_SPEED_CAMERA = 'HIGH_SPEED_CAMERA',
  TRACE_RULER = 'TRACE_RULER',
  CHRONOMETER = 'CHRONOMETER',
  BALANCE = 'BALANCE',
  CLIMATIC_CHAMBER = 'CLIMATIC_CHAMBER',
  PRESSURE_GAUGE = 'PRESSURE_GAUGE',
  CRUSHER = 'CRUSHER',
  PROBE = 'PROBE',
  RECORDER = 'RECORDER',
  IPG_SENSOR = 'IPG_SENSOR',
  MICROMODULE = 'MICROMODULE',
  DATA_ACQUISITION_SYSTEM = 'DATA_ACQUISITION_SYSTEM',
  MUNITION = 'MUNITION',
}

/** Physical equipment item returned by /equipment/items (individual unit from Calibry). */
export interface EquipmentItemApiEntry {
  id: string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
}

export interface EquipmentItemsApiResponse {
  totalElements: number;
  items: EquipmentItemApiEntry[];
}

export enum EquipmentMeasurementGroupEnum {
  INITIAL_VELOCITY = 'INITIAL_VELOCITY',
  PIEZOELECTRIC_PRESSURE = 'PIEZOELECTRIC_PRESSURE',
  TRAJECTOGRAPHY = 'TRAJECTOGRAPHY',
  SOUND = 'SOUND',
  HIGH_SPEED_VIDEO = 'HIGH_SPEED_VIDEO',
  CONVENTIONAL_VIDEO = 'CONVENTIONAL_VIDEO',
  LENGTH = 'LENGTH',
  MANOMETER_PRESSURE = 'MANOMETER_PRESSURE',
  IPG_PRESSURE = 'IPG_PRESSURE',
  WEIGHT = 'WEIGHT',
  CONDITIONING = 'CONDITIONING',
  TIME = 'TIME',
}

export enum EquipmentMagnitudeTagEnum {
  VELOCIDAD_INICIAL = 'INITIAL_VELOCITY',
  PRESION_PIEZOELECTRICOS = 'PIEZOELECTRIC_PRESSURE',
  TRAYECTOGRAFIA = 'TRAJECTOGRAPHY',
  SONIDO = 'SOUND',
  VIDEO_AV = 'HIGH_SPEED_VIDEO',
  VIDEO_C = 'CONVENTIONAL_VIDEO',
  LONGITUD = 'LENGTH',
  PRESION_MANOMETROS = 'MANOMETER_PRESSURE',
  PRESION_IPG = 'IPG_PRESSURE',
  PESOS = 'WEIGHT',
  ACONDICIONAMIENTO = 'CONDITIONING',
  TIEMPO = 'TIME',
  DATA_ACQUISITION_SYSTEM = 'DATA_ACQUISITION_SYSTEM',
}

export const EQUIPMENT_MEASUREMENT_GROUPS: readonly EquipmentMeasurementGroupEnum[] =
  Object.values(EquipmentMeasurementGroupEnum);

export const EQUIPMENT_MAGNITUDE_TAGS: readonly (EquipmentMeasurementGroupEnum | EquipmentMagnitudeTagEnum)[] =
  EQUIPMENT_MEASUREMENT_GROUPS;

export function isEquipmentMeasurementGroupEnum(value: string): value is EquipmentMeasurementGroupEnum {
  return (EQUIPMENT_MEASUREMENT_GROUPS as readonly string[]).includes(value);
}

export function isEquipmentMagnitudeTagEnum(value: string): value is EquipmentMagnitudeTagEnum {
  return (EQUIPMENT_MEASUREMENT_GROUPS as readonly string[]).includes(value);
}

/** Magnitud seleccionada en Planificación: extiende el contrato de medida con sus grupos de medición asociados. */
export interface PlanningMagnitudeSelection extends MagnitudeMeasureSource {
  readonly measurements: readonly string[];
}

export enum EquipmentMagnitudeEnum {
  ATTACK = 'ATTACK',
  RECOIL = 'RECOIL',
}

export type EquipmentMeasureMagnitude = EquipmentMagnitudeEnum | 'ATTACK' | 'RECOIL';

export interface EquipmentItemSelection {
  itemId: string;
  categoryId: EquipmentTypeEnum;
  magnitude?: EquipmentMeasureMagnitude | null;
  channel?: number | null;
  series: string[];
  disparos: string[];
}

export interface EquipmentMagnitudeSelectionGroup {
  id: EquipmentMeasurementGroupEnum | EquipmentMagnitudeTagEnum | string;
  selections: EquipmentItemSelection[];
}

/**
 * Asignación de equipo de medida a series y disparos según contrato Swagger (`EquipmentSelectionItem`).
 */
export interface EquipmentSelectionItem {
  /** Identificador de la denominación de equipamiento (ver `/centers/{centerId}/equipment/denominations` en Planning). */
  equipmentItemId: number;
  /** Categoría del equipo de medición (clave de filtrado en Calibry). */
  categoryId: EquipmentTypeEnum;
  /** Magnitud de medida del equipo (ATTACK o RECOIL). */
  magnitude?: EquipmentMagnitudeEnum | EquipmentMeasureMagnitude | null;
  /** Canal del equipo de medida (1–32). */
  channel?: number | null;
  /** Series a las que está asignado este equipo. */
  seriesIds?: string[];
  /** Disparos a los que está asignado este equipo. */
  shotIds?: string[];
  /** @deprecated Usar `equipmentItemId` según contrato Swagger */
  equipmentDenominationId?: number;
  /** @deprecated Usar `shotIds` según contrato Swagger */
  shootIds?: string[];
}

/** @deprecated Usar `EquipmentSelectionItem` según contrato Swagger */
export type EquipmentSelectionApiItem = EquipmentSelectionItem;

/**
 * Grupo de medida con sus equipos asignados según contrato Swagger (`EquipmentMeasurementGroup`).
 */
export interface EquipmentMeasurementGroup {
  measurementGroup: EquipmentMeasurementGroupEnum | EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectionItem[];
}

/** @deprecated Usar `EquipmentMeasurementGroup` según contrato Swagger */
export type EquipmentMeasurementGroupApi = EquipmentMeasurementGroup;

/**
 * Lista de asignación de equipos según contrato Swagger (`EquipmentSelectionList`).
 */
export type EquipmentSelectionList = EquipmentMeasurementGroup[];

/** @deprecated Usar `EquipmentSelectionList` según contrato Swagger */
export type EquipmentSelectionApiList = EquipmentSelectionList;

export const API_EQUIPMENT_TYPES: readonly EquipmentTypeEnum[] = Object.values(EquipmentTypeEnum);

export function isEquipmentTypeEnum(value: EquipmentTypeEnum | string): value is EquipmentTypeEnum {
  return (API_EQUIPMENT_TYPES as readonly string[]).includes(value);
}

export const LEGACY_CATEGORY_TO_EQUIPMENT_TYPE: Record<string, EquipmentTypeEnum> = {
  'radar-dopler': EquipmentTypeEnum.DOPPLER_RADAR,
  antena: EquipmentTypeEnum.ANTENNA,
  'sensor-piezoelectrico': EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
  amplificador: EquipmentTypeEnum.AMPLIFIER,
  'radar-trayectografia': EquipmentTypeEnum.TRAJECTOGRAPHY_RADAR,
  'camara-av': EquipmentTypeEnum.HIGH_SPEED_CAMERA,
  'camara-c': EquipmentTypeEnum.CONVENTIONAL_CAMERA,
  'regla-trazos': EquipmentTypeEnum.TRACE_RULER,
  manometro: EquipmentTypeEnum.PRESSURE_GAUGE,
  crusher: EquipmentTypeEnum.CRUSHER,
  palpador: EquipmentTypeEnum.PROBE,
  'sensor-ipg': EquipmentTypeEnum.IPG_SENSOR,
  micromodulo: EquipmentTypeEnum.MICROMODULE,
  balanza: EquipmentTypeEnum.BALANCE,
  camara: EquipmentTypeEnum.CLIMATIC_CHAMBER,
  cronometro: EquipmentTypeEnum.CHRONOMETER,
  sonometro: EquipmentTypeEnum.SOUND_LEVEL_METER,
  grabador: EquipmentTypeEnum.RECORDER,
  municion: EquipmentTypeEnum.MUNITION,
  registrador: EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
};

// ── Equipment Selector Types ──────────────────────────────────────────────────

export type TagFieldConfig = {
  key: string;
  label: string;
  /** Maps to item.categoryId in data.items for options */
  sourceCategoryId: EquipmentTypeEnum | string | '';
  type: 'select' | 'number';
  maxValue?: number;
};

export type TagConfig = {
  id: string;
  label: string;
  allowedRoles: Role[];
  fields: TagFieldConfig[];
};

export type TagRow = {
  rowId: string;
  fieldValues: Record<string, string>;
  series: string[];
  disparos: string[];
};

export type TagTableState = {
  rows: TagRow[];
  nextId: number;
  pageIndex: number;
};

export type EquipmentSelectorDialogData = {
  fireTrialId: FireTrial['id'];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  serieDisparoMap?: Record<string, string[]>;
  /** @deprecated Items now loaded from /equipment/items API */
  categories?: Array<{ id: string; label: string; maxSelection: number }>;
  /** @deprecated Items now loaded from /equipment/items API */
  items?: Array<{ id: string; label: string; categoryId?: string; equipmentType?: EquipmentTypeEnum }>;
  /** @deprecated Loaded from /execution/equipment-selection API */
  initialEquipments?: EquipmentMagnitudeSelectionGroup[];
};

export type EquipmentSelectorDialogResult =
  { action: 'save'; equipments: EquipmentMagnitudeSelectionGroup[] } | { action: 'back' };
