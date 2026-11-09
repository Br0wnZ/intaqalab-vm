import { HttpClient, HttpContext, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SKIP_ERROR_TOAST, injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  ExecutionTechnicalProfile,
  ProfileReadinessRequest,
  ProfileReadinessSaveResult,
  ProfilesReadinessResponse,
  SeriesReadinessItem,
  SeriesReadinessRequest,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface ReadinessParams {
  fireTrialId: FireTrial['id'];
}

interface SeriesReadinessOneParams {
  fireTrialId: FireTrial['id'];
  profile: ExecutionTechnicalProfile;
  seriesId: string;
  body: SeriesReadinessRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutionReadinessService {
  readonly #http = inject(HttpClient);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getReadinessParams = signal<ReadinessParams | null>(null);

  readonly profilesReadinessResource = httpResource<ProfilesReadinessResponse>(() => {
    const params = this.#getReadinessParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'readiness'),
      method: 'GET',
    };
  });

  getProfilesReadiness(fireTrialId: FireTrial['id']): void {
    this.#getReadinessParams.set({ fireTrialId });
  }

  readonly #setSeriesReadinessOneParams = signal<SeriesReadinessOneParams | null>(null);

  readonly setSeriesReadinessResource = httpResource<SeriesReadinessItem>(() => {
    const p = this.#setSeriesReadinessOneParams();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        p.fireTrialId,
        'readiness',
        'profiles',
        p.profile,
        'series',
        p.seriesId,
      ),
      method: 'PUT',
      body: p.body,
    };
  });

  async setSeriesProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    seriesId: string,
    body: SeriesReadinessRequest,
  ): Promise<SeriesReadinessItem> {
    return firstValueFrom(
      this.#http.put<SeriesReadinessItem>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'readiness', 'profiles', profile, 'series', seriesId),
        body,
        { context: new HttpContext().set(SKIP_ERROR_TOAST, true) },
      ),
    );
  }

  async setProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    bodyOrItems: ProfileReadinessRequest | SeriesReadinessItem[],
  ): Promise<ProfileReadinessSaveResult> {
    const items = Array.isArray(bodyOrItems) ? bodyOrItems : bodyOrItems.seriesReadiness;
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const updatedSeries = await this.setSeriesProfileReadiness(fireTrialId, profile, item.seriesId, {
            isReady: item.isReady,
            observations: item.observations,
          });
          return { status: 'fulfilled' as const, updatedSeries };
        } catch (error) {
          return {
            status: 'rejected' as const,
            failure: { profile, seriesId: item.seriesId, error },
          };
        }
      }),
    );

    return {
      updatedSeries: results.flatMap((result) => (result.status === 'fulfilled' ? [result.updatedSeries] : [])),
      failures: results.flatMap((result) => (result.status === 'rejected' ? [result.failure] : [])),
    };
  }

  resetSetProfileReadiness(): void {
    this.#setSeriesReadinessOneParams.set(null);
  }
}

export type { ExecutionTechnicalProfile, ProfileReadinessSaveResult };
