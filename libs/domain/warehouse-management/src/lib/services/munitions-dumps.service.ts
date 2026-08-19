import { Injectable } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';

import type { MunitionTypePayload, MunitionsDumpModel } from '../models/munitions-dumps.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

@Injectable({
  providedIn: 'root',
})
export class MunitionsDumpsService {
  readonly #crud = injectWarehouseResource<MunitionsDumpModel | MunitionTypePayload, MunitionTypePayload>(
    `${injectWharehouseEndpoint()}/munitions-dumps`,
  );

  readonly searchItems = this.#crud.searchItems;
  readonly paginatedResponse = this.#crud.paginatedResponse;
  readonly saveResource = this.#crud.saveResource;
  readonly updateResource = this.#crud.updateResource;
  readonly deleteResource = this.#crud.deleteResource;

  createItem(record: Omit<MunitionsDumpModel, 'id' | 'enabled'>): void {
    const body: MunitionTypePayload = {
      munitionDumpId: record.munitionDumpId,
      active: true,
      cells: record.cells.map((cell) => ({ name: cell.name })),
      maxNeq: record.maxNeq,
      maxRiskGroupNeqPerCell: record.maxRiskGroupNeqPerCell || 0,
    };

    this.#crud.createItem(body);
  }

  updateItem(record: MunitionsDumpModel): void {
    const body: MunitionTypePayload = {
      ...record,
      active: record.active,
      cells: record.cells.map((cell) => ({ name: cell.name })),
      maxNeq: record.maxNeq,
      maxRiskGroupNeqPerCell: record.maxRiskGroupNeqPerCell || 0,
    };

    this.#crud.updateItem(body);
  }

  deleteItem(item: MunitionsDumpModel): void {
    this.#crud.deleteItem(item);
  }

  toogleEnabledItem(item: MunitionsDumpModel, active: boolean) {
    this.#crud.updateItem({
      ...item,
      active,
    });
  }
}
