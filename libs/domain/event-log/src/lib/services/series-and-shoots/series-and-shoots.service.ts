import { Injectable } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogSeriesAndShootsResponse } from '../../utils-models/series-and-shoots.model';
import { injectEventLogResource } from '../event-log-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class SeriesAndShootsService {
  readonly #seriesAndShootsData = injectEventLogResource<EventLogSeriesAndShootsResponse>(
    `${injectEventLogEndpoint()}/series-and-shoots`,
  );

  readonly paginatedResponse = this.#seriesAndShootsData.paginatedResponse;
  readonly searchItems = this.#seriesAndShootsData.searchItems;
  readonly filtersItems = this.#seriesAndShootsData.filtersItems;
}
