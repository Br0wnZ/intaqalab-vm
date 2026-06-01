import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectApiUrl, injectPlanningEndpoint } from '@intaqalab/config';
import type { PaginatedApiResponse } from '@intaqalab/models';
import type { Observable } from 'rxjs';

import type { SpecimenApiResponse } from '../utils-models/specimen.model';
import type { TrialPlanningInfo, UpsertTrialPlanningInfo } from '../utils-models/trial-planing-info.model';

interface PlanningDataApiResponse {
  id: number;
  observation: string;
  trialId: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataPlanningService {
  readonly #httpClient = inject(HttpClient);
  readonly #baseUrl = injectApiUrl();
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #specimenTrigger = signal<number>(0);
  readonly #usersTrigger = signal<number>(0);
  readonly #getPlanningDataParams = signal<{ fireTrialId: string } | null>(null);
  readonly #updatePlanningDataParams = signal<(UpsertTrialPlanningInfo & { fireTrialId: string }) | null>(null);

  loadGeneralData(trialId: string): Observable<PlanningDataApiResponse> {
    return this.#httpClient.get<PlanningDataApiResponse>(`${this.#baseUrl}/planning-general-data/${trialId}`);
  }

  readonly getPlanningDataResource = httpResource<TrialPlanningInfo>(() => {
    const params = this.#getPlanningDataParams();
    if (params === null) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/info`,
      method: 'GET',
    };
  });

  readonly updatePlanningDataResource = httpResource<TrialPlanningInfo>(() => {
    const body = this.#updatePlanningDataParams();
    if (!body) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${body.fireTrialId}/planning/info`,
      method: 'PUT',
      body,
    };
  });

  readonly specimenResource = httpResource<PaginatedApiResponse<SpecimenApiResponse>>(() => {
    const trigger = this.#specimenTrigger();
    if (trigger === 0) return undefined;

    return {
      url: `${this.#planningUrl}/specimens?pageSize=100`,
      method: 'GET',
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly usersResource = httpResource<any>(() => {
    const trigger = this.#usersTrigger();
    if (trigger === 0) return undefined;

    return {
      url: `${this.#planningUrl}/planning-users`,
      method: 'GET',
    };
  });

  getFireTrialPlanningInfo(fireTrialId: string): void {
    this.#getPlanningDataParams.set({ fireTrialId });
  }

  updateTrialPlanningInfoData(data: UpsertTrialPlanningInfo & { fireTrialId: string }): void {
    this.#updatePlanningDataParams.set(data);
  }

  getSpecimens() {
    this.#specimenTrigger.update((n) => n + 1);
  }

  getUsers() {
    this.#usersTrigger.update((n) => n + 1);
  }

  refreshSpecimens(): void {
    this.#specimenTrigger.set(0);
  }

  refreshUsers(): void {
    this.#usersTrigger.set(0);
  }
}
