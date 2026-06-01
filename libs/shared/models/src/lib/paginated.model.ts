import { HttpParams } from '@angular/common/http';

export type PaginatedApiResponse<T> = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
};

/**
 * angular material type
 */
export type PaginatedSortedViewRequest = {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: string;
  sort?:string;
};

/**
 * params to send to the server related to paginated and sorting params
 */
export type PaginatedSortedRequestApiParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
};

/**
 * map material variables to params to send to the api
 * @param params
 * @returns map of variables to send to the api
 */
export function paginatedSortedParamsToSend(params: PaginatedSortedViewRequest): HttpParams {
  let result = new HttpParams();

  if (params.page !== undefined) {
    result = result.append('page', params.page);
  }
  if (params.pageSize !== undefined) {
    result = result.append('pageSize', params.pageSize);
  }

  if (params.sortField !== undefined && params.sortDirection !== undefined) {
    result = result.append('sort', `${params.sortField};${params.sortDirection}`);
  }

  return result;
}
