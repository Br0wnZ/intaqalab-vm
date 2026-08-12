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

export interface EquipmentSelectionApiItem {
  equipmentDenominationId: number;
  categoryId: EquipmentTypeEnum;
  seriesIds?: string[];
  shotIds?: string[];
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
  measurementGroup: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectionApiItem[];
}

export type EquipmentSelectorGetResponse = EquipmentMeasurementGroupApi[];

export type EquipmentSelectorPutRequest = EquipmentMeasurementGroupApi[];

export type EquipmentSelectorPutResponse = EquipmentMeasurementGroupApi[];

const equipmentSelectorMap = new Map<string, EquipmentSelectorGetResponse>();

function cloneEquipmentSelection(selection: EquipmentSelectionApiItem): EquipmentSelectionApiItem {
  return {
    equipmentDenominationId: selection.equipmentDenominationId,
    categoryId: selection.categoryId,
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
          equipmentDenominationId: 9876,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
          equipmentDenominationId: 4321,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
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
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
          seriesIds: ['funcionamiento-1'],
          shotIds: ['disparo-1', 'disparo-2'],
        },
        {
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
