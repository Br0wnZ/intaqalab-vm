import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { JltPreparationResponse, JltReadinessItem, JltReadinessRequest } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface JltPreparationParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
}

interface JltReadinessParams extends JltPreparationParams {
  body: JltReadinessRequest;
}

interface SelectShotParams {
  fireTrialId: FireTrial['id'];
  shotId: string;
}

interface FireShotParams {
  fireTrialId: FireTrial['id'];
}

@Injectable({
  providedIn: 'root',
})
export class JltPreparationService {
  readonly #http = inject(HttpClient);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getJltPreparationParams = signal<JltPreparationParams | null>(null);

  readonly jltPreparationResource = httpResource<JltPreparationResponse>(() => {
    const params = this.#getJltPreparationParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'jlt-preparation'),
      method: 'GET',
      params: {
        seriesId: params.seriesId,
      },
    };
  });

  getJltPreparation(fireTrialId: FireTrial['id'], seriesId: string): void {
    this.#getJltPreparationParams.set({ fireTrialId, seriesId });
  }

  readonly #setJltReadinessParams = signal<JltReadinessParams | null>(null);

  readonly setJltReadinessResource = httpResource<JltReadinessItem>(() => {
    const params = this.#setJltReadinessParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'jlt-preparation', 'series', params.seriesId),
      method: 'PUT',
      body: params.body,
    };
  });

  setJltReadiness(fireTrialId: FireTrial['id'], seriesId: string, body: JltReadinessRequest): void {
    this.#setJltReadinessParams.set({ fireTrialId, seriesId, body });
  }

  async updateJltReadiness(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    body: JltReadinessRequest,
  ): Promise<JltReadinessItem> {
    return firstValueFrom(
      this.#http.put<JltReadinessItem>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'jlt-preparation', 'series', seriesId),
        body,
      ),
    );
  }

  readonly #selectShotParams = signal<SelectShotParams | null>(null);

  readonly selectShotResource = httpResource<void>(() => {
    const params = this.#selectShotParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        'jlt-preparation',
        'shots',
        params.shotId,
        'active',
      ),
      method: 'POST',
    };
  });

  selectShot(fireTrialId: FireTrial['id'], shotId: string): void {
    this.#selectShotParams.set({ fireTrialId, shotId });
  }

  readonly #fireShotParams = signal<FireShotParams | null>(null);

  readonly fireShotResource = httpResource<void>(() => {
    const params = this.#fireShotParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'jlt-preparation', 'fire'),
      method: 'POST',
    };
  });

  fireShot(fireTrialId: FireTrial['id']): void {
    this.#fireShotParams.set({ fireTrialId });
  }
}
