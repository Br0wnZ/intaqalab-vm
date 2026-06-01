import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectFireTrialTypesEndpoint } from '@intaqalab/config';

import type { MasterDataDefault } from '../../../models/master-data-default.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class TrialTypeService implements MasterDataService<MasterDataDefault> {
  readonly #crud = injectMasterDataResource<MasterDataDefault>(
    injectFireTrialTypesEndpoint(),
    new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
  );

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataDefault>): void {
    this.#crud.create(record);
  }

  updateItem(record: MasterDataDefault): void {
    this.#crud.updateItem(record);
  }

  deleteItem(id: string): void {
    this.#crud.deleteItem(id);
  }
}
