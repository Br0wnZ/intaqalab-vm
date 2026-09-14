import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';

import type { MunitionComponentStockPostModel, MunitionStockPostModel } from '../models/munition-stock.model';

@Injectable({
  providedIn: 'root',
})
export class MunitionsStockService {
  readonly #whareHouseUrl = injectWharehouseEndpoint();
  readonly munition = signal<{ itemToSave: MunitionStockPostModel; force?: true } | null>(null);
  readonly munitionComponents = signal<{ itemToSave: MunitionComponentStockPostModel; force?: true } | null>(null);

  clear() {
    this.munition.set(null);
    this.munitionComponents.set(null);
  }

  readonly saveMunitionResource = httpResource<MunitionStockPostModel>(() => {
    const munitionParams = this.munition();
    if (!munitionParams) return undefined;
    let params: undefined | { force: true } = undefined;
    if (munitionParams.force) {
      params = { force: true };
    }

    const { id, ...payload } = munitionParams.itemToSave;
    return {
      url: `${this.#whareHouseUrl}/stock/munitions`,
      method: 'POST',
      body: payload,
      params,
    };
  });

  readonly saveMunitionComponentsResource = httpResource<MunitionComponentStockPostModel>(() => {
    const munitionComponentsParams = this.munitionComponents();
    if (!munitionComponentsParams) return undefined;

    let params: undefined | { force: true } = undefined;
    if (munitionComponentsParams.force) {
      params = { force: true };
    }

    const payload = munitionComponentsParams.itemToSave;
    return {
      url: `${this.#whareHouseUrl}/stock/munition-components`,
      method: 'POST',
      body: payload,
      params,
    };
  });
}
