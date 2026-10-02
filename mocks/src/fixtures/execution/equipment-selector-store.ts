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
  MICROMODULE = 'MICROMODULE',
}

export interface EquipmentSelectionApiItem {
  equipmentItemId: number;
  equipmentDenominationId?: number;
  categoryId: EquipmentTypeEnum;
  magnitude?: 'ATTACK' | 'RECOIL' | null;
  channel?: number | null;
  seriesIds?: string[];
  shotIds?: string[];
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
}

export interface EquipmentMeasurementGroupApi {
  measurementGroup: EquipmentMeasurementGroupEnum | EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectionApiItem[];
}

export type EquipmentSelectorGetResponse = EquipmentMeasurementGroupApi[];

export type EquipmentSelectorPutRequest = EquipmentMeasurementGroupApi[];

export type EquipmentSelectorPutResponse = EquipmentMeasurementGroupApi[];

const equipmentSelectorMap = new Map<string, EquipmentSelectorGetResponse>();

function cloneEquipmentSelection(selection: EquipmentSelectionApiItem): EquipmentSelectionApiItem {
  const itemId = selection.equipmentItemId ?? selection.equipmentDenominationId ?? 0;
  return {
    equipmentItemId: itemId,
    equipmentDenominationId: itemId,
    categoryId: selection.categoryId,
    magnitude: selection.magnitude ?? null,
    channel: selection.channel ?? null,
    seriesIds: selection.seriesIds ? [...selection.seriesIds] : undefined,
    shotIds: selection.shotIds ? [...selection.shotIds] : undefined,
  };
}

function cloneEquipmentMeasurementGroup(group: EquipmentMeasurementGroupApi): EquipmentMeasurementGroupApi {
  return {
    measurementGroup: group.measurementGroup,
    selections: group.selections.map(cloneEquipmentSelection),
  };
}

function cloneEquipmentSelectorState(state: EquipmentSelectorGetResponse): EquipmentSelectorGetResponse {
  return state.map(cloneEquipmentMeasurementGroup);
}

function defaultEquipmentSelectorState(): EquipmentSelectorGetResponse {
  return [
    {
      measurementGroup: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
      selections: [
        {
          equipmentItemId: 9876,
          equipmentDenominationId: 9876,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
          equipmentItemId: 4321,
          equipmentDenominationId: 4321,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.ANTENNA,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS,
      selections: [
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.AMPLIFIER,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.SONIDO,
      selections: [
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
          seriesIds: ['funcionamiento-2'],
          shotIds: ['disparo-3'],
        },
      ],
    },
  ];
}

export function getEquipmentSelectorState(fireTrialId: string): EquipmentSelectorGetResponse {
  if (!equipmentSelectorMap.has(fireTrialId)) {
    equipmentSelectorMap.set(fireTrialId, defaultEquipmentSelectorState());
  }

  const state = equipmentSelectorMap.get(fireTrialId);
  return cloneEquipmentSelectorState(state ?? defaultEquipmentSelectorState());
}

export function updateEquipmentSelectorState(
  fireTrialId: string,
  payload: EquipmentSelectorPutRequest,
): EquipmentSelectorPutResponse {
  const persistedSelection = payload.map(cloneEquipmentMeasurementGroup);
  equipmentSelectorMap.set(fireTrialId, persistedSelection);
  return persistedSelection.map(cloneEquipmentMeasurementGroup);
}
