import type { EquipmentMeasurementGroup, EquipmentSelectionItem, EquipmentSelectionList } from './equipment.models';
import type { WidgetPreferenceId } from './execution-grid.models';

export type ExecutionWidgetLayout = {
  widgetsLayout: WidgetPreferenceId[];
};

export type EquipmentSelectorCategory = {
  id: string;
  label: string;
  maxSelection: number;
  equipmentType?: string;
};

export type EquipmentSelectorItem = {
  id: string;
  label: string;
  categoryId?: string;
  equipmentType?: string;
};

export type EquipmentSelectorSelection = EquipmentSelectionItem;

export type EquipmentSelectorMagnitudeGroup = EquipmentMeasurementGroup;

export type EquipmentSelectorResponse = EquipmentSelectionList;

export type EquipmentSelectorUpdateRequest = EquipmentSelectionList;

export type EquipmentSelectorUpdateResponse = void;
