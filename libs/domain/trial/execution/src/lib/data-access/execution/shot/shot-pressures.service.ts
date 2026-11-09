import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotPressuresRequest, ShotPressuresResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotPressuresUpdateParams extends ShotPressuresParams {
  body: ShotPressuresRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotPressuresService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly shotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#getShotPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotPressuresParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly #fetchShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const p = this.#fetchShotPressuresParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, p.fireTrialId, 'pressures', 'series', p.seriesId, 'shots', p.shotId),
      method: 'GET',
    };
  });

  async fetchShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotPressuresResponse> {
    this.#fetchShotPressuresParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotPressuresResource, this.#injector);
  }

  readonly #updateShotPressuresParams = signal<ShotPressuresUpdateParams | null>(null);

  readonly updateShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#updateShotPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotPressure(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotPressuresRequest): void {
    this.#updateShotPressuresParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotPressuresRequest,
  ): Promise<ShotPressuresResponse> {
    return firstValueFrom(
      this.#http.put<ShotPressuresResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'pressures', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
