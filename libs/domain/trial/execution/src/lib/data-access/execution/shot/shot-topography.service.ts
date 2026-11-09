import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotTopographyRequest, ShotTopographyResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotTopographyUpdateParams extends ShotTopographyParams {
  body: ShotTopographyRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotTopographyService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly shotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#getShotTopographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'topography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });
  readonly shotShotTopographyResource = this.shotTopographyResource;

  getShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTopographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly #fetchShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const p = this.#fetchShotTopographyParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, p.fireTrialId, 'topography', 'series', p.seriesId, 'shots', p.shotId),
      method: 'GET',
    };
  });

  async fetchShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTopographyResponse> {
    this.#fetchShotTopographyParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotTopographyResource, this.#injector);
  }

  readonly #updateShotTopographyParams = signal<ShotTopographyUpdateParams | null>(null);

  readonly updateShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#updateShotTopographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'topography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotTopographyRequest): void {
    this.#updateShotTopographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTopographyRequest,
  ): Promise<ShotTopographyResponse> {
    return firstValueFrom(
      this.#http.put<ShotTopographyResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'topography', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
