import { Injectable } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { MasterDataStanag } from '../../../models/master-data-stanag.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class StanagService implements MasterDataService<MasterDataStanag> {
  readonly #crud = injectMasterDataResource<MasterDataStanag>(`${injectPlanningEndpoint()}/stanag-criteria`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataStanag>) {
    this.#crud.create(record);
  }

  update(record: MasterDataStanag) {
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
