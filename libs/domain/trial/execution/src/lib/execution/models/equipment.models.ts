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

export interface EquipmentItemSelection {
  itemId: string;
  categoryId: EquipmentTypeEnum;
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
  seriesIds?: string[];
  shotIds?: string[];
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
