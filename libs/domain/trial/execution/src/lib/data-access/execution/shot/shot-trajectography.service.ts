import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotTrajectographyRequest, ShotTrajectographyResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotTrajectographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotTrajectographyUpdateParams extends ShotTrajectographyParams {
  body: ShotTrajectographyRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotTrajectographyService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly shotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#getShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'trajectography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });
  readonly shotShotTrajectographyResource = this.shotTrajectographyResource;

  getShotTrajectography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTrajectographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly #fetchShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const p = this.#fetchShotTrajectographyParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        p.fireTrialId,
        'trajectography',
        'series',
        p.seriesId,
        'shots',
        p.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTrajectographyResponse> {
    this.#fetchShotTrajectographyParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotTrajectographyResource, this.#injector);
  }

  readonly #updateShotTrajectographyParams = signal<ShotTrajectographyUpdateParams | null>(null);

  readonly updateShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#updateShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'trajectography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): void {
    this.#updateShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): Promise<ShotTrajectographyResponse> {
    return firstValueFrom(
      this.#http.put<ShotTrajectographyResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'trajectography', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
