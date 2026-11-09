import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { VelocityUniformityQuery, VelocityUniformityResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface VelocityUniformityParams {
  fireTrialId: FireTrial['id'];
  query: VelocityUniformityQuery;
}

@Injectable({
  providedIn: 'root',
})
export class VelocityUniformityService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getVelocityUniformityParams = signal<VelocityUniformityParams | null>(null);

  readonly velocityUniformityResource = httpResource<VelocityUniformityResponse>(() => {
    const params = this.#getVelocityUniformityParams();
    if (!params || params.query.shotIds.length === 0 || !params.query.configurationId) return undefined;

    let queryParams = new HttpParams().set('configurationId', params.query.configurationId);
    [...new Set(params.query.shotIds)].forEach((shotId) => {
      queryParams = queryParams.append('shotIds', shotId);
    });

    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'velocity-uniformity'),
      params: queryParams,
      method: 'GET',
    };
  });

  getVelocityUniformity(fireTrialId: FireTrial['id'], query: VelocityUniformityQuery): void {
    this.#getVelocityUniformityParams.set({ fireTrialId, query });
  }

  clearVelocityUniformity(): void {
    this.#getVelocityUniformityParams.set(null);
  }
}
