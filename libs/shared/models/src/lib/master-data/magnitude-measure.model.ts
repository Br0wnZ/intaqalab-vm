import type { MeasureUnitEnum } from '../core/measure-unit.enum';

/** Tipo de calificación de una magnitud del catálogo maestro (≡ QualificationTypeEnum del swagger). */
export enum QualificationTypeEnum {
  QUANTITATIVE = 'QUANTITATIVE',
  QUALITATIVE = 'QUALITATIVE',
}

/** Tipo de control que Ejecución debe renderizar para una magnitud dada. */
export enum MagnitudeInputTypeEnum {
  NUMERIC = 'NUMERIC',
  SINGLE_SELECT = 'SINGLE_SELECT',
}

export interface MagnitudeQualitativeOption {
  readonly code: string;
  readonly label: string;
}

/**
 * Contrato mínimo que cualquier magnitud del catálogo maestro (Planning, Master Data, Execution, mocks…)
 * debe cumplir para poder resolver su medida. Desacopla el resolver de tipos concretos de cada dominio (DIP).
 */
export interface MagnitudeMeasureSource {
  readonly magnitudeCode: string;
  readonly magnitudeLabel: string;
  readonly qualificationType: QualificationTypeEnum | '';
  readonly measureUnit?: MeasureUnitEnum | string | null;
  readonly minValue?: number | null;
  readonly maxValue?: number | null;
  readonly values?: ReadonlyArray<{ code: string; label: string }>;
}

export interface QuantitativeMeasureDefinition {
  readonly inputType: MagnitudeInputTypeEnum.NUMERIC;
  readonly unit: MeasureUnitEnum | string | null;
  readonly minValue: number | null;
  readonly maxValue: number | null;
}

export interface QualitativeMeasureDefinition {
  readonly inputType: MagnitudeInputTypeEnum.SINGLE_SELECT;
  readonly options: MagnitudeQualitativeOption[];
}

/** Unión discriminada por `inputType`: qué debe mostrar Ejecución para una magnitud concreta. */
export type MagnitudeMeasureDefinition = QuantitativeMeasureDefinition | QualitativeMeasureDefinition;

export interface MagnitudeDisplayConfig {
  readonly magnitudeCode: string;
  readonly magnitudeLabel: string;
  readonly measure: MagnitudeMeasureDefinition;
}
