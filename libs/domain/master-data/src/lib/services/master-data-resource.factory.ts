import { HttpContext, httpResource } from '@angular/common/http';
import { effect, signal } from '@angular/core';
import type { PaginatedApiResponse, PaginatedSortedViewRequest } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';
import { actionTrigger } from '@intaqalab/utils';

import type { MasterDataCreateItemType } from '../models/utils.model';

export function injectMasterDataResource<T>(endpointUrl: string, context: HttpContext = new HttpContext()) {
  const searchItems = signal<PaginatedSortedViewRequest>({});
  const _saveItem = actionTrigger<MasterDataCreateItemType<T> | null>();
  const _updateItem = actionTrigger<T | null>();
  const _deleteItem = actionTrigger<string | number | T | null>();

  const paginatedResponse = httpResource<PaginatedApiResponse<T>>(() => {
    const params = searchItems();

    if (!Object.keys(params).length) return;

    const apiParams = paginatedSortedParamsToSend(params);

    return {
      url: endpointUrl,
      params: apiParams,
      method: 'GET',
      context,
    };
  });

  const saveResource = httpResource<T>(() => {
    const params = _saveItem.value();
    if (!params) return undefined;

    return {
      url: endpointUrl,
      method: 'POST',
      body: params,
      context,
    };
  });

  const updateResource = httpResource<T>(() => {
    const params = _updateItem.value();
    if (!params) return undefined;

    return {
      url: `${endpointUrl}/${(params as Record<string, unknown>)['id']}`,
      method: 'PUT',
      body: params,
      context,
    };
  });

  const deleteById = httpResource<T>(() => {
    const params = _deleteItem.value();
    if (!params) return undefined;

    return {
      url: `${endpointUrl}/${params}`,
      method: 'DELETE',
      context,
    };
  });

  effect(() => {
    const save = saveResource.statusCode();
    const update = updateResource.statusCode();
    const deleteId = deleteById.statusCode();

    if (save || update || deleteId) {
      paginatedResponse.reload();
    }
  });

  return {
    searchItems,
    paginatedResponse,

    create: (record: MasterDataCreateItemType<T>) => _saveItem.fire(record),
    resetSaveItem: () => _saveItem.reset(),

    update: (record: T) => _updateItem.fire(record),
    resetUpdateItem: () => _updateItem.reset(),

    delete: (item: string | number | T) => _deleteItem.fire(item),
    resetDeleteItem: () => _deleteItem.reset(),

    saveResource,
    updateResource,
    deleteById,
  };
}
