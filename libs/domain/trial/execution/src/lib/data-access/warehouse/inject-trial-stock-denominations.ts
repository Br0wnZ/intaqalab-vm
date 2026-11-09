import { httpResource } from '@angular/common/http';
import { type Signal, computed } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { FireTrial, PaginatedApiResponse } from '@intaqalab/models';

import type { DenominationOption, StockListItem } from '../models';
import { buildWarehouseTrialStockUrl, injectWarehouseUrl } from './warehouse-endpoints';

export interface TrialStockDenominationsHandle {
  options: Signal<DenominationOption[]>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  reload: () => void;
}

/** Fetches denominations available in stock for the trial resolved by trial number. */
export function injectTrialStockDenominations(params: {
  fireTrialId: Signal<string | null>;
  trialNumber: Signal<string | null>;
  enabled: Signal<boolean>;
}): TrialStockDenominationsHandle {
  const fireTrialsUrl = injectFireTrialsEndpoint();
  const warehouseUrl = injectWarehouseUrl();

  const fireTrialResource = httpResource<PaginatedApiResponse<FireTrial>>(() => {
    if (!params.enabled()) return undefined;
    const trialNumber = params.trialNumber();
    if (!trialNumber) return undefined;
    return {
      url: fireTrialsUrl,
      params: { trialNumber, page: 1, pageSize: 200 },
      method: 'GET',
    };
  });

  const stockResource = httpResource<PaginatedApiResponse<StockListItem>>(() => {
    if (!params.enabled()) return undefined;
    const trialNumber = params.trialNumber();
    if (!trialNumber || !fireTrialResource.hasValue() || fireTrialResource.isLoading()) return undefined;

    const matchingTrial = fireTrialResource.value().items.find((trial) => trial.trialNumber === trialNumber);
    const fireTrialId = matchingTrial?.id ?? params.fireTrialId();
    return fireTrialId ? buildWarehouseTrialStockUrl(warehouseUrl, fireTrialId) : undefined;
  });
  const options = computed<DenominationOption[]>(() => {
    if (!stockResource.hasValue() || stockResource.isLoading()) return [];
    const denominations = new Map<string, DenominationOption>();
    for (const stockItem of stockResource.value().items) {
      const denomination = stockItem.denomination;
      if (!denomination?.id || !denomination.name || denominations.has(denomination.id)) continue;
      denominations.set(denomination.id, {
        value: denomination.id,
        label: denomination.name,
        munitionTypeId: stockItem.munitionType?.id ?? '',
        planned: false,
        inStock: true,
      });
    }
    return [...denominations.values()];
  });

  const isLoading = computed(
    () =>
      params.trialNumber() !== null &&
      (fireTrialResource.isLoading() || (fireTrialResource.hasValue() && stockResource.isLoading())),
  );

  const error = computed<Error | null>(() => {
    const cause = stockResource.error() ?? fireTrialResource.error();
    return cause instanceof Error ? cause : cause ? new Error(String(cause)) : null;
  });

  return {
    options,
    isLoading,
    error,
    reload: () => {
      fireTrialResource.reload();
      stockResource.reload();
    },
  };
}
