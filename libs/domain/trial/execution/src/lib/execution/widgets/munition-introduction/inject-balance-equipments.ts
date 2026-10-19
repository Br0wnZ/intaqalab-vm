import { computed, inject, signal } from '@angular/core';

import { ExecutionService } from '../../../services/execution.service';
import { type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';
import { resolveBalanceKey } from './munition-introduction.mapper';

export interface BalanceEquipmentOption {
  value: string;
  label: string;
  unit?: string;
}

export type BalanceFilterFn = () => string[] | string | null | undefined;

export interface InjectBalanceEquipmentsOptions {
  seriesFilter?: BalanceFilterFn;
  shotFilter?: BalanceFilterFn;
}

export function injectBalanceEquipments(
  seriesFilterOrOptions?: BalanceFilterFn | InjectBalanceEquipmentsOptions,
  shotFilterParam?: BalanceFilterFn,
) {
  const optionsConfig =
    typeof seriesFilterOrOptions === 'object' && seriesFilterOrOptions !== null
      ? seriesFilterOrOptions
      : {
          seriesFilter: typeof seriesFilterOrOptions === 'function' ? seriesFilterOrOptions : undefined,
          shotFilter: shotFilterParam,
        };

  const seriesFilter = optionsConfig.seriesFilter;
  const shotFilter = optionsConfig.shotFilter;

  const executionService = inject(ExecutionService);
  const itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  executionService
    ?.loadEquipmentItemsByCategories?.([EquipmentTypeEnum.BALANCE])
    ?.then((result) => itemsByCategory.set(result ?? {}))
    ?.catch(() => itemsByCategory.set({}));

  const selections = computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService?.equipmentSelectorResource;
    if (!resource?.hasValue?.()) return [];

    const rawSeries = seriesFilter ? seriesFilter() : undefined;
    const targetSeries: string[] = Array.isArray(rawSeries)
      ? rawSeries.filter((s): s is string => Boolean(s))
      : rawSeries
        ? [rawSeries]
        : [];

    const rawShots = shotFilter ? shotFilter() : undefined;
    const targetShots: string[] = Array.isArray(rawShots)
      ? rawShots.filter((s): s is string => Boolean(s))
      : rawShots
        ? [rawShots]
        : [];

    const groups = resource.value() ?? [];
    const balanceSelections: EquipmentSelectionItem[] = [];

    for (const group of groups) {
      for (const sel of group.selections ?? []) {
        if (sel.categoryId !== EquipmentTypeEnum.BALANCE) {
          continue;
        }

        if (targetSeries.length > 0 && sel.seriesIds && sel.seriesIds.length > 0) {
          const matches = sel.seriesIds.some((seriesId) => targetSeries.includes(seriesId));
          if (!matches) {
            continue;
          }
        }

        if (targetShots.length > 0 && sel.shotIds && sel.shotIds.length > 0) {
          const matches = sel.shotIds.some((shotId) => targetShots.includes(shotId));
          if (!matches) {
            continue;
          }
        }

        balanceSelections.push(sel);
      }
    }

    return balanceSelections;
  });

  const options = computed<BalanceEquipmentOption[]>(() => {
    const rawSelections = selections();
    const catalogItems = itemsByCategory()[EquipmentTypeEnum.BALANCE] ?? [];
    const catalogMap = new Map(catalogItems.map((item) => [String(item.id), item.label]));

    const seen = new Set<string>();
    const result: BalanceEquipmentOption[] = [];

    for (const sel of rawSelections) {
      const id = sel.equipmentItemId ?? sel.equipmentDenominationId;
      if (id === undefined || id === null) continue;
      const rawId = String(id);
      const value = resolveBalanceKey(rawId) ?? rawId;
      if (seen.has(value)) continue;
      seen.add(value);

      const label = catalogMap.get(rawId) ?? catalogMap.get(value) ?? (rawId ? `Balanza ${rawId}` : '');
      result.push({ value, label });
    }

    return result;
  });

  return {
    itemsByCategory: computed(() => itemsByCategory()),
    selections,
    options,
  };
}
