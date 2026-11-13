import { Service } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MovementListItem, MovementListSearch } from '../models/movements.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Service()
export class MovementsListService {
  readonly #resource = injectWarehouseResource<MovementListItem, MovementListItem>(
    `${injectWharehouseEndpoint()}/movements`,
  );

  readonly searchItems = this.#resource.searchItems;
  readonly paginatedResponse = this.#resource.paginatedResponse;
}
