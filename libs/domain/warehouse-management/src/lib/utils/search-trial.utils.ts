import { httpResource } from '@angular/common/http';
import type { Resource, Signal } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { PaginatedApiResponse } from '@intaqalab/models';

export type SearchByTrialNumberResponse = PaginatedApiResponse<{ id: string; trialNumber: string }>;
export const PLANNED_TRIAL_PATTERN = /^\d{0,4}\/\d\d$/;

export function injectTrialSearch(trialNumber: Signal<string>) {
  const url = injectFireTrialsEndpoint();
  return httpResource<SearchByTrialNumberResponse>(() => {
    const value = trialNumber();
    return value && PLANNED_TRIAL_PATTERN.test(value) ? { url, params: { trialNumber: value } } : undefined;
  });
}

export function trialSearchError(resource: Resource<SearchByTrialNumberResponse | undefined>) {
  if (resource.error()) {
    return { kind: 'networkError', message: 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND_NETWORK' };
  }
  if (resource.hasValue() && resource.value().items.length === 0) {
    return { kind: 'trialNotFound', message: 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND' };
  }
  return null;
}
