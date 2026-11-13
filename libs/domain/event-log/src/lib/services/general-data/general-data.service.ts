import { Service } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogGeneralDataResponse } from '../../utils-models/general-data.model';
import { injectEventLogResource } from '../event-log-resource.factory';

@Service()
export class GeneralDataService {
  readonly #generalData = injectEventLogResource<EventLogGeneralDataResponse>(
    `${injectEventLogEndpoint()}/general-data`,
  );

  readonly paginatedResponse = this.#generalData.paginatedResponse;
  readonly searchItems = this.#generalData.searchItems;
  readonly filtersItems = this.#generalData.filtersItems;
}
