import { httpResource } from '@angular/common/http';
import { type Signal, computed, inject } from '@angular/core';

import type { MunitionTypeItem } from '../models';
import type { TypeCatalogInfo } from '../munitions/planning-munition.normalizer';
import { buildTypeCatalogMap } from '../munitions/planning-munition.normalizer';
import { buildWarehouseMunitionTypesUrl, injectWarehouseUrl } from './warehouse-endpoints';
import { normalizeMunitionTypes } from './warehouse.normalizers';

export interface MunitionTypesHandle {
  types: Signal<MunitionTypeItem[]>;
  typeCatalogMap: Signal<Map<string, TypeCatalogInfo>>;
  isLoading: Signal<boolean>;
  error: Signal<Error | null>;
  reload: () => void;
}

/**
 * Reactive injection helper fetching active warehouse munition types.
 */
export function injectMunitionTypes(params?: { active?: boolean }): MunitionTypesHandle {
  const warehouseUrl = injectWarehouseUrl();

  const typesResource = httpResource<unknown>(() => {
    return buildWarehouseMunitionTypesUrl(warehouseUrl, { active: params?.active ?? true });
  });

  const types = computed<MunitionTypeItem[]>(() => {
    if (!typesResource.hasValue()) return [];
    return normalizeMunitionTypes(typesResource.value());
  });

  const typeCatalogMap = computed<Map<string, TypeCatalogInfo>>(() => {
    return buildTypeCatalogMap(types());
  });

  const error = computed<Error | null>(() => {
    const err = typesResource.error();
    return err instanceof Error ? err : err ? new Error(String(err)) : null;
  });

  return {
    types,
    typeCatalogMap,
    isLoading: computed(() => typesResource.isLoading()),
    error,
    reload: () => typesResource.reload(),
  };
}
