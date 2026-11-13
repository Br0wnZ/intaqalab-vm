import { Service } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogDocumentsResponse } from '../../utils-models/documents.model';
import { injectEventLogResource } from '../event-log-resource.factory';

@Service()
export class DocumentsService {
  readonly #documentsData = injectEventLogResource<EventLogDocumentsResponse>(`${injectEventLogEndpoint()}/documents`);

  readonly paginatedResponse = this.#documentsData.paginatedResponse;
  readonly searchItems = this.#documentsData.searchItems;
  readonly filtersItems = this.#documentsData.filtersItems;
}
