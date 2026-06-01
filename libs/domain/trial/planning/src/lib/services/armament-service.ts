import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  ArmamentBulkUpdateRequest,
  SeriesArmamentData,
  TrialArmamentResponse,
} from '../utils-models/armament.model';
import type { CatalogQueryParams, SpecimenItem, SpecimenListResponse } from '../utils-models/catalog.model';

export type { ArmamentBulkUpdateRequest, SeriesArmamentData, SpecimenItem, TrialArmamentResponse };
export type { CatalogQueryParams, SpecimenListResponse };

@Injectable({
  providedIn: 'root',
})
export class ArmamentService {
  readonly #getArmamentParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateArmamentParams = signal<{ trialId: FireTrial['id']; body: ArmamentBulkUpdateRequest } | null>(null);

  readonly #getWeaponsParams = signal<CatalogQueryParams | null>(null);
  readonly #getTubesParams = signal<CatalogQueryParams | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly armamentResource = httpResource<TrialArmamentResponse>(() => {
    const params = this.#getArmamentParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/armament`,
      method: 'GET',
    };
  });

  readonly updateArmamentResource = httpResource<void>(() => {
    const params = this.#updateArmamentParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/armament`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly weaponsResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#getWeaponsParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/weapons${queryParams}`,
      method: 'GET',
    };
  });

  readonly tubesResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#getTubesParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/tubes${queryParams}`,
      method: 'GET',
    };
  });

  getArmament(trialId: FireTrial['id']) {
    this.#getArmamentParams.set({ trialId });
  }

  updateArmament(trialId: FireTrial['id'], body: ArmamentBulkUpdateRequest) {
    this.#updateArmamentParams.set({ trialId, body });
  }

  resetUpdateArmament() {
    this.#updateArmamentParams.set(null);
  }

  getWeapons(params: CatalogQueryParams = {}) {
    this.#getWeaponsParams.set(params);
  }

  getTubes(params: CatalogQueryParams = {}) {
    this.#getTubesParams.set(params);
  }

  #buildQueryParams(params: CatalogQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.name) {
      searchParams.set('name', params.name);
    }
    if (params.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      searchParams.set('pageSize', params.pageSize.toString());
    }
    if (params.active !== undefined) {
      searchParams.set('active', params.active.toString());
    }
    if (params.sort?.length) {
      params.sort.forEach((s) => searchParams.append('sort', s));
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
