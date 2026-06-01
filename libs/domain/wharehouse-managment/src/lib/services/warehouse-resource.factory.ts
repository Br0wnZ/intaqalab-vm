import { HttpContext, httpResource } from '@angular/common/http';
import { effect, signal } from '@angular/core';
import type { PaginatedApiResponse, PaginatedSortedViewRequest } from '@intaqalab/models';

import { setParamsAsHttpParams } from '../models/utils.model';

export function injectWarehouseResource<T, U, W>(endpointUrl: string, context: HttpContext = new HttpContext()) {
  const searchItems = signal<PaginatedSortedViewRequest | null>(null);

  const saveItem = signal<U | null>(null);
  const searchByIdSrc = signal<string | null>(null);
  const updateItemSrc = signal<T | null>(null);
  const partialUpdateItemSrc = signal<{ body: T | U; url: string } | null>(null);
  const deleteItemSrc = signal<string | number | T | null>(null);

  const response = httpResource<T>(() => {
    const param = searchByIdSrc();
    if (!param) return undefined;

    return {
      url: `${endpointUrl}/${param}`,
      method: 'GET',
      context,
    };
  });

  const paginatedResponse = httpResource<PaginatedApiResponse<T>>(() => {
    const params = searchItems();

    if (!params) return;

    const apiParams = setParamsAsHttpParams(params);

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

  const partialUpdateResource = httpResource<T>(() => {
    const params = partialUpdateItemSrc();
    if (!params) return undefined;

    return {
      url: `${endpointUrl}/${params.url}`,
      method: 'PATCH',
      body: params.body,
      context,
    };
  });

  const deleteResource = httpResource<T>(() => {
    const params = deleteItemSrc();
    if (!params) return undefined;

    return {
      url: `${endpointUrl}/${(params as Record<string, unknown>)['id']}`,
      method: 'DELETE',
      context,
    };
  });

  effect(() => {
    const save = saveResource.statusCode();
    const update = updateResource.statusCode();
    const deleteId = deleteResource.statusCode();
    const partialUpdate = partialUpdateResource.statusCode();

    if (save || update || deleteId) paginatedResponse.reload();

    if (partialUpdate) response.reload();
  });

  return {
    searchItems,
    response,
    paginatedResponse,
    searchById: (param: string) => searchByIdSrc.set(param),
    createItem: (record: U) => saveItem.set(record),
    updateItem: (record: T) => updateItemSrc.set(record),
    partialUpdateItem: (record: T | U, url: string) => partialUpdateItemSrc.set({ body: record, url }),
    deleteItem: (item: string | number | T) => deleteItemSrc.set(item),

    saveResource,
    updateResource,
    partialUpdateResource,
    deleteResource,
  };
}
