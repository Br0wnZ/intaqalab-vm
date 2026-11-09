import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  MaoTopographyBulkConfigurationRequest,
  MaoTopographyBulkConfigurationResponse,
  ShotMaoTopographyRequest,
  ShotMaoTopographyResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotMaoTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotMaoTopographyUpdateParams extends ShotMaoTopographyParams {
  body: ShotMaoTopographyRequest;
}

interface MaoTopographyBulkConfigurationParams {
  fireTrialId: FireTrial['id'];
  body: MaoTopographyBulkConfigurationRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotMaoTopographyService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly shotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#getShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'mao-topography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotMaoTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly #fetchShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const p = this.#fetchShotMaoTopographyParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        p.fireTrialId,
        'mao-topography',
        'series',
        p.seriesId,
        'shots',
        p.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMaoTopographyResponse> {
    this.#fetchShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotMaoTopographyResource, this.#injector);
  }

  readonly #updateShotMaoTopographyParams = signal<ShotMaoTopographyUpdateParams | null>(null);

  readonly updateShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#updateShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'mao-topography',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): void {
    this.#updateShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): Promise<ShotMaoTopographyResponse> {
    return firstValueFrom(
      this.#http.put<ShotMaoTopographyResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'mao-topography', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }

  readonly #bulkConfigureMaoTopographyParams = signal<MaoTopographyBulkConfigurationParams | null>(null);

  readonly #bulkConfigureMaoTopographyResource = httpResource<MaoTopographyBulkConfigurationResponse>(() => {
    const params = this.#bulkConfigureMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'mao-topography', 'bulk-configuration'),
      method: 'POST',
      body: params.body,
    };
  });

  async bulkConfigureMaoTopography(
    fireTrialId: FireTrial['id'],
    body: MaoTopographyBulkConfigurationRequest,
  ): Promise<MaoTopographyBulkConfigurationResponse> {
    this.#bulkConfigureMaoTopographyParams.set({ fireTrialId, body });
    return awaitResourceValue(this.#bulkConfigureMaoTopographyResource, this.#injector);
  }
}
