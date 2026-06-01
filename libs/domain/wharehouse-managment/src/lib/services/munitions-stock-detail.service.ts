import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MunitionDetailResponseModel } from '../models/munition-stock-detail.model';
import { injectWarehouseResource } from './warehouse-resource.factory';

export interface UpdateAssociatedComponentsPayload {
  id: string;
  data: UpdateAssociatedComponentsData[];
}
export type UpdateAssociatedComponentsData = { denominationId: string; batch: string; munitionTypeId: string };

@Injectable({
  providedIn: 'root',
})
export class MunitionsStockDetailService {
  #resource = injectWarehouseResource<MunitionDetailResponseModel, { associatedComponents: UpdateAssociatedComponentsData[] }, { id: string } | undefined>(`${injectWharehouseEndpoint()}/stock`);
  
  readonly deleteResource = this.#resource.deleteResource;
  readonly response = this.#resource.response;

  searchById(id: string, entity?: string): void {
    const url = entity ? `${entity}/${id}` : id;
    this.#resource.searchById(url);
  }

  updateAssociatedComponents(dataToSend: UpdateAssociatedComponentsPayload) {
    const { data, id } = dataToSend;
    const url = `munitions/${id}`;
    this.#resource.partialUpdateItem({ associatedComponents:data}, url);
  }



  readonly #whareHouseUrl = injectWharehouseEndpoint();
  readonly #apiUrlMovements = `${this.#whareHouseUrl}/movements`;
  retire = signal<{ quantity: number; reason: string; itemId: string; category: string } | undefined>(undefined);
  readonly retireResource = httpResource<MunitionDetailResponseModel>(() => {
    const dataToSend = this.retire();
    if (!dataToSend) return undefined;
    return {
      url: `${this.#apiUrlMovements}/retire`,
      method: 'POST',
      body: {
        ...dataToSend,
      },
    };
  });

  transfer = signal<{ quantity: number; munitionDumpId: string; cellName: string; itemId: string } | undefined>(
    undefined,
  );
  readonly transferResource = httpResource<MunitionDetailResponseModel>(() => {
    const dataToSend = this.transfer();
    if (!dataToSend) return undefined;
    return {
      url: `${this.#apiUrlMovements}/transfers`,
      method: 'POST',
      body: {
        ...dataToSend,
      },
    };
  });
}
