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

export interface EquipmentCategoryDto {
  id: string;
  label: string;
  maxSelection: number;
  equipmentType?: EquipmentTypeEnum;
}

export interface EquipmentItemDto {
  id: string;
  label: string;
  categoryId?: string;
  equipmentType?: EquipmentTypeEnum;
}

export interface EquipmentSelectionDto {
  itemId: string;
  categoryId: EquipmentTypeEnum | string;
  series: string[];
  disparos: string[];
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

export interface EquipmentMagnitudeGroupDto {
  id: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectionDto[];
}

export interface EquipmentSelectorGetResponse {
  categories: EquipmentCategoryDto[];
  items: EquipmentItemDto[];
  serieOptions: Array<{ value: string; label: string }>;
  disparoOptions: Array<{ value: string; label: string }>;
  serieDisparoMap: Record<string, string[]>;
  equipments: EquipmentMagnitudeGroupDto[];
}

export interface EquipmentSelectorPutRequest {
  equipments: EquipmentMagnitudeGroupDto[];
}

export interface EquipmentSelectorPutResponse {
  equipments: EquipmentMagnitudeGroupDto[];
}

const equipmentSelectorMap = new Map<string, EquipmentSelectorGetResponse>();

function cloneEquipmentSelection(selection: EquipmentSelectionDto): EquipmentSelectionDto {
  return {
    itemId: selection.itemId,
    categoryId: selection.categoryId,
    series: [...selection.series],
    disparos: [...selection.disparos],
  };
}

function cloneEquipmentMagnitudeGroup(group: EquipmentMagnitudeGroupDto): EquipmentMagnitudeGroupDto {
  return {
    id: group.id,
    selections: group.selections.map(cloneEquipmentSelection),
  };
}

function cloneEquipmentSelectorState(state: EquipmentSelectorGetResponse): EquipmentSelectorGetResponse {
  return {
    categories: state.categories.map((category) => ({ ...category })),
    items: state.items.map((item) => ({ ...item })),
    serieOptions: state.serieOptions.map((option) => ({ ...option })),
    disparoOptions: state.disparoOptions.map((option) => ({ ...option })),
    serieDisparoMap: Object.fromEntries(
      Object.entries(state.serieDisparoMap).map(([serieId, disparos]) => [serieId, [...disparos]]),
    ),
    equipments: state.equipments.map(cloneEquipmentMagnitudeGroup),
  };
}

function defaultEquipmentSelectorState(): EquipmentSelectorGetResponse {
  return {
    categories: [
      {
        id: 'radar-dopler',
        label: 'Radar Doppler',
        maxSelection: 3,
        equipmentType: EquipmentTypeEnum.DOPPLER_RADAR,
      },
      {
        id: 'sensor-piezoelectrico',
        label: 'Sensor Piezoeléctrico',
        maxSelection: 2,
        equipmentType: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
      },
      {
        id: 'amplificador',
        label: 'Amplificador',
        maxSelection: 5,
        equipmentType: EquipmentTypeEnum.AMPLIFIER,
      },
      {
        id: 'antena',
        label: 'Antena',
        maxSelection: 1,
        equipmentType: EquipmentTypeEnum.ANTENNA,
      },
      {
        id: 'sonometro',
        label: 'Sonómetro',
        maxSelection: 3,
        equipmentType: EquipmentTypeEnum.SOUND_LEVEL_METER,
      },
    ],
    items: [
      {
        id: 'rd-9876',
        label: 'Radar Doppler 9876',
        categoryId: 'radar-dopler',
        equipmentType: EquipmentTypeEnum.DOPPLER_RADAR,
      },
      {
        id: 'rd-4321',
        label: 'Radar Doppler 4321',
        categoryId: 'radar-dopler',
        equipmentType: EquipmentTypeEnum.DOPPLER_RADAR,
      },
      {
        id: 'ant-01',
        label: 'Antena 01',
        categoryId: 'antena',
        equipmentType: EquipmentTypeEnum.ANTENNA,
      },
      {
        id: 'sp-01',
        label: 'Sensor Piezoeléctrico 01',
        categoryId: 'sensor-piezoelectrico',
        equipmentType: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
      },
      {
        id: 'amp-01',
        label: 'Amplificador 01',
        categoryId: 'amplificador',
        equipmentType: EquipmentTypeEnum.AMPLIFIER,
      },
      {
        id: 'son-01',
        label: 'Sonómetro Norsonic 140 / SN001',
        categoryId: 'sonometro',
        equipmentType: EquipmentTypeEnum.SOUND_LEVEL_METER,
      },
      {
        id: 'son-02',
        label: 'Sonómetro Norsonic 145 / SN002',
        categoryId: 'sonometro',
        equipmentType: EquipmentTypeEnum.SOUND_LEVEL_METER,
      },
      {
        id: 'son-03',
        label: 'Sonómetro Bruel & Kjaer 2270 / SN003',
        categoryId: 'sonometro',
        equipmentType: EquipmentTypeEnum.SOUND_LEVEL_METER,
      },
    ],
    equipments: [
      {
        id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
        selections: [
          {
            itemId: 'rd-9876',
            categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
          {
            itemId: 'ant-01',
            categoryId: EquipmentTypeEnum.ANTENNA,
            series: ['funcionamiento-1'],
            disparos: ['disparo-1', 'disparo-2'],
          },
        ],
      },
      {
        id: EquipmentMagnitudeTagEnum.SONIDO,
        selections: [
          {
            itemId: 'son-01',
            categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
            series: ['funcionamiento-2'],
            disparos: ['disparo-3'],
          },
        ],
      },
    ],
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    serieDisparoMap: {
      'funcionamiento-1': ['disparo-1', 'disparo-2'],
      'funcionamiento-2': ['disparo-3'],
    },
  };
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
  const state = getEquipmentSelectorState(fireTrialId);
  const persistedEquipments = payload.equipments.map(cloneEquipmentMagnitudeGroup);
  const updatedState: EquipmentSelectorGetResponse = {
    ...state,
    equipments: persistedEquipments,
  };

  equipmentSelectorMap.set(fireTrialId, updatedState);

  return {
    equipments: updatedState.equipments.map(cloneEquipmentMagnitudeGroup),
  };
}
