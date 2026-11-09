import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { JltShotDataRequest, JltShotDataResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface JltShotDataParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface JltShotDataUpdateParams extends JltShotDataParams {
  body: JltShotDataRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotJltDataService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly jltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#getJltShotDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-shot-data',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getJltShotDataParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly #fetchJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#fetchJltShotDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-shot-data',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<JltShotDataResponse> {
    this.#fetchJltShotDataParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchJltShotDataResource, this.#injector);
  }

  readonly #updateJltShotDataParams = signal<JltShotDataUpdateParams | null>(null);

  readonly updateJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#updateJltShotDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-shot-data',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: JltShotDataRequest): void {
    this.#updateJltShotDataParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateJltShotData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: JltShotDataRequest,
  ): Promise<JltShotDataResponse> {
    return firstValueFrom(
      this.#http.put<JltShotDataResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'jlt-shot-data', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
