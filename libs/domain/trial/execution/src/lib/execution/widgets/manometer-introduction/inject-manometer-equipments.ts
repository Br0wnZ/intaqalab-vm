import { computed, inject, signal } from '@angular/core';

import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';

export function injectManometerEquipments() {
  const executionService = inject(ExecutionService);
  const itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  executionService
    .loadEquipmentItemsByCategories([
      EquipmentTypeEnum.PRESSURE_GAUGE,
      EquipmentTypeEnum.CRUSHER,
      EquipmentTypeEnum.PROBE,
    ])
    .then((result) => itemsByCategory.set(result));

  const selections = computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService.equipmentSelectorResource;
    if (!resource.hasValue()) return [];

    return (
      resource.value().find((group) => group.measurementGroup === EquipmentMeasurementGroupEnum.MANOMETER_PRESSURE)
        ?.selections ?? []
    );
  });

  return {
    itemsByCategory: computed(() => itemsByCategory()),
    selections,
  };
}
