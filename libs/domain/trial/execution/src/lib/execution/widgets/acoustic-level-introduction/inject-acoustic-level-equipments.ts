import { computed, inject, signal } from '@angular/core';

import { EquipmentSelectionService } from '../../../data-access';
import {
  EquipmentMagnitudeTagEnum,
  EquipmentMeasurementGroupEnum,
  type EquipmentSelectionItem,
  EquipmentTypeEnum,
} from '../../models';

export interface SoundLevelMeterOption {
  readonly value: string;
  readonly label: string;
}

export type SoundLevelMeterFilterFn = () => string | null | undefined;

export interface InjectAcousticLevelEquipmentsOptions {
  readonly seriesFilter?: SoundLevelMeterFilterFn;
  readonly shotFilter?: SoundLevelMeterFilterFn;
}

export function injectAcousticLevelEquipments(
  seriesFilterOrOptions?: SoundLevelMeterFilterFn | InjectAcousticLevelEquipmentsOptions,
  shotFilterParam?: SoundLevelMeterFilterFn,
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

  const executionService = inject(EquipmentSelectionService);
  const itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  executionService
    ?.loadEquipmentItemsByCategories?.([EquipmentTypeEnum.SOUND_LEVEL_METER])
    ?.then((result) => itemsByCategory.set(result ?? {}))
    ?.catch(() => itemsByCategory.set({}));

  const selections = computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService?.equipmentSelectorResource;
    if (!resource?.hasValue?.()) return [];

    const targetSeries = seriesFilter?.();
    const targetShot = shotFilter?.();

    const groups = resource.value() ?? [];

    const isSoundGroup = (group: { measurementGroup: string }) =>
      group.measurementGroup === EquipmentMeasurementGroupEnum.SOUND ||
      group.measurementGroup === 'SOUND' ||
      group.measurementGroup === 'SONIDO' ||
      group.measurementGroup === EquipmentMagnitudeTagEnum.SONIDO ||
      group.measurementGroup === EquipmentTypeEnum.SOUND_LEVEL_METER ||
      group.measurementGroup === 'SOUND_LEVEL_METER';

    const soundGroups = groups.filter(isSoundGroup);
    let candidateSelections = soundGroups
      .flatMap((group) => group.selections ?? [])
      .filter((sel) => !sel.categoryId || sel.categoryId === EquipmentTypeEnum.SOUND_LEVEL_METER);

    if (candidateSelections.length === 0) {
      candidateSelections = groups.flatMap((group) =>
        (group.selections ?? []).filter((sel) => sel.categoryId === EquipmentTypeEnum.SOUND_LEVEL_METER),
      );
    }

    const filtered: EquipmentSelectionItem[] = [];
    for (const sel of candidateSelections) {
      if (targetSeries && sel.seriesIds && sel.seriesIds.length > 0) {
        if (!sel.seriesIds.includes(targetSeries)) {
          continue;
        }
      }

      if (targetShot && sel.shotIds && sel.shotIds.length > 0) {
        if (!sel.shotIds.includes(targetShot)) {
          continue;
        }
      }

      filtered.push(sel);
    }

    return filtered;
  });

  const options = computed<SoundLevelMeterOption[]>(() => {
    const rawSelections = selections();
    const catalogItems = itemsByCategory()[EquipmentTypeEnum.SOUND_LEVEL_METER] ?? [];
    const catalogMap = new Map(catalogItems.map((item) => [String(item.id), item.label]));

    const seen = new Set<string>();
    const result: SoundLevelMeterOption[] = [];

    for (const sel of rawSelections) {
      const id = sel.equipmentItemId ?? sel.equipmentDenominationId;
      if (id === undefined || id === null) continue;
      const value = String(id);
      if (seen.has(value)) continue;
      seen.add(value);

      const label = catalogMap.get(value) ?? (sel.magnitude ? `Sonómetro (${sel.magnitude})` : `Sonómetro ${value}`);
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

export const injectSoundLevelMeterEquipments = injectAcousticLevelEquipments;
export const injectInitialAcousticLevelEquipments = injectAcousticLevelEquipments;
