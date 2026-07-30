import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { actionTrigger } from '@intaqalab/utils';

import type {
    ArmamentBulkUpdateRequest,
    SeriesArmamentData,
    TrialArmamentResponse,
} from '../utils-models/armament.model';
import type { CatalogQueryParams, SpecimenListResponse } from '../utils-models/catalog.model';

export type { ArmamentBulkUpdateRequest, CatalogQueryParams, SeriesArmamentData, SpecimenItem, SpecimenListResponse, TrialArmamentResponse };

type EquipmentDenominationApiItem = {
  id: number | string;
  name: string;
  itemType?: 'WEAPON' | 'TUBE' | 'MORTAR' | 'BUNDLE';
  active?: boolean;
};

type EquipmentDenominationsResponse = {
  page?: number;
  pageSize?: number;
  totalElements: number;
  items: EquipmentDenominationApiItem[];
};

type SpecimenItem = {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MORTAR' | 'BUNDLE' | 'MUNITION';
  active: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class ArmamentService {
  readonly #getArmamentParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateArmamentTrigger = actionTrigger<{ trialId: FireTrial['id']; body: ArmamentBulkUpdateRequest }>();

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
    const params = this.#updateArmamentTrigger.value();
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

    const queryParams = this.#buildQueryParams({ ...params, itemType: 'WEAPON' });
    return {
      url: `${this.#planningUrl}/equipment/denominations${queryParams}`,
      method: 'GET',
      parse: (raw) => this.#mapEquipmentDenominationsResponse(raw, 'WEAPON'),
    };
  });

  readonly tubesResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#getTubesParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams({ ...params, itemType: 'TUBE' });
    return {
      url: `${this.#planningUrl}/equipment/denominations${queryParams}`,
      method: 'GET',
      parse: (raw) => this.#mapEquipmentDenominationsResponse(raw, 'TUBE'),
    };
  });

  getArmament(trialId: FireTrial['id']) {
    this.#getArmamentParams.set({ trialId });
  }

  updateArmament(trialId: FireTrial['id'], body: ArmamentBulkUpdateRequest) {
    this.#updateArmamentTrigger.fire({ trialId, body });
  }

  resetUpdateArmament() {
    this.#updateArmamentTrigger.reset();
  }

  getWeapons(params: CatalogQueryParams = {}) {
    this.#getWeaponsParams.set(params);
  }

  getTubes(params: CatalogQueryParams = {}) {
    this.#getTubesParams.set(params);
  }

  #buildQueryParams(params: CatalogQueryParams & { itemType?: string }): string {
    const searchParams = new URLSearchParams();

    if (params.itemType) {
      searchParams.set('itemType', params.itemType);
    }
    if (params.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      searchParams.set('pageSize', params.pageSize.toString());
    }
    if (params.familyId !== undefined) {
      searchParams.set('familyId', params.familyId.toString());
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  #mapEquipmentDenominationsResponse(raw: unknown, defaultType: SpecimenItem['type']): SpecimenListResponse {
    const response = raw as EquipmentDenominationsResponse;

    return {
      page: response.page ?? 0,
      pageSize: response.pageSize ?? response.items.length,
      totalElements: response.totalElements ?? response.items.length,
      items: (response.items ?? []).map((item) => ({
        id: String(item.id),
        name: item.name,
        type: item.itemType ?? defaultType,
        active: item.active ?? true,
      })),
    };
  }
}
