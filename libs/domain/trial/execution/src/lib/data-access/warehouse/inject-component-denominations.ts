import { httpResource } from '@angular/common/http';
import { type Signal, computed } from '@angular/core';
import type { DenominationItem, DenominationOption, PlannedComponentData } from '../models';
import { buildWarehouseDenominationsUrl, injectWarehouseUrl } from './warehouse-endpoints';
import { normalizeDenominations, toDenominationOptions } from './warehouse.normalizers';

export interface ComponentDenominationsHandle {
  options: Signal<DenominationOption[]>;
  denominations: Signal<DenominationItem[]>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  reload: () => void;
}

/**
 * Injects reactive warehouse denomination options filtered by selected component/munition type.
 * Ensures planned denominations are visible and indicated even if not stocked in catalog.
 */
export function injectComponentDenominations(params: {
  munitionTypeId: Signal<string | null>;
  planned?: Signal<PlannedComponentData | null>;
  active?: boolean;
}): ComponentDenominationsHandle {
  const warehouseUrl = injectWarehouseUrl();

  const denominationsResource = httpResource<unknown>(() => {
    const munitionTypeId = params.munitionTypeId();
    if (!munitionTypeId) return undefined;
    return buildWarehouseDenominationsUrl(warehouseUrl, {
      munitionTypeId,
      active: params.active ?? true,
    });
  });

  const denominations = computed<DenominationItem[]>(() => {
    if (!denominationsResource.hasValue()) return [];
    return normalizeDenominations(denominationsResource.value());
  });

  const options = computed<DenominationOption[]>(() => {
    return toDenominationOptions({
      denominations: denominations(),
      munitionTypeId: params.munitionTypeId(),
      planned: params.planned ? params.planned() : null,
    });
  });

  const error = computed<Error | null>(() => {
    const err = denominationsResource.error();
    return err instanceof Error ? err : err ? new Error(String(err)) : null;
  });

  return {
    options,
    denominations,
    isLoading: computed(() => denominationsResource.isLoading()),
    error,
    reload: () => denominationsResource.reload(),
  };
}
