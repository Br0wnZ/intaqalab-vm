import { httpResource } from '@angular/common/http';
import { Service } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

type DenominationsType = { id: string; name: string };

@Service()
export class LoadingZoneDenominationsService {
  readonly #apiUrl = injectPlanningEndpoint();

  getDenominationsResponse = httpResource<DenominationsType[]>(() => {
    return { url: `${this.#apiUrl}/denominations-loading-zone`, method: 'GET' };
  });
}
