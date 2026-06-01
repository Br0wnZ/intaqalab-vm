import { HttpContext, httpResource } from '@angular/common/http';
import { effect, signal } from '@angular/core';
import type { PaginatedApiResponse, PaginatedSortedViewRequest } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';

import type { MasterDataCreateItemType } from '../models/utils.model';

export function injectMasterDataResource<T>(endpointUrl: string, context: HttpContext = new HttpContext()) {
  const searchItems = signal<PaginatedSortedViewRequest>({});
  const saveItem = signal<MasterDataCreateItemType<T> | null>(null);
  const updateItemSrc = signal<T | null>(null);
  const deleteItemSrc = signal<string | number | T | null>(null);

  const paginatedResponse = httpResource<PaginatedApiResponse<T>>(() => {
    const params = searchItems();
    const apiParams = paginatedSortedParamsToSend(params);

    return {
      url: endpointUrl,
      params: apiParams,
      method: 'GET',
      context,
    };
  });

  const saveResource = httpResource<T>(() => {
    const params = saveItem();
    if (!params) return undefined;

    return {
      url: endpointUrl,
      method: 'POST',
      body: params,
      context,
    };
  });

  const updateResource = httpResource<T>(() => {
    const params = updateItemSrc();
    if (!params) return undefined;

    return {
      url: `${endpointUrl}/${(params as Record<string, unknown>)['id']}`,
      method: 'PUT',
      body: params,
      context,
    };
  });

  const deleteById = httpResource<T>(() => {
    const params = deleteItemSrc();
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
    create: (record: MasterDataCreateItemType<T>) => saveItem.set(record),
    updateItem: (record: T) => updateItemSrc.set(record),
    deleteItem: (item: string | number | T) => deleteItemSrc.set(item),

    saveResource,
    updateResource,
    deleteById,
  };
}
