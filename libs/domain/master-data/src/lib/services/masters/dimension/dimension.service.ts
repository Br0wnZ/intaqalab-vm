import { Injectable } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { MasterDataDimension } from '../../../models/master-data-dimension.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class DimensionService implements MasterDataService<MasterDataDimension> {
  readonly #crud = injectMasterDataResource<MasterDataDimension>(`${injectPlanningEndpoint()}/target-dimensions`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataDimension>): void {
    this.#crud.create(record);
  }

  updateItem(record: MasterDataDimension): void {
    this.#crud.updateItem(record);
  }

  deleteItem(id: string): void {
    this.#crud.deleteItem(id);
  }
}
