import { Injectable } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MovementListItem, MovementListSearch } from '../models/movements.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MovementsListService {
  readonly #resource = injectWarehouseResource<MovementListItem, MovementListItem, MovementListSearch>(
    `${injectWharehouseEndpoint()}/movements`,
  );

  readonly searchItems = this.#resource.searchItems;
  readonly paginatedResponse = this.#resource.paginatedResponse;
}
