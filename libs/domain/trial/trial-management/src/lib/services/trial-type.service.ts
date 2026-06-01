import { HttpContext, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectFireTrialTypesEndpoint } from '@intaqalab/config';
import type { MasterData, PaginatedApiResponse } from '@intaqalab/models';

@Injectable({
  providedIn: 'root',
})
export class TrialTypeService {
  readonly #url = injectFireTrialTypesEndpoint();

  readonly fireTrialTypesResource = httpResource<PaginatedApiResponse<MasterData>>(() => ({
    url: `${this.#url}?pageSize=100&active=true`,
    context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
  }));
}
