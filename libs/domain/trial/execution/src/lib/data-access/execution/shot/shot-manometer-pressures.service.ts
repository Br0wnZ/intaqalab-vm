import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotManometerPressuresRequest, ShotManometerPressuresResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotManometerPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotManometerPressuresUpdateParams extends ShotManometerPressuresParams {
  body: ShotManometerPressuresRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotManometerPressuresService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly shotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#getShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'manometer-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotManometerPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly #fetchShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#fetchShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'manometer-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotManometerPressuresResponse> {
    this.#fetchShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotManometerPressuresResource, this.#injector);
  }

  readonly #updateShotManometerPressuresParams = signal<ShotManometerPressuresUpdateParams | null>(null);

  readonly updateShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#updateShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'manometer-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): void {
    this.#updateShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): Promise<ShotManometerPressuresResponse> {
    return firstValueFrom(
      this.#http.put<ShotManometerPressuresResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'manometer-pressures', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
