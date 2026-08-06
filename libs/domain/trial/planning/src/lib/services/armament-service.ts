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
  familyId?: number;
  active?: boolean;
};

type EquipmentDenominationsResponse = {
  page?: number;
  pageSize?: number;
  totalElements: number;
  items: EquipmentDenominationApiItem[];
};

/** Item físico de equipamiento devuelto por `/equipment/items` (unidad real, no denominación/familia). */
type EquipmentItemApiItem = {
  id: string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
};

type EquipmentItemsResponse = {
  page?: number;
  pageSize?: number;
  totalElements: number;
  items: EquipmentItemApiItem[];
};

type SpecimenItem = {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MORTAR' | 'BUNDLE' | 'MUNITION';
  active: boolean;
  familyId?: number;
};

/** Parámetros para el resource de denominaciones arma: itemType obligatorio */
type WeaponDenominationParams = {
  itemType: string;
};

/** Parámetros para el resource de denominaciones tubo: siempre TUBE + familyId del arma seleccionada */
type TubeDenominationParams = {
  familyId: number;
};

@Injectable({
  providedIn: 'root',
})
export class ArmamentService {
  readonly #getArmamentParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateArmamentTrigger = actionTrigger<{ trialId: FireTrial['id']; body: ArmamentBulkUpdateRequest }>();

  // Legacy catalog signals (mantenidos por compatibilidad con loadAllCatalogs)
  readonly #getWeaponsParams = signal<CatalogQueryParams | null>(null);
  readonly #getTubesParams = signal<CatalogQueryParams | null>(null);

  // Nuevos signals reactivos para denominaciones en cascada
  readonly #weaponDenominationParams = signal<WeaponDenominationParams | null>(null);
  readonly #tubeDenominationParams = signal<TubeDenominationParams | null>(null);

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

  // Legacy: carga inicial de catálogos sin filtro
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
      parse: (raw: unknown) => this.#mapEquipmentDenominationsResponse(raw, 'TUBE'),
    };
  });

  /**
   * Resource reactivo para denominaciones de arma filtrado por itemType.
   * Se activa cuando se selecciona un tipo en el campo Tipo.
   * URL: GET /centers/{centerId}/equipment/denominations?itemType={itemType}
   */
  readonly weaponDenominationsResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#weaponDenominationParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams({ itemType: params.itemType });
    return {
      url: `${this.#planningUrl}/equipment/denominations${queryParams}`,
      method: 'GET',
      parse: (raw: unknown) => this.#mapEquipmentDenominationsResponse(raw, params.itemType as SpecimenItem['type']),
    };
  });

  /**
   * Resource reactivo para equipos físicos de tubo filtrado por familyId del arma seleccionada.
   * Se activa cuando se selecciona un arma.
   * URL: GET /centers/{centerId}/equipment/items?itemType=TUBE&familyId={familyId}
   */
  readonly tubeDenominationsResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#tubeDenominationParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams({ itemType: 'TUBE', familyId: params.familyId });
    return {
      url: `${this.#planningUrl}/equipment/items${queryParams}`,
      method: 'GET',
      parse: (raw: unknown) => this.#mapEquipmentItemsResponse(raw),
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

  /**
   * Carga denominaciones de arma filtradas por itemType.
   * @param itemType Tipo seleccionado (WEAPON, MORTAR, BUNDLE)
   */
  loadWeaponDenominations(itemType: string): void {
    this.#weaponDenominationParams.set({ itemType });
  }

  /**
   * Limpia el resource de denominaciones de arma.
   */
  clearWeaponDenominations(): void {
    this.#weaponDenominationParams.set(null);
  }

  /**
   * Carga equipos físicos de tubo filtrados por familyId del arma seleccionada.
   * @param familyId ID de familia devuelto por la selección del arma
   */
  loadTubeDenominations(familyId: number): void {
    this.#tubeDenominationParams.set({ familyId });
  }

  /**
   * Limpia el resource de equipos de tubo.
   */
  clearTubeDenominations(): void {
    this.#tubeDenominationParams.set(null);
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
        familyId: item.familyId,
      })),
    };
  }

  #mapEquipmentItemsResponse(raw: unknown): SpecimenListResponse {
    const response = raw as EquipmentItemsResponse;

    return {
      page: response.page ?? 0,
      pageSize: response.pageSize ?? response.items.length,
      totalElements: response.totalElements ?? response.items.length,
      items: (response.items ?? []).map((item) => ({
        id: String(item.id),
        name: item.modelName,
        modelName: item.modelName,
        type: 'TUBE',
        active: true,
      })),
    };
  }
}
