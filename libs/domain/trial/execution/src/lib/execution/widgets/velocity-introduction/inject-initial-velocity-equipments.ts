import { computed, inject } from '@angular/core';

import { EquipmentSelectionService } from '../../../data-access';
import { EquipmentMeasurementGroupEnum, type EquipmentSelectionItem } from '../../models';

export function injectInitialVelocityEquipments() {
  const executionService = inject(EquipmentSelectionService);

  return computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService.equipmentSelectorResource;
    if (!resource.hasValue()) return [];

    return (
      resource.value().find((group) => group.measurementGroup === EquipmentMeasurementGroupEnum.INITIAL_VELOCITY)
        ?.selections ?? []
    );
  });
}
