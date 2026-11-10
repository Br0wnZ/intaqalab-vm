import type { EquipmentMagnitudeTagEnum } from '../models/equipment.models';
import type { Widget } from '../models/execution-grid.models';

/** Returns widgets with at least one planned measurement tag. */
export function resolveWidgetsByMeasurements(
  widgets: readonly Widget[],
  activeTagIds: ReadonlySet<EquipmentMagnitudeTagEnum | string>,
): Widget[] {
  return widgets.filter((widget) => widget.requiredMeasurementTags.some((tag) => activeTagIds.has(tag)));
}
