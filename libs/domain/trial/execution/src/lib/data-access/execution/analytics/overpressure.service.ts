import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  TrialOverpressureInfoParams,
  TrialOverpressureInfoRequest,
  TrialOverpressureInfoResponse,
} from '../../../execution/models/trial-overpressure-info.models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

@Injectable({
  providedIn: 'root',
})
export class OverpressureService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getTrialOverpressureInfoParams = signal<TrialOverpressureInfoParams | null>(null);

  readonly trialOverpressureInfoResource = httpResource<TrialOverpressureInfoResponse>(() => {
    const params = this.#getTrialOverpressureInfoParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'overpressure-info'),
      method: 'GET',
    };
  });

  getTrialOverpressureInfo(fireTrialId: FireTrial['id']): void {
    this.#getTrialOverpressureInfoParams.set({ fireTrialId });
  }

  readonly #fetchTrialOverpressureInfoParams = signal<TrialOverpressureInfoParams | null>(null);

  readonly #fetchTrialOverpressureInfoResource = httpResource<TrialOverpressureInfoResponse>(() => {
    const params = this.#fetchTrialOverpressureInfoParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'overpressure-info'),
      method: 'GET',
    };
  });

  async fetchTrialOverpressureInfo(fireTrialId: FireTrial['id']): Promise<TrialOverpressureInfoResponse> {
    this.#fetchTrialOverpressureInfoParams.set({ fireTrialId });
    return awaitResourceValue(this.#fetchTrialOverpressureInfoResource, this.#injector);
  }

  updateTrialOverpressureInfo(
    fireTrialId: FireTrial['id'],
    body: TrialOverpressureInfoRequest,
  ): Promise<TrialOverpressureInfoResponse> {
    return firstValueFrom(
      this.#http.put<TrialOverpressureInfoResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'overpressure-info'),
        body,
      ),
    );
  }
}
