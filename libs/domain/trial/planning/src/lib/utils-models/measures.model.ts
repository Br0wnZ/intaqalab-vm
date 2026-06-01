export type TrialMeasuresResponse = {
  series: SeriesMeasuresData[];
};

export type SeriesMeasuresData = {
  seriesId: string;
  seriesName: string;
  measures: MeasuresData;
};

export type MeasureData = {
  id: string;
  name: string;
  minLimit?: number | null;
  maxLimit?: number | null;
  deviation?: number | null;
};

export type MeasuresData = {
  topographyMeasures: MeasureData[];
  munitionsMeasures: MeasureData[];
  armamentMeasures: MeasureData[];
  ballisticsMeasures: MeasureData[];
};

export type MeasureSelection = {
  id: string;
  minLimit?: number | null;
  maxLimit?: number | null;
  deviation?: number | null;
};

export type MeasuresBulkUpdateRequest = {
  series: SeriesMeasuresRequest[];
};

export type SeriesMeasuresRequest = {
  seriesId: string;
  measures: SeriesMeasuresRequestData;
};

export type SeriesMeasuresRequestData = {
  topographyMeasures: MeasureSelection[];
  munitionsMeasures: MeasureSelection[];
  armamentMeasures: MeasureSelection[];
  ballisticsMeasures: MeasureSelection[];
};
