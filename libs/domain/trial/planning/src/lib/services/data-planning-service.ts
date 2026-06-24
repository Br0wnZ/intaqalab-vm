import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectApiUrl, injectPlanningEndpoint, injectWharehouseEndpoint } from '@intaqalab/config';
import type { PaginatedApiResponse } from '@intaqalab/models';
import type { Observable } from 'rxjs';

import type {
  CatalogQueryParams,
  WarehouseDenominationItem,
  WarehousePaginatedResponse,
} from '../utils-models/catalog.model';
import { SpecimenType } from '../utils-models/specimen.model';
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
  readonly #warehouseUrl = injectWharehouseEndpoint();
  readonly #specimenTrigger = signal<number>(0);
  readonly #weaponsParams = signal<CatalogQueryParams | null>(null);
  readonly #tubesParams = signal<CatalogQueryParams | null>(null);
  readonly #denominationsParams = signal<CatalogQueryParams | null>(null);
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

  readonly weaponsResource = httpResource<PaginatedApiResponse<SpecimenApiResponse>>(() => {
    const params = this.#weaponsParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/weapons`,
      params: this.#buildQueryParams({ pageSize: 100, ...params }),
      method: 'GET',
    };
  });

  readonly tubesResource = httpResource<PaginatedApiResponse<SpecimenApiResponse>>(() => {
    const params = this.#tubesParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/tubes`,
      params: this.#buildQueryParams({ pageSize: 100, ...params }),
      method: 'GET',
    };
  });

  readonly denominationsResource = httpResource<WarehousePaginatedResponse<WarehouseDenominationItem>>(() => {
    const params = this.#denominationsParams();
    if (!params) return undefined;

    return {
      url: `${this.#warehouseUrl}/denominations`,
      params: this.#buildQueryParams({ pageSize: 100, ...params }),
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

  getSpecimensByType(specimenType: SpecimenType, params: CatalogQueryParams = {}): void {
    if (specimenType === SpecimenType.Weapon) {
      this.#weaponsParams.set(params);
      return;
    }

    if (specimenType === SpecimenType.Tube) {
      this.#tubesParams.set(params);
      return;
    }

    this.#denominationsParams.set(params);
  }

  getUsers() {
    this.#usersTrigger.update((n) => n + 1);
  }

  refreshSpecimens(): void {
    this.#specimenTrigger.set(0);
    this.#weaponsParams.set(null);
    this.#tubesParams.set(null);
    this.#denominationsParams.set(null);
  }

  refreshUsers(): void {
    this.#usersTrigger.set(0);
  }

  #buildQueryParams(params: CatalogQueryParams): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};
    if (params.name) result['name'] = params.name;
    if (params.page !== undefined) result['page'] = params.page;
    if (params.pageSize !== undefined) result['pageSize'] = params.pageSize;
    if (params.active !== undefined) result['active'] = params.active;
    if (params.sort?.length) result['sort'] = params.sort.join(',');
    if (params.munitionTypeId) result['munitionTypeId'] = params.munitionTypeId;
    return result;
  }
}
