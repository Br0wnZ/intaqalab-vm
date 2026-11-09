import { httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type {
  ArmamentEquipmentDenomination,
  ArmamentEquipmentDenominationsResponse,
  ArmamentEquipmentItem,
  LoadEquipmentByTypeParams,
} from '../../../execution/models';
import { planningUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

@Injectable({
  providedIn: 'root',
})
export class ArmamentCatalogService {
  readonly #injector = inject(Injector);
  readonly #planningUrl = injectPlanningEndpoint();

  readonly #loadArmamentItemsParams = signal<LoadEquipmentByTypeParams | null>(null);

  readonly #loadArmamentItemsResource = httpResource<{ items: ArmamentEquipmentItem[] }>(() => {
    const p = this.#loadArmamentItemsParams();
    if (!p) return undefined;
    return {
      url: planningUrl(this.#planningUrl, 'equipment', 'items'),
      method: 'GET',
      params: { itemType: p.itemType },
    };
  });

  async loadArmamentEquipmentItems(itemType: LoadEquipmentByTypeParams['itemType']): Promise<ArmamentEquipmentItem[]> {
    this.#loadArmamentItemsParams.set({ itemType });
    const response = await awaitResourceValue(this.#loadArmamentItemsResource, this.#injector);
    return response.items;
  }

  readonly #loadArmamentWeaponDenominationsRequest = signal(0);

  readonly #loadArmamentWeaponDenominationsResource = httpResource<ArmamentEquipmentDenominationsResponse>(() => {
    if (!this.#loadArmamentWeaponDenominationsRequest()) return undefined;
    return {
      url: planningUrl(this.#planningUrl, 'equipment', 'denominations'),
      method: 'GET',
      params: { itemType: 'WEAPON' },
    };
  });

  async loadArmamentWeaponDenominations(): Promise<ArmamentEquipmentDenomination[]> {
    this.#loadArmamentWeaponDenominationsRequest.update((requestId) => requestId + 1);
    const response = await awaitResourceValue(this.#loadArmamentWeaponDenominationsResource, this.#injector);
    return response.items;
  }

  readonly #loadArmamentDenominationsParams = signal<{
    itemType: 'MORTAR' | 'TUBE';
    familyId?: number;
  } | null>(null);

  readonly #loadArmamentDenominationsResource = httpResource<ArmamentEquipmentDenominationsResponse>(() => {
    const params = this.#loadArmamentDenominationsParams();
    if (!params || (params.itemType === 'TUBE' && params.familyId === undefined)) return undefined;
    return {
      url: planningUrl(this.#planningUrl, 'equipment', 'denominations'),
      method: 'GET',
      params: {
        itemType: params.itemType,
        ...(params.familyId === undefined ? {} : { familyId: params.familyId }),
      },
    };
  });

  async loadArmamentDenominations(
    itemType: 'MORTAR' | 'TUBE',
    familyId?: number,
  ): Promise<ArmamentEquipmentDenomination[]> {
    if (itemType === 'TUBE' && familyId === undefined) return [];
    this.#loadArmamentDenominationsParams.set({ itemType, familyId });
    const response = await awaitResourceValue(this.#loadArmamentDenominationsResource, this.#injector);
    return response.items;
  }
}
