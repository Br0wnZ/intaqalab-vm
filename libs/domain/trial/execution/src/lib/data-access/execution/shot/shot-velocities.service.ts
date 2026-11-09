import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotVelocitiesRequest, ShotVelocitiesResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotVelocitiesParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotVelocitiesUpdateParams extends ShotVelocitiesParams {
  body: ShotVelocitiesRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotVelocitiesService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly shotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#getShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'velocities',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotVelocities(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotVelocitiesParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly #fetchShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#fetchShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'velocities',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotVelocities(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotVelocitiesResponse> {
    this.#fetchShotVelocitiesParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotVelocitiesResource, this.#injector);
  }

  readonly #updateShotVelocitiesParams = signal<ShotVelocitiesUpdateParams | null>(null);

  readonly updateShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#updateShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'velocities',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotVelocity(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVelocitiesRequest): void {
    this.#updateShotVelocitiesParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotVelocity(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotVelocitiesRequest,
  ): Promise<ShotVelocitiesResponse> {
    return firstValueFrom(
      this.#http.put<ShotVelocitiesResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'velocities', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
