import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  MunitionConditioningBulkConfigurationRequest,
  MunitionConditioningBulkConfigurationResponse,
  ShotMunitionRequest,
  ShotMunitionResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotMunitionParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotMunitionUpdateParams extends ShotMunitionParams {
  body: ShotMunitionRequest;
}

interface MunitionConditioningBulkConfigurationParams {
  fireTrialId: FireTrial['id'];
  body: MunitionConditioningBulkConfigurationRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotMunitionService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly shotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#getShotMunitionParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'munitions',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMunitionParams.set({ fireTrialId, seriesId, shotId });
  }

  readonly #fetchShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly #fetchShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const p = this.#fetchShotMunitionParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, p.fireTrialId, 'munitions', 'series', p.seriesId, 'shots', p.shotId),
      method: 'GET',
    };
  });

  async fetchShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMunitionResponse> {
    this.#fetchShotMunitionParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotMunitionResource, this.#injector);
  }

  readonly #updateShotMunitionParams = signal<ShotMunitionUpdateParams | null>(null);

  readonly updateShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#updateShotMunitionParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'munitions',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotMunitionRequest): void {
    this.#updateShotMunitionParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMunitionRequest,
  ): Promise<ShotMunitionResponse> {
    return firstValueFrom(
      this.#http.put<ShotMunitionResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'munitions', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }

  readonly #applyMunitionConditioningBulkConfigurationParams =
    signal<MunitionConditioningBulkConfigurationParams | null>(null);

  readonly applyMunitionConditioningBulkConfigurationResource =
    httpResource<MunitionConditioningBulkConfigurationResponse>(() => {
      const params = this.#applyMunitionConditioningBulkConfigurationParams();
      if (!params) return undefined;
      return {
        url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'munitions', 'bulk-configuration'),
        method: 'POST',
        body: params.body,
      };
    });

  async applyMunitionConditioningBulkConfiguration(
    fireTrialId: FireTrial['id'],
    body: MunitionConditioningBulkConfigurationRequest,
  ): Promise<MunitionConditioningBulkConfigurationResponse> {
    this.#applyMunitionConditioningBulkConfigurationParams.set({ fireTrialId, body });
    return awaitResourceValue(this.applyMunitionConditioningBulkConfigurationResource, this.#injector);
  }
}
