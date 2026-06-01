import { Injectable } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MunitionStockListResponse, MunitionStockListSearch } from '../models/munition-stock-list.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MunitionsStockListService {
  readonly #resource = injectWarehouseResource<
    MunitionStockListResponse,
    MunitionStockListResponse,
    MunitionStockListSearch
  >(`${injectWharehouseEndpoint()}/stock`);

  readonly searchItems = this.#resource.searchItems;
  readonly paginatedResponse = this.#resource.paginatedResponse;
}
