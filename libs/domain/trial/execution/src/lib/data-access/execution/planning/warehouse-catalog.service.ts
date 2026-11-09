import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { PlanningDenominationOption, WarehouseStockBatch } from '../../../execution/models';
import { isRecord } from '../../shared/unknown-readers';
import { warehouseUrl } from '../shared/execution-endpoints';
import { awaitResource } from '../shared/resource-await';

@Injectable({
  providedIn: 'root',
})
export class WarehouseCatalogService {
  readonly #injector = inject(Injector);
  readonly #warehouseUrl = injectWharehouseEndpoint();

  readonly #componentTypesParams = signal<{ pageSize: number; active: boolean } | null>(null);
  readonly #warehouseDenominationsParams = signal<{
    pageSize: number;
    active: boolean;
    munitionTypeId?: string;
  } | null>(null);
  readonly #availableStockParams = signal<string[] | null>(null);

  readonly componentTypesResource = httpResource<unknown>(() => {
    const params = this.#componentTypesParams();
    if (!params) return undefined;
    return {
      url: warehouseUrl(this.#warehouseUrl, 'munition-types'),
      params: { pageSize: params.pageSize, active: params.active },
      method: 'GET',
    };
  });

  readonly warehouseDenominationsResource = httpResource<unknown>(() => {
    const params = this.#warehouseDenominationsParams();
    if (!params) return undefined;
    const queryParams: Record<string, string | number | boolean> = {
      pageSize: params.pageSize,
      active: params.active,
    };
    if (params.munitionTypeId) {
      queryParams['munitionTypeId'] = params.munitionTypeId;
    }
    return {
      url: warehouseUrl(this.#warehouseUrl, 'denominations'),
      params: queryParams,
      method: 'GET',
    };
  });

  readonly #availableStockResource = httpResource<unknown>(() => {
    const denominationIds = this.#availableStockParams();
    if (!denominationIds?.length) return undefined;

    let params = new HttpParams().set('page', 1).set('pageSize', 200).set('sort', 'createdAt;desc');
    denominationIds.forEach((denominationId) => {
      params = params.append('denominationIds', denominationId);
    });

    return {
      url: warehouseUrl(this.#warehouseUrl, 'stock'),
      params,
      method: 'GET',
    };
  });

  loadComponentTypes(): void {
    this.#componentTypesParams.set({ pageSize: 100, active: true });
  }

  loadWarehouseDenominations(munitionTypeId?: string): void {
    this.#warehouseDenominationsParams.set({
      pageSize: 100,
      active: true,
      munitionTypeId: munitionTypeId?.trim() || undefined,
    });
  }

  async fetchAvailableStockBatches(denominationIds: string[]): Promise<WarehouseStockBatch[]> {
    const uniqueDenominationIds = [...new Set(denominationIds.filter(Boolean))];
    if (uniqueDenominationIds.length === 0) return [];

    this.#availableStockParams.set(uniqueDenominationIds);
    await awaitResource(this.#availableStockResource, this.#injector);
    return this.#catalogItems(this.#availableStockResource.value()).flatMap((item) => {
      const denomination = item['denomination'];
      const batch = item['batch'];
      if (!isRecord(denomination) || typeof denomination['id'] !== 'string' || typeof batch !== 'string' || !batch) {
        return [];
      }
      return [{ denominationId: denomination['id'], batch }];
    });
  }

  async fetchWarehouseDenominations(munitionTypeId?: string): Promise<PlanningDenominationOption[]> {
    this.loadWarehouseDenominations(munitionTypeId);
    await awaitResource(this.warehouseDenominationsResource, this.#injector);
    const catalog = this.#catalogItems(this.warehouseDenominationsResource.value());
    const denominations: PlanningDenominationOption[] = [];

    catalog.forEach((item) => {
      if (!isRecord(item) || typeof item['id'] !== 'string') return;
      const name =
        typeof item['name'] === 'string'
          ? item['name']
          : isRecord(item['name']) && typeof item['name']['es'] === 'string'
            ? item['name']['es']
            : item['id'];
      const compTypeId =
        isRecord(item['munitionType']) && typeof item['munitionType']['id'] === 'string'
          ? item['munitionType']['id']
          : (munitionTypeId ?? '');

      if (!munitionTypeId || compTypeId === munitionTypeId) {
        denominations.push({
          id: item['id'],
          name,
          componentTypeId: compTypeId,
          batch: null,
          clientNumber: null,
        });
      }
    });

    return denominations;
  }

  #catalogItems(value: unknown): Record<string, unknown>[] {
    if (Array.isArray(value)) return value.filter(isRecord);
    if (!isRecord(value) || !Array.isArray(value['items'])) return [];
    return value['items'].filter(isRecord);
  }
}
