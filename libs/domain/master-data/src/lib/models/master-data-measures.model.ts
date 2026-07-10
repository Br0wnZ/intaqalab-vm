import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

export interface MasterDataMeasures {
  id?: string;
  unit: string;
  measurementAreaCode: string;
  magnitudeCode: string;
  magnitude: { es: string; en: string };
  magnitudeLabel?: string;
  measureUnit: string; // QUANTITATIVE
  qualificationType: MeasurementsAndRecordsQualificationType;
  minValue: number; // QUANTITATIVE
  maxValue: number; // QUANTITATIVE
  values: MeasureQualitativeValue[]; // QUALITATIVE
  equipmentTypes: string[];
  procedure: { es: string; en: string };
  procedureLabel?: string;
  accreditation: boolean;
  grubbs: boolean; // QUANTITATIVE
  uncertainty: string; // QUANTITATIVE
  active?: boolean;
}

export interface MeasureQualitativeValue {
  code: string;
  name: { es: string; en: string };
  active: boolean;
}

export enum MeasuresEquipments {
  DOPPLER_RADAR = 'DOPPLER_RADAR',
  TRAJECTOGRAPHY_RADAR = 'TRAJECTOGRAPHY_RADAR',
  ANTENNA = 'ANTENNA',
  PIEZOELECTRIC_SENSOR = 'PIEZOELECTRIC_SENSOR',
  AMPLIFIER = 'AMPLIFIER',
  SOUND_LEVEL_METER = 'SOUND_LEVEL_METER',
  CONVENTIONAL_CAMERA = 'CONVENTIONAL_CAMERA',
  HIGH_SPEED_CAMERA = 'HIGH_SPEED_CAMERA',
  RECORDER = 'RECORDER',
  TRACE_RULER = 'TRACE_RULER',
  CHRONOMETER = 'CHRONOMETER',
  BALANCE = 'BALANCE',
  CLIMATIC_CHAMBER = 'CLIMATIC_CHAMBER',
  PRESSURE_GAUGE = 'PRESSURE_GAUGE',
  CRUSHER = 'CRUSHER',
  PROBE = 'PROBE',
  IPG = 'IPG',
}

export const injectMeasuresEquipments = () => {
  const translate = inject(TranslateService);
  const measuresEquipmentsTranslations = toSignal(
    translate.getStreamOnTranslationChange('MASTER_DATA.MEASURES.LIST.EQUIPMENT_TYPES.VALUES'),
  );
  return computed(() => {
    const translations = measuresEquipmentsTranslations();
    return [
      { value: MeasuresEquipments.DOPPLER_RADAR, label: translations.DOPPLER_RADAR },
      { value: MeasuresEquipments.TRAJECTOGRAPHY_RADAR, label: translations.TRAJECTOGRAPHY_RADAR },
      { value: MeasuresEquipments.ANTENNA, label: translations.ANTENNA },
      { value: MeasuresEquipments.PIEZOELECTRIC_SENSOR, label: translations.PIEZOELECTRIC_SENSOR },
      { value: MeasuresEquipments.AMPLIFIER, label: translations.AMPLIFIER },
      { value: MeasuresEquipments.SOUND_LEVEL_METER, label: translations.SOUND_LEVEL_METER },
      { value: MeasuresEquipments.CONVENTIONAL_CAMERA, label: translations.CONVENTIONAL_CAMERA },
      { value: MeasuresEquipments.HIGH_SPEED_CAMERA, label: translations.HIGH_SPEED_CAMERA },
      { value: MeasuresEquipments.RECORDER, label: translations.RECORDER },
      { value: MeasuresEquipments.TRACE_RULER, label: translations.TRACE_RULER },
      { value: MeasuresEquipments.CHRONOMETER, label: translations.CHRONOMETER },
      { value: MeasuresEquipments.BALANCE, label: translations.BALANCE },
      { value: MeasuresEquipments.CLIMATIC_CHAMBER, label: translations.CLIMATIC_CHAMBER },
      { value: MeasuresEquipments.PRESSURE_GAUGE, label: translations.PRESSURE_GAUGE },
      { value: MeasuresEquipments.CRUSHER, label: translations.CRUSHER },
      { value: MeasuresEquipments.PROBE, label: translations.PROBE },
      { value: MeasuresEquipments.IPG, label: translations.IPG },
    ];
  });
};

export type MeasurementsAndRecordsQualificationType = 'QUANTITATIVE' | 'QUALITATIVE' | '';
