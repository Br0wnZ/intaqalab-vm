import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotVideoDataRequest, ShotVideoDataResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotVideoDataParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotVideoDataUpdateParams extends ShotVideoDataParams {
  body: ShotVideoDataRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotVideoService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotVideoDataParams = signal<ShotVideoDataParams | null>(null);

  readonly shotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#getShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'video',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotVideoDataParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotVideoDataParams = signal<ShotVideoDataParams | null>(null);

  readonly #fetchShotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#fetchShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'video',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotVideoData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotVideoDataResponse> {
    this.#fetchShotVideoDataParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotVideoDataResource, this.#injector);
  }

  readonly #updateShotVideoDataParams = signal<ShotVideoDataUpdateParams | null>(null);

  readonly updateShotVideoDataResource = httpResource<ShotVideoDataResponse>(() => {
    const params = this.#updateShotVideoDataParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'video',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotVideoData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVideoDataRequest): void {
    this.#updateShotVideoDataParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotVideoData(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotVideoDataRequest,
  ): Promise<ShotVideoDataResponse> {
    return firstValueFrom(
      this.#http.put<ShotVideoDataResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'video', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
