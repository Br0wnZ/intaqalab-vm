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
  const commonSeriesIds = ['funcionamiento-1', '3fa85f64-5717-4562-b3fc-2c963f66afa1'];
  const commonShotIds = [
    'disparo-1',
    'disparo-2',
    '3fa85f64-5717-4562-b3fc-2c963f66bfa1',
    '3fa85f64-5717-4562-b3fc-2c963f66bfa2',
  ];

  const allSeriesIds = [...commonSeriesIds, 'funcionamiento-2', '3fa85f64-5717-4562-b3fc-2c963f66afa2'];
  const allShotIds = [...commonShotIds, 'disparo-3', '3fa85f64-5717-4562-b3fc-2c963f66bfa3'];

  return [
    {
      measurementGroup: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
      selections: [
        {
          equipmentItemId: 9876,
          equipmentDenominationId: 9876,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 4321,
          equipmentDenominationId: 4321,
          categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.ANTENNA,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
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
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 2,
          equipmentDenominationId: 2,
          categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 1,
          categoryId: EquipmentTypeEnum.AMPLIFIER,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
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
          seriesIds: ['funcionamiento-2', '3fa85f64-5717-4562-b3fc-2c963f66afa2'],
          shotIds: ['disparo-3', '3fa85f64-5717-4562-b3fc-2c963f66bfa3'],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.VIDEO_AV,
      selections: [
        {
          equipmentItemId: 1,
          equipmentDenominationId: 6001,
          categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
          channel: 1,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 6501,
          categoryId: EquipmentTypeEnum.RECORDER,
          channel: 1,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 2,
          equipmentDenominationId: 6002,
          categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
          channel: 2,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 2,
          equipmentDenominationId: 6502,
          categoryId: EquipmentTypeEnum.RECORDER,
          channel: 2,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.VIDEO_C,
      selections: [
        {
          equipmentItemId: 1,
          equipmentDenominationId: 7001,
          categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
          channel: 2,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 1,
          equipmentDenominationId: 6501,
          categoryId: EquipmentTypeEnum.RECORDER,
          channel: 2,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 2,
          equipmentDenominationId: 7002,
          categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
          channel: 1,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
        {
          equipmentItemId: 2,
          equipmentDenominationId: 6502,
          categoryId: EquipmentTypeEnum.RECORDER,
          channel: 1,
          magnitude: 'ATTACK',
          seriesIds: [...allSeriesIds],
          shotIds: [...allShotIds],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.ACONDICIONAMIENTO,
      selections: [
        {
          equipmentItemId: 21045,
          equipmentDenominationId: 21045,
          categoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER,
          seriesIds: [...commonSeriesIds],
          shotIds: [...commonShotIds],
        },
        {
          equipmentItemId: 21046,
          equipmentDenominationId: 21046,
          categoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER,
          seriesIds: ['funcionamiento-2', '3fa85f64-5717-4562-b3fc-2c963f66afa2'],
          shotIds: ['disparo-3', '3fa85f64-5717-4562-b3fc-2c963f66bfa3'],
        },
      ],
    },
    {
      measurementGroup: EquipmentMagnitudeTagEnum.PESOS,
      selections: [
        {
          equipmentItemId: 21031,
          equipmentDenominationId: 21031,
          categoryId: EquipmentTypeEnum.BALANCE,
          seriesIds: ['funcionamiento-1', '3fa85f64-5717-4562-b3fc-2c963f66afa1'],
          shotIds: ['disparo-1', '3fa85f64-5717-4562-b3fc-2c963f66bfa1'],
        },
        {
          equipmentItemId: 21032,
          equipmentDenominationId: 21032,
          categoryId: EquipmentTypeEnum.BALANCE,
          seriesIds: ['funcionamiento-1', '3fa85f64-5717-4562-b3fc-2c963f66afa1'],
          shotIds: [
            'disparo-1',
            'disparo-2',
            '3fa85f64-5717-4562-b3fc-2c963f66bfa1',
            '3fa85f64-5717-4562-b3fc-2c963f66bfa2',
          ],
        },
        {
          equipmentItemId: 21031,
          equipmentDenominationId: 21031,
          categoryId: EquipmentTypeEnum.BALANCE,
          seriesIds: ['funcionamiento-2', '3fa85f64-5717-4562-b3fc-2c963f66afa2'],
          shotIds: ['disparo-3', '3fa85f64-5717-4562-b3fc-2c963f66bfa3'],
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
