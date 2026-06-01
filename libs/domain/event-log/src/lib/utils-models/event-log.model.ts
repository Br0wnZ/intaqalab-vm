import type { EventLogDocumentsFilters, EventLogDocumentsResponse, EventLogDocumentsSearch } from './documents.model';
import type {
  EventLogGeneralDataFilters,
  EventLogGeneralDataResponse,
  EventLogGeneralDataSearch,
} from './general-data.model';
import type { EventLogMeasuresFilters, EventLogMeasuresResponse, EventLogMeasuresSearch } from './measures.model';
import type {
  EventLogSeriesAndShootsFilters,
  EventLogSeriesAndShootsResponse,
  EventLogSeriesAndShootsSearch,
} from './series-and-shoots.model';

export type EventLogFilters =
  | EventLogSeriesAndShootsFilters
  | EventLogGeneralDataFilters
  | EventLogMeasuresFilters
  | EventLogDocumentsFilters;

export type EventLogSearch =
  | EventLogSeriesAndShootsSearch
  | EventLogGeneralDataSearch
  | EventLogMeasuresSearch
  | EventLogDocumentsSearch;

export type EventLogResponse =
  | EventLogDocumentsResponse
  | EventLogGeneralDataResponse
  | EventLogMeasuresResponse
  | EventLogSeriesAndShootsResponse;
