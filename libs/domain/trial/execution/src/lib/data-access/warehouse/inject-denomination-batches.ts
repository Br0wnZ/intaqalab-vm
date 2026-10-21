import { httpResource } from '@angular/common/http';
import { type Signal, computed } from '@angular/core';

import type { BatchOption, StockListItem } from '../models';
import { buildWarehouseStockUrl, injectWarehouseUrl } from './warehouse-endpoints';
import { normalizeStockItems, toBatchOptions } from './warehouse.normalizers';

export interface DenominationBatchesHandle {
  options: Signal<BatchOption[]>;
  stockItems: Signal<StockListItem[]>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  reload: () => void;
}

/**
 * Injects reactive available warehouse batches for a selected denomination.
 * Automatically preserves planned batches even if unavailable in physical stock.
 */
export function injectDenominationBatches(params: {
  denominationId: Signal<string | null>;
  plannedBatch?: Signal<string | null>;
  status?: string;
}): DenominationBatchesHandle {
  const warehouseUrl = injectWarehouseUrl();

  const stockResource = httpResource<unknown>(() => {
    const denominationId = params.denominationId();
    if (!denominationId) return undefined;
    return buildWarehouseStockUrl(warehouseUrl, {
      denominationIds: [denominationId],
      status: params.status ?? 'AVAILABLE',
    });
  });

  const stockItems = computed<StockListItem[]>(() => {
    if (!stockResource.hasValue()) return [];
    return normalizeStockItems(stockResource.value());
  });

  const options = computed<BatchOption[]>(() => {
    return toBatchOptions({
      stockItems: stockItems(),
      denominationId: params.denominationId(),
      plannedBatch: params.plannedBatch ? params.plannedBatch() : null,
    });
  });

  const error = computed<Error | null>(() => {
    const err = stockResource.error();
    return err instanceof Error ? err : err ? new Error(String(err)) : null;
  });

  return {
    options,
    stockItems,
    isLoading: computed(() => stockResource.isLoading()),
    error,
    reload: () => stockResource.reload(),
  };
}
