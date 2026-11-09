import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import { PlanningArmamentService } from '@intaqalab/data-access-planning';
import type { FireTrial } from '@intaqalab/models';
import { actionTrigger } from '@intaqalab/utils';
import { firstValueFrom } from 'rxjs';

import type {
  ArmamentBulkConfigurationRequest,
  PlanningArmamentResponse,
  ShotArmamentRequest,
  ShotArmamentResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface ShotArmamentParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

interface ShotArmamentUpdateParams extends ShotArmamentParams {
  body: ShotArmamentRequest;
}

interface ArmamentBulkConfigurationParams {
  fireTrialId: FireTrial['id'];
  body: ArmamentBulkConfigurationRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ShotArmamentService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #planningArmamentService = inject(PlanningArmamentService);
  readonly #executionUrl = injectExecutionEndpoint();

  async fetchPlanningArmament(fireTrialId: FireTrial['id']): Promise<PlanningArmamentResponse> {
    return this.#planningArmamentService.fetchArmament(fireTrialId);
  }

  readonly #fetchShotArmamentParams = signal<ShotArmamentParams | null>(null);

  readonly #fetchShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const p = this.#fetchShotArmamentParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, p.fireTrialId, 'armament', 'series', p.seriesId, 'shots', p.shotId),
      method: 'GET',
    };
  });

  async fetchShotArmament(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotArmamentResponse> {
    this.#fetchShotArmamentParams.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShotArmamentResource, this.#injector);
  }

  readonly #updateShotArmamentParams = signal<ShotArmamentUpdateParams | null>(null);

  readonly updateShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const params = this.#updateShotArmamentParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'armament',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'PUT',
      body: params.body,
    };
  });

  setShotArmament(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotArmamentRequest): void {
    this.#updateShotArmamentParams.set({ fireTrialId, seriesId, shotId, body });
  }

  async updateShotArmament(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotArmamentRequest,
  ): Promise<ShotArmamentResponse> {
    return firstValueFrom(
      this.#http.put<ShotArmamentResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'armament', 'series', seriesId, 'shots', shotId),
        body,
      ),
    );
  }

  readonly #applyArmamentBulkConfigurationParams = actionTrigger<ArmamentBulkConfigurationParams>();

  readonly applyArmamentBulkConfigurationResource = httpResource<void>(() => {
    const params = this.#applyArmamentBulkConfigurationParams.value();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'armament', 'bulk-configuration'),
      method: 'POST',
      body: params.body,
    };
  });

  applyArmamentBulkConfiguration(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): void {
    this.#applyArmamentBulkConfigurationParams.fire({ fireTrialId, body });
  }
}
