import type { HttpResourceRequest } from '@angular/common/http';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Signal } from '@angular/core';
import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { FireTrial, PaginatedSortedViewRequest, TrialSearchFilters } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataTrialCreateModifyService {
  httpClient = inject(HttpClient);
  readonly url = injectFireTrialsEndpoint();
  readonly #exportFireTrialsParams = signal<{
    filters: Partial<TrialSearchFilters>;
    sort: string[];
    trigger: number;
  } | null>(null);

  readonly exportFireTrialsResource = rxResource({
    params: () => this.#exportFireTrialsParams() ?? undefined,
    stream: ({ params }) =>
      this.httpClient.get(`${this.url}/xlsx`, {
        params: this.#buildExportParams(params.filters, params.sort),
        observe: 'response',
        responseType: 'blob',
      }),
  });

  getTrialsList =
    (props: Signal<Partial<TrialSearchFilters & PaginatedSortedViewRequest> | null>) =>
    (): HttpResourceRequest | undefined => {
      const filters = props();
      if (!filters) return undefined;
      const filterParams = new HttpParams({ fromObject: this.#getSearchParams(filters) });
      const paginationParams = paginatedSortedParamsToSend(filters ?? {});
      const mergedParams = this.#mergeParams(filterParams, paginationParams);

      return {
        url: this.url,
        params: mergedParams,
      };
    };

  exportFireTrials(filters: Partial<TrialSearchFilters>, sort: string[] = []): void {
    this.#exportFireTrialsParams.set({ filters, sort, trigger: Date.now() });
  }

  resetExportFireTrials(): void {
    this.#exportFireTrialsParams.set(null);
  }

  getTrialDetail = (id: string) => (): HttpResourceRequest | undefined => {
    return {
      url: `${this.url}/${id}`,
    };
  };

  loadTrial(id: string): Observable<FireTrial> {
    return this.httpClient.get<FireTrial>(`${this.url}/${id}`);
  }

  #mergeParams(base: HttpParams, extra: HttpParams): HttpParams {
    let result = base;
    extra.keys().forEach((key) => {
      const value = extra.get(key);
      if (value !== null) {
        result = result.set(key, value);
      }
    });
    return result;
  }

  #getSearchParams(filters: Partial<TrialSearchFilters & PaginatedSortedViewRequest> | null) {
    const paginationKeys = new Set(['page', 'pageSize', 'sortField', 'sortDirection']);
    const filtered: Record<string, string | string[]> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (paginationKeys.has(key)) return;
        if (Array.isArray(value)) {
          if (value.length > 0) filtered[key] = value as string[];
        } else if (value !== undefined && value !== null && value !== '') {
          filtered[key] = value.toString();
        }
      });
    }
    return filtered;
  }

  #buildExportParams(filters: Partial<TrialSearchFilters>, sort: string[]): HttpParams {
    const values: Record<string, string | string[] | undefined> = {
      trialNumber: filters.trialNumber,
      year: filters.year,
      clientId: filters.clientId,
      description: filters.description,
      status: filters.status,
      fireTrialTypeId: filters.fireTrialTypeId,
      scheduledDateFrom: filters.scheduledDateFrom,
      scheduledDateTo: filters.scheduledDateTo,
      sort: sort.length > 0 ? sort : undefined,
    };

    let params = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) params = params.append(key, item);
      } else {
        params = params.set(key, value);
      }
    }
    return params;
  }
}
