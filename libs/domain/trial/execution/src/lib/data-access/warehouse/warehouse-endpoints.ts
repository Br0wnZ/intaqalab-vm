import { HttpParams } from '@angular/common/http';
import { injectWharehouseEndpoint } from '@intaqalab/config';

export function buildWarehouseMunitionTypesUrl(
  warehouseBaseUrl: string,
  params?: { active?: boolean; pageSize?: number },
): { url: string; params: Record<string, string | number | boolean> } {
  return {
    url: `${warehouseBaseUrl}/munition-types`,
    params: {
      active: params?.active ?? true,
      pageSize: params?.pageSize ?? 100,
    },
  };
}

export function buildWarehouseDenominationsUrl(
  warehouseBaseUrl: string,
  params: { munitionTypeId?: string | null; active?: boolean; pageSize?: number },
): { url: string; params: Record<string, string | number | boolean> } {
  const queryParams: Record<string, string | number | boolean> = {
    active: params.active ?? true,
    pageSize: params.pageSize ?? 100,
  };
  if (params.munitionTypeId) {
    queryParams['munitionTypeId'] = params.munitionTypeId;
  }
  return {
    url: `${warehouseBaseUrl}/denominations`,
    params: queryParams,
  };
}

export function buildWarehouseStockUrl(
  warehouseBaseUrl: string,
  params: { denominationIds: string[]; status?: string; pageSize?: number },
): { url: string; params: HttpParams } {
  let httpParams = new HttpParams()
    .set('page', 1)
    .set('pageSize', params.pageSize ?? 200)
    .set('sort', 'createdAt;desc');

  if (params.status) {
    httpParams = httpParams.set('status', params.status);
  }

  for (const id of params.denominationIds) {
    if (id) {
      httpParams = httpParams.append('denominationIds', id);
    }
  }

  return {
    url: `${warehouseBaseUrl}/stock`,
    params: httpParams,
  };
}

export function injectWarehouseUrl(): string {
  return injectWharehouseEndpoint();
}
