import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  CatalogQueryParams,
  MasterDataIItem,
  MasterDataIItemUpdateRequest,
  MasterDataMeasureItem,
  MasterDataMeasureListResponse,
  MeasuresCatalogQueryParams,
  MeasuresMasterDataIItem,
  MeasuresMasterDataIItemListResponse,
} from '../utils-models/catalog.model';
import type { MeasuresBulkUpdateRequest, TrialMeasuresResponse } from '../utils-models/measures.model';

export type {
  CatalogQueryParams,
  MasterDataIItem,
  MasterDataIItemUpdateRequest,
  MeasuresBulkUpdateRequest,
  MeasuresMasterDataIItem,
  MeasuresMasterDataIItemListResponse,
  TrialMeasuresResponse,
  MasterDataMeasureItem,
  MasterDataMeasureListResponse,
  MeasuresCatalogQueryParams,
};

@Injectable({
  providedIn: 'root',
})
export class MeasuresService {
  readonly #getMeasuresParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateMeasuresParams = signal<{ trialId: FireTrial['id']; body: MeasuresBulkUpdateRequest } | null>(null);

  readonly #getMeasuresCatalogParams = signal<MeasuresCatalogQueryParams | null>(null);

  readonly #createMeasureParams = signal<MasterDataIItemUpdateRequest | null>(null);
  readonly #updateMeasureParams = signal<{ id: string; body: MasterDataIItemUpdateRequest } | null>(null);
  readonly #deleteMeasureParams = signal<{ id: string } | null>(null);

  readonly #addFavoriteParams = signal<{ id: string } | null>(null);
  readonly #removeFavoriteParams = signal<{ id: string } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  // --- Planning Endpoints ---

  readonly measuresResource = httpResource<TrialMeasuresResponse>(() => {
    const params = this.#getMeasuresParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/measures`,
      method: 'GET',
    };
  });

  readonly updateMeasuresResource = httpResource<void>(() => {
    const params = this.#updateMeasuresParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/measures`,
      method: 'PUT',
      body: params.body,
    };
  });

  // --- Catalog Endpoints ---

  readonly measuresCatalogResource = httpResource<MasterDataMeasureListResponse>(() => {
    const params = this.#getMeasuresCatalogParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/measures${queryParams}`,
      method: 'GET',
    };
  });

  readonly createMeasureResource = httpResource<MasterDataIItem>(() => {
    const body = this.#createMeasureParams();
    if (!body) return undefined;

    return {
      url: `${this.#planningUrl}/measures`,
      method: 'POST',
      body,
    };
  });

  readonly updateMeasureResource = httpResource<MasterDataIItem>(() => {
    const params = this.#updateMeasureParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/measures/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteMeasureResource = httpResource<void>(() => {
    const params = this.#deleteMeasureParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/measures/${params.id}`,
      method: 'DELETE',
    };
  });

  readonly addFavoriteResource = httpResource<void>(() => {
    const params = this.#addFavoriteParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/measures/${params.id}/favorite`,
      method: 'POST',
      body: {},
    };
  });

  readonly removeFavoriteResource = httpResource<void>(() => {
    const params = this.#removeFavoriteParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/measures/${params.id}/favorite`,
      method: 'DELETE',
    };
  });

  // --- Public Methods ---

  getMeasures(trialId: FireTrial['id']) {
    this.#getMeasuresParams.set({ trialId });
  }

  updateMeasures(trialId: FireTrial['id'], body: MeasuresBulkUpdateRequest) {
    this.#updateMeasuresParams.set({ trialId, body });
  }

  resetUpdateMeasures() {
    this.#updateMeasuresParams.set(null);
  }

  getMeasuresCatalog(params: MeasuresCatalogQueryParams = {}) {
    this.#getMeasuresCatalogParams.set(params);
  }

  createMeasure(request: MasterDataIItemUpdateRequest) {
    this.#createMeasureParams.set(request);
  }

  updateMeasure(id: string, body: MasterDataIItemUpdateRequest) {
    this.#updateMeasureParams.set({ id, body });
  }

  deleteMeasure(id: string) {
    this.#deleteMeasureParams.set({ id });
  }

  resetCreateMeasure() {
    this.#createMeasureParams.set(null);
  }

  resetUpdateMeasure() {
    this.#updateMeasureParams.set(null);
  }

  resetDeleteMeasure() {
    this.#deleteMeasureParams.set(null);
  }

  addFavorite(id: string) {
    this.#addFavoriteParams.set({ id });
  }

  removeFavorite(id: string) {
    this.#removeFavoriteParams.set({ id });
  }

  resetAddFavorite() {
    this.#addFavoriteParams.set(null);
  }

  resetRemoveFavorite() {
    this.#removeFavoriteParams.set(null);
  }

  #buildQueryParams = (p: MeasuresCatalogQueryParams) =>
    `?${new URLSearchParams(
      Object.entries({ ...p, pageSize: 100 }).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((i) => [k, i]) : v !== null && v !== undefined ? [[k, String(v)]] : [],
      ) as [string, string][],
    ).toString()}`;
}
