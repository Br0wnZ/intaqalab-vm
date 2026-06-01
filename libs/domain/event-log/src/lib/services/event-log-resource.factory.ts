import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';
import type { PaginatedApiResponse, PaginatedSortedViewRequest } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';

import type { EventLogResponse, EventLogSearch } from '../utils-models/event-log.model';

export function injectEventLogResource<T>(endpointUrl: string) {
  const searchItems = signal<PaginatedSortedViewRequest>({});
  const filtersItems = signal<EventLogSearch>({});

  const paginatedResponse = httpResource<PaginatedApiResponse<EventLogResponse>>(() => {
    const params = searchItems();
    const filters = filtersItems();
    let apiParams = paginatedSortedParamsToSend(params);

    const filtersEntries = Object.entries(filters);

    if (filtersEntries.length) {
      filtersEntries.forEach(([key, value]) => (apiParams = apiParams.append(key, value as string)));
    }

    return {
      url: endpointUrl,
      params: apiParams,
      method: 'GET',
    };
  });

  return { searchItems, paginatedResponse, filtersItems };
}
