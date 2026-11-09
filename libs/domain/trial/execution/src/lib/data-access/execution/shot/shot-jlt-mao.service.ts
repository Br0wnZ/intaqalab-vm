import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  JltMaoBulkConfigurationRequest,
  JltMaoBulkConfigurationResponse,
  ShotJltMaoRequest,
  ShotJltMaoResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotJltMaoParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotJltMaoUpdateParams extends ShotJltMaoParams {
  body: ShotJltMaoRequest;
}

interface JltMaoBulkConfigurationParams {
  fireTrialId: FireTrial['id'];
  body: JltMaoBulkConfigurationRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotJltMaoService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly shotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#getShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-mao',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotJltMaoParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly #fetchShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const p = this.#fetchShotJltMaoParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, p.fireTrialId, 'jlt-mao', 'series', p.seriesId, 'shots', p.shotId),
      method: 'GET',
    };
  });

  async fetchShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotJltMaoResponse> {
    this.#fetchShotJltMaoParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotJltMaoResource, this.#injector);
  }

  readonly #updateShotJltMaoParams = signal<ShotJltMaoUpdateParams | null>(null);

  readonly updateShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#updateShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-mao',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotJltMaoRequest): void {
    this.#updateShotJltMaoParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotJltMao(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotJltMaoRequest,
  ): Promise<ShotJltMaoResponse> {
    return firstValueFrom(
      this.#http.put<ShotJltMaoResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'jlt-mao', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }

  readonly #bulkConfigureJltMaoParams = signal<JltMaoBulkConfigurationParams | null>(null);

  readonly #bulkConfigureJltMaoResource = httpResource<JltMaoBulkConfigurationResponse>(() => {
    const params = this.#bulkConfigureJltMaoParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'jlt-mao', 'bulk-configuration'),
      method: 'POST',
      body: params.body,
    };
  });

  async bulkConfigureJltMao(
    fireTrialId: FireTrial['id'],
    body: JltMaoBulkConfigurationRequest,
  ): Promise<JltMaoBulkConfigurationResponse> {
    this.#bulkConfigureJltMaoParams.set({ fireTrialId, body });
    return awaitResourceValue(this.#bulkConfigureJltMaoResource, this.#injector);
  }
}
