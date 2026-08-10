import { Injectable } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { MasterDataDefault } from '../../../models/master-data-default.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class TargetTypeService implements MasterDataService<MasterDataDefault> {
  readonly #crud = injectMasterDataResource<MasterDataDefault>(`${injectPlanningEndpoint()}/target-types`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataDefault>): void {
    this.#crud.create(record);
  }

  update(record: MasterDataDefault): void {
    this.#crud.update(record);
  }

  resetUpsert() {
    this.#crud.resetSaveItem();
    this.#crud.resetUpdateItem();
  }

  resetSwitchStatus() {
    this.#crud.resetUpdateItem();
  }

  delete(id: string): void {
    this.#crud.delete(id);
  }

  resetDelete() {
    this.#crud.resetDeleteItem();
  }
}
