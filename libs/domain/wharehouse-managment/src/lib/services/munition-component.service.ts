import { Injectable } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MunitionComponentsModel } from '../models/munition-components.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MunitionComponentService {
  readonly #crud = injectWarehouseResource<
    MunitionComponentsModel,
    Omit<MunitionComponentsModel, 'id' | 'active'>,
    { name: string }
  >(`${injectWharehouseEndpoint()}/munition-types`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteResource = this.#crud.deleteResource;

  createItem(record: Omit<MunitionComponentsModel, 'id' | 'active'>): void {
    this.#crud.createItem(record);
  }

  updateItem(record: MunitionComponentsModel): void {
    this.#crud.updateItem(record);
  }

  deleteItem(item: MunitionComponentsModel): void {
    this.#crud.deleteItem(item);
  }

  toogleEnabledItem(item: MunitionComponentsModel, enabled: boolean) {
    const itemToSend = { ...item, active: enabled };
    this.#crud.updateItem(itemToSend);
  }
}
