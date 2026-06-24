import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
  injectMunitionComponentTypesEndpoint,
  injectMunitionDenominationsEndpoint,
  injectPlanningEndpoint,
  injectWharehouseEndpoint,
} from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  CatalogQueryParams,
  MasterDataI18nItem,
  MasterDataI18nUpdateRequest,
  MasterDataIItem,
  MasterDataIItemListResponse,
  MasterDataIItemUpdateRequest,
  WarehouseDenominationItem,
  WarehouseMunitionTypeItem,
  WarehousePaginatedResponse,
} from '../utils-models/catalog.model';
import type {
  MunitionBulkUpdateRequest,
  MunitionComponent,
  MunitionComponentRequest,
  MunitionComponentType,
  MunitionConfigRequest,
  MunitionConfigResponse,
  MunitionDenomination,
  ReconditioningData,
  SeriesMunitionsData,
  TrialMunitionsRawItem,
  TrialMunitionsResponse,
} from '../utils-models/munitions.model';

export type {
  CatalogQueryParams,
  MasterDataI18nItem,
  MasterDataI18nUpdateRequest,
  MasterDataIItem,
  MasterDataIItemListResponse,
  MasterDataIItemUpdateRequest,
  MunitionBulkUpdateRequest,
  MunitionComponent,
  MunitionComponentRequest,
  MunitionComponentType,
  MunitionConfigRequest,
  MunitionConfigResponse,
  MunitionDenomination,
  ReconditioningData,
  SeriesMunitionsData,
  TrialMunitionsRawItem,
  TrialMunitionsResponse,
  WarehouseDenominationItem,
  WarehouseMunitionTypeItem,
  WarehousePaginatedResponse,
};

@Injectable({
  providedIn: 'root',
})
export class MunitionsService {
  readonly #getMunitionsParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateMunitionsParams = signal<{ trialId: FireTrial['id']; body: MunitionBulkUpdateRequest } | null>(null);

  readonly #getComponentTypesParams = signal<CatalogQueryParams | null>(null);
  readonly #createComponentTypeParams = signal<MasterDataI18nUpdateRequest | null>(null);
  readonly #updateComponentTypeParams = signal<{ id: string; body: MasterDataI18nUpdateRequest } | null>(null);
  readonly #deleteComponentTypeParams = signal<{ id: string } | null>(null);

  readonly #getDenominationsParams = signal<CatalogQueryParams | null>(null);
  readonly #createDenominationParams = signal<MasterDataI18nUpdateRequest | null>(null);
  readonly #updateDenominationParams = signal<{ id: string; body: MasterDataI18nUpdateRequest } | null>(null);
  readonly #deleteDenominationParams = signal<{ id: string } | null>(null);

  readonly #getFuseWorkingModesParams = signal<CatalogQueryParams | null>(null);
  readonly #createFuseWorkingModeParams = signal<MasterDataIItemUpdateRequest | null>(null);
  readonly #updateFuseWorkingModeParams = signal<{ id: string; body: MasterDataIItemUpdateRequest } | null>(null);
  readonly #deleteFuseWorkingModeParams = signal<{ id: string } | null>(null);

  // ─── URLs inyectadas desde el sistema de entorno ─────────────────────────
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #warehouseUrl = injectWharehouseEndpoint();
  readonly #componentTypesUrl = injectMunitionComponentTypesEndpoint();
  readonly #denominationsUrl = injectMunitionDenominationsEndpoint();
  readonly #fuseWorkingModesUrl = `${this.#planningUrl}/fuse-working-modes`;

  // ─── Resources ───────────────────────────────────────────────────────────

