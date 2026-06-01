import { HttpContext, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { TOAST_FEEDBACK } from '@intaqalab/config';
import type { FireTrial, PaginatedApiResponse, TrialSearchFilters, UpsertFireTrial } from '@intaqalab/models';

@Injectable({
  providedIn: 'root',
})
export class TrialsDataService {
  readonly #searchFilters = signal<Partial<TrialSearchFilters> | null>(null);

  readonly #url = injectFireTrialsEndpoint();

  readonly #createTrialParams = signal<UpsertFireTrial | null>(null);

  readonly createTrialResource = httpResource<FireTrial>(() => {
    const body = this.#createTrialParams();
    if (!body) return undefined;
    return {
      url: this.#url,
      method: 'POST',
      body,
      context: new HttpContext().set(TOAST_FEEDBACK, { message: 'TRIAL_CREATE_MODIFY_FORM.CREATE_SUCCESS' }),
    };
  });

  createTrial(data: UpsertFireTrial) {
    this.#createTrialParams.set(data);
  }

  resetCreateTrial() {
    this.#createTrialParams.set(null);
  }

  readonly #updateTrialParams = signal<{ trialId: string; payload: UpsertFireTrial } | null>(null);
  readonly updateTrialResource = httpResource<FireTrial>(() => {
    const data = this.#updateTrialParams();
    if (!data) return undefined;
    const { payload, trialId } = data;
    return {
      url: `${this.#url}/${trialId}`,
      method: 'PUT',
      body: payload,
    };
  });

  updateTrial(trialId: string, payload: UpsertFireTrial) {
    this.#updateTrialParams.set({ trialId, payload });
  }

  resetUpdateTrial() {
    this.#updateTrialParams.set(null);
  }

  readonly source = httpResource<PaginatedApiResponse<FireTrial>>(() => {
    const filters = this.#searchFilters();
    const params = this.#getSearchParams(filters);
    if (!params) return undefined;
    return {
      url: this.#url,
      params,
    };
  });

  search(filters: Partial<TrialSearchFilters>) {
    this.#searchFilters.set(filters);
  }

  #getSearchParams(filters: Partial<TrialSearchFilters> | null): HttpParams | undefined {
    if(filters === null) return undefined
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    return params;
  }
}
