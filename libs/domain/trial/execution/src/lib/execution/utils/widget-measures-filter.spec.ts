import { describe, expect, it } from 'vitest';

import { EquipmentMagnitudeTagEnum } from '../models/equipment.models';
import type { Widget } from '../models/execution-grid.models';
import { WidgetId } from '../models/widget-id.enum';
import { resolveWidgetsByMeasurements } from './widget-measures-filter';

function makeWidget(id: string, requiredMeasurementTags: Widget['requiredMeasurementTags']): Widget {
  return {
    id,
    widgetId: WidgetId.VELOCITY_INTRODUCTION,
    widgetComponent: class {},
    title: id,
    description: id,
    category: id,
    defaultWidth: 1,
    requiredMeasurementTags,
  };
}

const widgets = [
  makeWidget('empty', []),
  makeWidget('velocity', [EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL]),
  makeWidget('video', [EquipmentMagnitudeTagEnum.VIDEO_AV, EquipmentMagnitudeTagEnum.VIDEO_C]),
];

describe('resolveWidgetsByMeasurements', () => {
  it('should return no widgets when there are no active tags', () => {
    expect(resolveWidgetsByMeasurements(widgets, new Set())).toEqual([]);
  });

  it('should include widgets with a matching tag and exclude non-matching widgets', () => {
    expect(resolveWidgetsByMeasurements(widgets, new Set([EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL]))).toEqual([
      widgets[1],
    ]);
  });

  it('should include a widget when any of its required tags matches', () => {
    expect(resolveWidgetsByMeasurements(widgets, new Set([EquipmentMagnitudeTagEnum.VIDEO_C]))).toEqual([widgets[2]]);
  });
});
