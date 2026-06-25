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
}

export enum EquipmentMagnitudeTagEnum {
  VELOCIDAD_INICIAL = 'velocidad-inicial',
  PRESION_PIEZOELECTRICOS = 'presion-piezoelectricos',
  TRAYECTOGRAFIA = 'trayectografia',
  SONIDO = 'sonido',
  VIDEO_AV = 'video-av',
  VIDEO_C = 'video-c',
  LONGITUD = 'longitud',
  PRESION_MANOMETROS = 'presion-manometros',
  PRESION_IPG = 'presion-ipg',
  PESOS = 'pesos',
  ACONDICIONAMIENTO = 'acondicionamiento',
  TIEMPO = 'tiempo',
}

export interface EquipmentItemSelection {
  itemId: string;
  categoryId: string;
  series: string[];
  disparos: string[];
}

export interface EquipmentMagnitudeSelectionGroup {
  id: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentItemSelection[];
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
