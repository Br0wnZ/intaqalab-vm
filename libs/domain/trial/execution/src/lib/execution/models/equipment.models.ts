import type { Role } from '@intaqalab/core';
import type { FireTrial } from '@intaqalab/models';

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
  IPG_SENSOR = 'IPG_SENSOR',
  MICROMDULE = 'MICROMDULE',
  RECORDER = 'RECORDER',
  DATA_ACQUISITION_SYSTEM = 'DATA_ACQUISITION_SYSTEM',
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
}

export type EquipmentMeasureMagnitude = 'ATTACK' | 'RECOIL';

export interface EquipmentItemSelection {
  itemId: string;
  categoryId: EquipmentTypeEnum;
  magnitude?: EquipmentMeasureMagnitude | null;
  channel?: number | null;
  series: string[];
  disparos: string[];
}

export interface EquipmentMagnitudeSelectionGroup {
  id: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentItemSelection[];
}

export interface EquipmentSelectionApiItem {
  equipmentDenominationId: number;
  categoryId: EquipmentTypeEnum;
  magnitude?: EquipmentMeasureMagnitude | null;
  channel?: number | null;
  seriesIds?: string[];
  shotIds?: string[];
  shootIds?: string[];
}

export interface EquipmentMeasurementGroupApi {
  measurementGroup: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectionApiItem[];
}

export type EquipmentSelectionApiList = EquipmentMeasurementGroupApi[];

export const API_EQUIPMENT_TYPES: readonly EquipmentTypeEnum[] = [
  EquipmentTypeEnum.DOPPLER_RADAR,
  EquipmentTypeEnum.TRAJECTOGRAPHY_RADAR,
  EquipmentTypeEnum.ANTENNA,
  EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
  EquipmentTypeEnum.AMPLIFIER,
  EquipmentTypeEnum.SOUND_LEVEL_METER,
  EquipmentTypeEnum.CONVENTIONAL_CAMERA,
  EquipmentTypeEnum.HIGH_SPEED_CAMERA,
  EquipmentTypeEnum.TRACE_RULER,
  EquipmentTypeEnum.CHRONOMETER,
  EquipmentTypeEnum.BALANCE,
  EquipmentTypeEnum.CLIMATIC_CHAMBER,
  EquipmentTypeEnum.PRESSURE_GAUGE,
  EquipmentTypeEnum.CRUSHER,
  EquipmentTypeEnum.PROBE,
];

export function isEquipmentTypeEnum(value: EquipmentTypeEnum | string): value is EquipmentTypeEnum {
  return API_EQUIPMENT_TYPES.includes(value as EquipmentTypeEnum);
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
  micromodulo: EquipmentTypeEnum.MICROMDULE,
  balanza: EquipmentTypeEnum.BALANCE,
  camara: EquipmentTypeEnum.CLIMATIC_CHAMBER,
  cronometro: EquipmentTypeEnum.CHRONOMETER,
  sonometro: EquipmentTypeEnum.SOUND_LEVEL_METER,
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
  | { action: 'save'; equipments: EquipmentMagnitudeSelectionGroup[] }
  | { action: 'back' };

