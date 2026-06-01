import { HttpContext, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectCentersEndpoint } from '@intaqalab/config';

@Injectable({
  providedIn: 'root',
})
export class CentersDataService {
  readonly #url = injectCentersEndpoint();

  readonly centersResource = httpResource(() => ({
    url: this.#url,
    context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
  }));

  readonly centers = this.centersResource.value;
}
