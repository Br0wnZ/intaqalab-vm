import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogDocumentType } from '../../../utils-models/documents.model';

@Injectable({
  providedIn: 'root',
})
export class DocumentTypesService {
  readonly #apiUrl = injectEventLogEndpoint();

  getDocumentTypesResponse = httpResource<EventLogDocumentType[]>(() => {
    return {
      url: `${this.#apiUrl}/document-types`,
      method: 'GET',
    };
  });
}
