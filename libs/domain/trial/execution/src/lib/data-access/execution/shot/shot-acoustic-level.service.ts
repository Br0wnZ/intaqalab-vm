import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ShotAcousticLevelRequest, ShotAcousticLevelResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotAcousticLevelParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotAcousticLevelUpdateParams extends ShotAcousticLevelParams {
  body: ShotAcousticLevelRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotAcousticLevelService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly shotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#getShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'acoustic-level',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });
  readonly shotShotAcousticLevelResource = this.shotAcousticLevelResource;

  getShotAcousticLevel(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly #fetchShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const p = this.#fetchShotAcousticLevelParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        p.fireTrialId,
        'acoustic-level',
        'series',
        p.seriesId,
        'shots',
        p.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotAcousticLevelResponse> {
    this.#fetchShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotAcousticLevelResource, this.#injector);
  }

  readonly #updateShotAcousticLevelParams = signal<ShotAcousticLevelUpdateParams | null>(null);

  readonly updateShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#updateShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'acoustic-level',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): void {
    this.#updateShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): Promise<ShotAcousticLevelResponse> {
    return firstValueFrom(
      this.#http.put<ShotAcousticLevelResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'acoustic-level', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }
}
