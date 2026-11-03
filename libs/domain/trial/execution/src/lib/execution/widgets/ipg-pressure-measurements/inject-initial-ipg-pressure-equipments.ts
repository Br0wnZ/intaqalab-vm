import { computed, inject } from '@angular/core';

import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, type EquipmentSelectionItem } from '../../models';

export function injectInitialIpgPressureEquipments() {
  const executionService = inject(ExecutionService);

  return computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService.equipmentSelectorResource;
    if (!resource?.hasValue?.()) return [];

    return (
      resource
        .value()
        .find(
          (group) =>
            group.measurementGroup === EquipmentMeasurementGroupEnum.IPG_PRESSURE ||
            group.measurementGroup === 'PRESION_IPG' ||
            group.measurementGroup === 'IPG_PRESSURE',
        )?.selections ?? []
    );
  });
}
