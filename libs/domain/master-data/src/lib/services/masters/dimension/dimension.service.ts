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

  create(record: MasterDataCreateItemType<MasterDataDimension>) {
    this.#crud.create(record);
  }

  update(record: MasterDataDimension) {
    this.#crud.update(record);
  }

  resetUpsert() {
    this.#crud.resetSaveItem();
    this.#crud.resetUpdateItem();
  }

  resetSwitchStatus() {
    this.#crud.resetUpdateItem();
  }

  delete(id: string) {
    this.#crud.delete(id);
  }

  resetDelete() {
    this.#crud.resetDeleteItem();
  }
}
