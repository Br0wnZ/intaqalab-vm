import { HttpContext, httpResource } from '@angular/common/http';
import { computed, Service } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectClientsEndpoint } from '@intaqalab/config';

import type { Client, ClientListResponse } from '../models/client.model';

@Service()
export class ClientsDataService {
  readonly #url = injectClientsEndpoint();

  readonly clientResource = httpResource<ClientListResponse>(
    () => ({
      url: this.#url,
      context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
    }),
    {
      defaultValue: { totalElements: 0, items: [] },
    },
  );

  readonly hasError = computed<boolean>(() => !!this.clientResource.error());

  readonly clients = computed<Client[]>(() => {
    if (this.hasError()) return [];
    return this.clientResource.value()?.items ?? [];
  });
}
