import { HttpContext, type HttpResourceRef, httpResource } from '@angular/common/http';
import { effect, signal } from '@angular/core';
import type { PaginatedApiResponse } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';
import { actionTrigger } from '@intaqalab/utils';

import type { MasterDataCreateItemType, MasterDataEntityId, MasterDataWithId } from '../models/utils.model';
import type { MasterDataSearchRequest } from './master-data.service';

function isHttpSuccess(resource: HttpResourceRef<unknown>): boolean {
  const code = resource.statusCode();
  return resource.status() === 'resolved' && code !== undefined && code >= 200 && code < 300;
}

export function injectMasterDataResource<T extends MasterDataWithId>(
  endpointUrl: string,
  context: HttpContext = new HttpContext(),
) {
  const searchItems = signal<MasterDataSearchRequest>({});
  const _saveItem = actionTrigger<MasterDataCreateItemType<T> | null>();
  const _updateItem = actionTrigger<T | null>();
  const _deleteItem = actionTrigger<MasterDataEntityId | null>();

  const paginatedResponse = httpResource<PaginatedApiResponse<T>>(() => {
    const params = searchItems();

    if (!Object.keys(params).length) return;

    let apiParams = paginatedSortedParamsToSend(params);
    for (const [name, value] of Object.entries(params.filters ?? {})) {
      if (value) apiParams = apiParams.set(name, value);
    }

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
      url: `${endpointUrl}/${params.id}`,
      method: 'PUT',
      body: params,
      context,
    };
  });

  const deleteById = httpResource<T>(() => {
    const params = _deleteItem.value();
    if (params === null || params === undefined) return undefined;

    return {
      url: `${endpointUrl}/${params}`,
      method: 'DELETE',
      context,
    };
  });

  effect(() => {
    const saveSuccess = isHttpSuccess(saveResource);
    const updateSuccess = isHttpSuccess(updateResource);
    const deleteSuccess = isHttpSuccess(deleteById);

    if (saveSuccess || updateSuccess || deleteSuccess) {
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

    delete: (id: MasterDataEntityId) => _deleteItem.fire(id),
    resetDeleteItem: () => _deleteItem.reset(),

    saveResource,
    updateResource,
    deleteById,
  };
}
