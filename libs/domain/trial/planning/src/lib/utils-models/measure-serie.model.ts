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
  minLimit: number | null;
  maxLimit: number | null;
  deviation: number | null;
  expanded: boolean;
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
