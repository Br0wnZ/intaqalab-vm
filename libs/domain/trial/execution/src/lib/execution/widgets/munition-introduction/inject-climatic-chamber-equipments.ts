import { computed, inject, signal } from '@angular/core';

import { ExecutionService } from '../../../services/execution.service';
import { type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';

export interface ClimaticChamberOption {
  value: string;
  label: string;
}

export function injectClimaticChamberEquipments(seriesFilter?: () => string[] | string | null | undefined) {
  const executionService = inject(ExecutionService);
  const itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  executionService
    ?.loadEquipmentItemsByCategories?.([EquipmentTypeEnum.CLIMATIC_CHAMBER])
    ?.then((result) => itemsByCategory.set(result ?? {}))
    ?.catch(() => itemsByCategory.set({}));

  const selections = computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService?.equipmentSelectorResource;
    if (!resource?.hasValue?.()) return [];

    const rawFilter = seriesFilter ? seriesFilter() : undefined;
    const targetSeries: string[] = Array.isArray(rawFilter) ? rawFilter.filter(Boolean) : rawFilter ? [rawFilter] : [];

    const groups = resource.value() ?? [];
    const chamberSelections: EquipmentSelectionItem[] = [];
    for (const group of groups) {
      for (const sel of group.selections ?? []) {
        if (sel.categoryId !== EquipmentTypeEnum.CLIMATIC_CHAMBER) {
          continue;
        }

        if (targetSeries.length > 0 && sel.seriesIds && sel.seriesIds.length > 0) {
          const matches = sel.seriesIds.some((seriesId) => targetSeries.includes(seriesId));
          if (!matches) {
            continue;
          }
        }

        chamberSelections.push(sel);
      }
    }
    return chamberSelections;
  });

  const options = computed<ClimaticChamberOption[]>(() => {
    const rawSelections = selections();
    const catalogItems = itemsByCategory()[EquipmentTypeEnum.CLIMATIC_CHAMBER] ?? [];
    const catalogMap = new Map(catalogItems.map((item) => [String(item.id), item.label]));

    const seen = new Set<string>();
    const result: ClimaticChamberOption[] = [];

    for (const sel of rawSelections) {
      const id = sel.equipmentItemId ?? sel.equipmentDenominationId;
      if (id === undefined || id === null) continue;
      const strId = String(id);
      if (seen.has(strId)) continue;
      seen.add(strId);

      const label = catalogMap.get(strId) ?? (strId ? `Cámara ${strId}` : '');
      result.push({ value: strId, label });
    }

    return result;
  });

  return {
    itemsByCategory: computed(() => itemsByCategory()),
    selections,
    options,
  };
}
