import { computed, inject } from '@angular/core';

import { ExecutionService } from '../../../services/execution.service';
import {
  EquipmentMagnitudeTagEnum,
  EquipmentMeasurementGroupEnum,
  type EquipmentSelectionItem,
  EquipmentTypeEnum,
} from '../../models';

export function injectInitialVideoEquipments(tipoVideoFn?: () => 'AV' | 'C' | null) {
  const executionService = inject(ExecutionService);

  return computed<readonly EquipmentSelectionItem[]>(() => {
    const resource = executionService.equipmentSelectorResource;
    if (!resource?.hasValue?.()) return [];

    const tipo = tipoVideoFn ? tipoVideoFn() : null;
    const groups = resource.value() ?? [];

    const isHighSpeedGroup = (group: { measurementGroup: string }) =>
      group.measurementGroup === EquipmentMeasurementGroupEnum.HIGH_SPEED_VIDEO ||
      group.measurementGroup === 'HIGH_SPEED_VIDEO' ||
      group.measurementGroup === EquipmentTypeEnum.HIGH_SPEED_CAMERA ||
      group.measurementGroup === 'HIGH_SPEED_CAMERA' ||
      group.measurementGroup === EquipmentMagnitudeTagEnum.VIDEO_AV ||
      group.measurementGroup === 'VIDEO_AV';

    const isConventionalGroup = (group: { measurementGroup: string }) =>
      group.measurementGroup === EquipmentMeasurementGroupEnum.CONVENTIONAL_VIDEO ||
      group.measurementGroup === 'CONVENTIONAL_VIDEO' ||
      group.measurementGroup === EquipmentTypeEnum.CONVENTIONAL_CAMERA ||
      group.measurementGroup === 'CONVENTIONAL_CAMERA' ||
      group.measurementGroup === EquipmentMagnitudeTagEnum.VIDEO_C ||
      group.measurementGroup === 'VIDEO_C';

    if (tipo === 'AV') {
      return groups.find(isHighSpeedGroup)?.selections ?? [];
    }

    if (tipo === 'C') {
      return groups.find(isConventionalGroup)?.selections ?? [];
    }

    const avSelections = groups.find(isHighSpeedGroup)?.selections ?? [];
    const cSelections = groups.find(isConventionalGroup)?.selections ?? [];
    return [...avSelections, ...cSelections];
  });
}

export function injectInitialHighSpeedVideoEquipments() {
  return injectInitialVideoEquipments(() => 'AV');
}

export function injectInitialConventionalVideoEquipments() {
  return injectInitialVideoEquipments(() => 'C');
}
