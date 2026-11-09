import type { MeasureUnitEnum, SHOT_CONDITIONS_UNIT_OPTIONS } from '@intaqalab/models';

import type { SelectOption } from './catalog.model';

export type MeasureSerie = {
  seriesId: string;
  seriesName: string;
  measures: Measures;
};

export type Measures = {
  topographyMeasures: TopographyMeasure[];
  munitionsMeasures: TopographyMeasure[];
  armamentMeasures: TopographyMeasure[];
  ballisticsMeasures: TopographyMeasure[];
};

export type TopographyMeasure = {
  id: string;
  name: string;
};

export type MeasureSelectionData = {
  id: string;
  measureUnit?: MeasureUnitEnum;
  minLimit: number | null;
  maxLimit: number | null;
  deviation: number | null;
  expanded: boolean;
};

export type MeasureUnitOptions = Record<string, (typeof SHOT_CONDITIONS_UNIT_OPTIONS)['distance']>;

export type MeasureLimitChange = {
  field: 'minLimit' | 'maxLimit' | 'deviation';
  value: number | null;
  measureUnit?: MeasureUnitEnum;
};

export type SerieData = {
  id: string;
  nombre: string;
  expanded: boolean;
  topografia: MeasureSelectionData[];
  municiones: MeasureSelectionData[];
  armamento: MeasureSelectionData[];
  balistica: MeasureSelectionData[];
};

export type MagnitudesOptions = {
  topografia: SelectOption[];
  municiones: SelectOption[];
  armamento: SelectOption[];
  balistica: SelectOption[];
};

export type MeasureCategoryType = 'topografia' | 'municiones' | 'armamento' | 'balistica';

export type MeasureCategoryDef = {
  key: MeasureCategoryType;
  title: string;
  subtitle: string;
};
