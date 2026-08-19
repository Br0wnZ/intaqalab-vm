import { Injectable } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type {
  DenominationModel,
  DenominationUpSertModel,
  SearchDenominationsPaginatedSortedRequest,
} from '../models/denominations.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class DenominationsService {
  readonly #crud = injectWarehouseResource<DenominationModel, DenominationUpSertModel>(
    `${injectWharehouseEndpoint()}/denominations`,
  );

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteResource = this.#crud.deleteResource;

  createItem(record: DenominationUpSertModel): void {
    this.#crud.createItem(record);
  }

  updateItem(record: DenominationModel): void {
    this.#crud.updateItem(record);
  }

  deleteItem(item: DenominationModel): void {
    this.#crud.deleteItem(item);
  }

  toogleEnabledItem(item: DenominationUpSertModel) {
    this.#crud.updateItem(item);
  }
}