  readonly munitionsResource = httpResource<TrialMunitionsResponse>(
    () => {
      const params = this.#getMunitionsParams();
      if (!params) return undefined;
      return {
        url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/munitions`,
        method: 'GET',
      };
    },
    {
      defaultValue: { series: [] },
      parse: (raw): TrialMunitionsResponse => {
        const normalizeSeries = (series: SeriesMunitionsData[]): SeriesMunitionsData[] =>
          series.map((serie) => ({
            ...serie,
            configurations: (serie.configurations ?? []).map((config) => ({
              ...config,
              munitionTypeId: config.munitionTypeId ?? null,
              components: (config.components ?? []).map((component) => ({
                ...component,
                munitionTypeId: component.munitionTypeId ?? null,
              })),
            })),
          }));

        if (Array.isArray(raw)) {
          const allSeries = (raw as TrialMunitionsRawItem[]).flatMap((item) => item.series ?? []);
          return { series: normalizeSeries(allSeries) };
        }
        if (raw && typeof raw === 'object' && 'series' in raw) {
          const parsed = raw as TrialMunitionsResponse;
          return { series: normalizeSeries(parsed.series ?? []) };
        }
        return { series: [] };
      },
    },
  );

  readonly updateMunitionsResource = httpResource<void>(() => {
    const params = this.#updateMunitionsParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/munitions`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly componentTypesResource = httpResource<WarehousePaginatedResponse<WarehouseMunitionTypeItem>>(() => {
    const params = this.#getComponentTypesParams();
    if (!params) return undefined;
    const queryParams = this.#buildQueryParams({ ...params, active: true });
    return {
      url: `${this.#warehouseUrl}/munition-types`,
      params: { pageSize: 100, ...queryParams },
      method: 'GET',
    };
  });

  readonly createComponentTypeResource = httpResource<MasterDataI18nItem>(() => {
    const body = this.#createComponentTypeParams();
    if (!body) return undefined;
    return {
      url: this.#componentTypesUrl,
      method: 'POST',
      body,
    };
  });

  readonly updateComponentTypeResource = httpResource<MasterDataI18nItem>(() => {
    const params = this.#updateComponentTypeParams();
    if (!params) return undefined;
    return {
      url: `${this.#componentTypesUrl}/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteComponentTypeResource = httpResource<void>(() => {
    const params = this.#deleteComponentTypeParams();
    if (!params) return undefined;
    return {
      url: `${this.#componentTypesUrl}/${params.id}`,
      method: 'DELETE',
    };
  });

  readonly denominationsResource = httpResource<WarehousePaginatedResponse<WarehouseDenominationItem>>(() => {
    const params = this.#getDenominationsParams();
    if (!params) return undefined;
    const queryParams: Record<string, string | number | boolean> = { pageSize: 100 };
    if (params.active !== undefined) queryParams['active'] = params.active;
    if (params.munitionTypeId) queryParams['munitionTypeId'] = params.munitionTypeId;
    return {
      url: `${this.#warehouseUrl}/denominations`,
      params: queryParams,
      method: 'GET',
    };
  });

  readonly createDenominationResource = httpResource<MasterDataI18nItem>(() => {
    const body = this.#createDenominationParams();
    if (!body) return undefined;
    return {
      url: this.#denominationsUrl,
      method: 'POST',
      body,
    };
  });

  readonly updateDenominationResource = httpResource<MasterDataI18nItem>(() => {
    const params = this.#updateDenominationParams();
    if (!params) return undefined;
    return {
      url: `${this.#denominationsUrl}/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteDenominationResource = httpResource<void>(() => {
    const params = this.#deleteDenominationParams();
    if (!params) return undefined;
    return {
      url: `${this.#denominationsUrl}/${params.id}`,
      method: 'DELETE',
    };
  });

  readonly fuseWorkingModesResource = httpResource<MasterDataIItemListResponse>(() => {
    const params = this.#getFuseWorkingModesParams();
    if (!params) return undefined;
    const { active: _ignoredActive, ...restParams } = params;
    const queryParams = this.#buildQueryParams({
      page: 1,
      pageSize: 10,
      active: true,
      ...restParams,
    });
    return {
      url: this.#fuseWorkingModesUrl,
      params: queryParams,
      method: 'GET',
    };
  });

  readonly createFuseWorkingModeResource = httpResource<MasterDataIItem>(() => {
    const body = this.#createFuseWorkingModeParams();
    if (!body) return undefined;
    return {
      url: this.#fuseWorkingModesUrl,
      method: 'POST',
      body,
    };
  });

  readonly updateFuseWorkingModeResource = httpResource<MasterDataIItem>(() => {
    const params = this.#updateFuseWorkingModeParams();
    if (!params) return undefined;
    return {
      url: `${this.#fuseWorkingModesUrl}/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteFuseWorkingModeResource = httpResource<void>(() => {
    const params = this.#deleteFuseWorkingModeParams();
    if (!params) return undefined;
    return {
      url: `${this.#fuseWorkingModesUrl}/${params.id}`,
      method: 'DELETE',
    };
  });

  // ─── Métodos públicos ─────────────────────────────────────────────────────

  getMunitions(trialId: FireTrial['id']) {
    this.#getMunitionsParams.set({ trialId });
  }
  updateMunitions(trialId: FireTrial['id'], body: MunitionBulkUpdateRequest) {
    this.#updateMunitionsParams.set({ trialId, body });
  }
  resetUpdateMunitions() {
    this.#updateMunitionsParams.set(null);
  }

  getComponentTypes(params: CatalogQueryParams = {}) {
    this.#getComponentTypesParams.set(params);
  }
  createComponentType(request: MasterDataI18nUpdateRequest) {
    this.#createComponentTypeParams.set(request);
  }
  updateComponentType(id: string, body: MasterDataI18nUpdateRequest) {
    this.#updateComponentTypeParams.set({ id, body });
  }
  deleteComponentType(id: string) {
    this.#deleteComponentTypeParams.set({ id });
  }
  resetCreateComponentType() {
    this.#createComponentTypeParams.set(null);
  }
  resetUpdateComponentType() {
    this.#updateComponentTypeParams.set(null);
  }
  resetDeleteComponentType() {
    this.#deleteComponentTypeParams.set(null);
  }

  getDenominations(params: CatalogQueryParams = {}) {
    this.#getDenominationsParams.set(params);
  }
  createDenomination(request: MasterDataI18nUpdateRequest) {
    this.#createDenominationParams.set(request);
  }
  updateDenomination(id: string, body: MasterDataI18nUpdateRequest) {
    this.#updateDenominationParams.set({ id, body });
  }
  deleteDenomination(id: string) {
    this.#deleteDenominationParams.set({ id });
  }
  resetCreateDenomination() {
    this.#createDenominationParams.set(null);
  }
  resetUpdateDenomination() {
    this.#updateDenominationParams.set(null);
  }
  resetDeleteDenomination() {
    this.#deleteDenominationParams.set(null);
  }

  getFuseWorkingModes(params: CatalogQueryParams = {}) {
    this.#getFuseWorkingModesParams.set(params);
  }
  createFuseWorkingMode(request: MasterDataIItemUpdateRequest) {
    this.#createFuseWorkingModeParams.set(request);
  }
  updateFuseWorkingMode(id: string, body: MasterDataIItemUpdateRequest) {
    this.#updateFuseWorkingModeParams.set({ id, body });
  }
  deleteFuseWorkingMode(id: string) {
    this.#deleteFuseWorkingModeParams.set({ id });
  }
  resetCreateFuseWorkingMode() {
    this.#createFuseWorkingModeParams.set(null);
  }
  resetUpdateFuseWorkingMode() {
    this.#updateFuseWorkingModeParams.set(null);
  }
  resetDeleteFuseWorkingMode() {
    this.#deleteFuseWorkingModeParams.set(null);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  #buildQueryParams(params: CatalogQueryParams): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    if (params.name) result['name'] = params.name;
    if (params.page !== undefined) result['page'] = params.page;
    if (params.pageSize !== undefined) result['pageSize'] = params.pageSize;
    if (params.active !== undefined) result['active'] = params.active;
    // httpResource acepta arrays en params, no necesitamos URLSearchParams
    if (params.sort?.length) result['sort'] = params.sort.join(',');
    return result;
  }
}
