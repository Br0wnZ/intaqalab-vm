export type TechnicalUnitEnum = 'TOPOGRAPHY' | 'MUNITIONS' | 'ARMAMENT' | 'BALLISTICS';

export type MeasureUnitEnum =
  | 'M_S'
  | 'KM_H'
  | 'RPS'
  | 'RPM'
  | 'BAR'
  | 'MPA'
  | 'KG_CM2'
  | 'CELSIUS'
  | 'KELVIN'
  | 'MS'
  | 'S'
  | 'G'
  | 'KG'
  | 'DEGREES'
  | 'MILS'
  | 'RAD'
  | 'UM'
  | 'MM'
  | 'M'
  | 'KM'
  | 'DB'
  | 'SPM'
  | 'QUANTITY';

export type QualificationTypeEnum = 'QUANTITATIVE' | 'QUALITATIVE';

export type MeasureQualitativeValue = {
  code: string;
  name: Record<string, string>;
  label: string;
  active: boolean;
};

export type EquipmentTypeEnum =
  | 'DOPPLER_RADAR'
  | 'TRAJECTOGRAPHY_RADAR'
  | 'ANTENNA'
  | 'PIEZOELECTRIC_SENSOR'
  | 'AMPLIFIER'
  | 'SOUND_LEVEL_METER'
  | 'CONVENTIONAL_CAMERA'
  | 'HIGH_SPEED_CAMERA'
  | 'TRACE_RULER'
  | 'CHRONOMETER'
  | 'BALANCE'
  | 'CLIMATIC_CHAMBER'
  | 'PRESSURE_GAUGE'
  | 'CRUSHER'
  | 'PROBE';

export type MasterDataMeasureItem = {
  id: string;
  unit: TechnicalUnitEnum;
  measurementAreaCode: string;
  magnitudeCode: string;
  magnitude: Record<string, string>;
  label: string;
  measureUnit?: MeasureUnitEnum;
  qualificationType: QualificationTypeEnum;
  values?: MeasureQualitativeValue[];
  minValue?: number;
  maxValue?: number;
  equipmentTypes: EquipmentTypeEnum[];
  procedure: Record<string, string>;
  accreditation: boolean;
  grubbs: boolean;
  builtIn: boolean;
  uncertainty?: string;
  magnitudeLabel: string;
  procedureLabel: string;
  active: boolean;
  favorite?: boolean;
};

export type MasterDataMeasureListResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MasterDataMeasureItem[];
};

export type MeasuresCatalogQueryParams = {
  magnitude?: string;
  unit?: TechnicalUnitEnum;
  page?: number;
  pageSize?: number;
  active?: boolean;
  sort?: string[];
};
