import { Injectable } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogMeasuresResponse } from '../../utils-models/measures.model';
import { injectEventLogResource } from '../event-log-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MeasuresService {
  readonly #measuresData = injectEventLogResource<EventLogMeasuresResponse>(`${injectEventLogEndpoint()}/measures`);

  readonly paginatedResponse = this.#measuresData.paginatedResponse;
  readonly searchItems = this.#measuresData.searchItems;
  readonly filtersItems = this.#measuresData.filtersItems;
}
