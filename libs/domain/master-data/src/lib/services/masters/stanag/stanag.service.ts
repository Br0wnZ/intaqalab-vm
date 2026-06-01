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
  readonly #crud = injectMasterDataResource<MasterDataStanag>(`${injectPlanningEndpoint()}/stanag`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataStanag>) {
    this.#crud.create(record);
  }

  updateItem(record: MasterDataStanag) {
    this.#crud.updateItem(record);
  }

  deleteItem(id: string) {
    this.#crud.deleteItem(id);
  }
}
