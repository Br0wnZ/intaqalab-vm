import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectDocumentsEndpoint } from '@intaqalab/config';

import type { MasterDataDocumentType } from '../../../models/master-data-document-type.model';
import type { MasterDataCreateItemType } from '../../../models/utils.model';
import { injectMasterDataResource } from '../../master-data-resource.factory';
import type { MasterDataService } from '../../master-data.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentTypeService implements MasterDataService<MasterDataDocumentType> {
  readonly #crud = injectMasterDataResource<MasterDataDocumentType>(
    `${injectDocumentsEndpoint()}/document-types`,
    new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
  );

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteById = this.#crud.deleteById;

  create(record: MasterDataCreateItemType<MasterDataDocumentType>): void {
    this.#crud.create(record);
  }

  resetUpsert() {
    this.#crud.resetSaveItem();
    this.#crud.resetUpdateItem();
  }

  resetSwitchStatus() {
    this.#crud.resetUpdateItem();
  }

  update(record: MasterDataDocumentType): void {
    this.#crud.update(record);
  }

  delete(id: string): void {
    this.#crud.delete(id);
  }

  resetDelete() {
    this.#crud.resetDeleteItem();
  }
}
