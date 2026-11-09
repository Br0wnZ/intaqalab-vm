import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  PropellantChargeAdjustmentConfiguration,
  PropellantChargeAdjustmentQuery,
  PropellantChargeAdjustmentResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface PropellantChargeParams {
  fireTrialId: FireTrial['id'];
  query: PropellantChargeAdjustmentQuery;
}

@Injectable({
  providedIn: 'root',
})
export class PropellantChargeService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getPropellantChargeAdjustmentParams = signal<PropellantChargeParams | null>(null);

  readonly propellantChargeAdjustmentResource = httpResource<PropellantChargeAdjustmentResponse>(() => {
    const params = this.#getPropellantChargeAdjustmentParams();
    if (!params || params.query.shotIds.length === 0) return undefined;

    let queryParams = new HttpParams()
      .set('nominalSpeed', params.query.nominalSpeed)
      .set('nominalSpeedUnit', params.query.nominalSpeedUnit ?? 'M_S');
    params.query.shotIds.forEach((shotId) => {
      queryParams = queryParams.append('shotIds', shotId);
    });

    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'propellant-charge-adjustment'),
      params: queryParams,
      method: 'GET',
    };
  });

  getPropellantChargeAdjustment(fireTrialId: FireTrial['id'], query: PropellantChargeAdjustmentQuery): void {
    this.#getPropellantChargeAdjustmentParams.set({ fireTrialId, query });
  }

  readonly #listPropellantChargeAdjustmentConfigurationsFireTrialId = signal<FireTrial['id'] | null>(null);

  readonly propellantChargeAdjustmentConfigurationsResource = httpResource<PropellantChargeAdjustmentConfiguration[]>(
    () => {
      const fireTrialId = this.#listPropellantChargeAdjustmentConfigurationsFireTrialId();
      if (!fireTrialId) return undefined;
      return {
        url: executionTrialUrl(this.#executionUrl, fireTrialId, 'propellant-charge-adjustment', 'configurations'),
        method: 'GET',
      };
    },
  );

  listPropellantChargeAdjustmentConfigurations(fireTrialId: FireTrial['id']): void {
    this.#listPropellantChargeAdjustmentConfigurationsFireTrialId.set(fireTrialId);
  }
}
