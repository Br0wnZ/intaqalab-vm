import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotIpgPressuresRequest, ShotIpgPressuresResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotIpgPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotIpgPressuresUpdateParams extends ShotIpgPressuresParams {
  body: ShotIpgPressuresRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotIpgPressuresService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotIpgPressuresParams = signal<ShotIpgPressuresParams | null>(null);

  readonly shotIpgPressuresResource = httpResource<ShotIpgPressuresResponse>(() => {
    const params = this.#getShotIpgPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'ipg-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotIpgPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotIpgPressuresParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotIpgPressuresParams = signal<ShotIpgPressuresParams | null>(null);

  readonly #fetchShotIpgPressuresResource = httpResource<ShotIpgPressuresResponse>(() => {
    const params = this.#fetchShotIpgPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'ipg-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotIpgPressuresResponse> {
    this.#fetchShotIpgPressuresParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotIpgPressuresResource, this.#injector);
  }

  readonly #updateShotIpgPressuresParams = signal<ShotIpgPressuresUpdateParams | null>(null);

  readonly updateShotIpgPressuresResource = httpResource<ShotIpgPressuresResponse>(() => {
    const params = this.#updateShotIpgPressuresParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'ipg-pressures',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotIpgPressuresRequest,
  ): void {
    this.#updateShotIpgPressuresParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotIpgPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotIpgPressuresRequest,
  ): Promise<ShotIpgPressuresResponse> {
    return firstValueFrom(
      this.#http.put<ShotIpgPressuresResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'ipg-pressures', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
