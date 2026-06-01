import { Injectable } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { MasterDataLoadingZone } from '../../../models/master-data-loading-zone.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class LoadingZoneService implements MasterDataService<MasterDataLoadingZone> {
  readonly #crud = injectMasterDataResource<MasterDataLoadingZone>(`${injectPlanningEndpoint()}/loading-zone`);

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataLoadingZone>): void {
    this.#crud.create(record);
  }

  updateItem(record: MasterDataLoadingZone): void {
    this.#crud.updateItem(record);
  }

  deleteItem(id: string): void {
    this.#crud.deleteItem(id);
  }
}
