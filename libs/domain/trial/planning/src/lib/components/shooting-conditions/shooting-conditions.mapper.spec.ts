import { MeasureUnitEnum } from '@intaqalab/models';

import type { ShootingConditionsUnits } from '../../models/shooting-conditions.model';
import { buildSeriesFromStore } from './shooting-conditions.mapper';

describe('buildSeriesFromStore', () => {
  it('should default powder weight unit to grams for new shots', () => {
    const conditionsUnits: ShootingConditionsUnits = {
      distance: null,
      orientation: null,
      targetInclination: null,
      elevation: null,
      angle: null,
      range: null,
      functioningHeight: null,
      nominalSpeed: null,
      powderWeight: null,
      projectileWeight: null,
    };

    const series = buildSeriesFromStore(
      [{ id: 'series-1', name: 'Serie A', shots: [{ id: 'shot-1', globalNumber: 1 }] }],
      conditionsUnits,
    );

    expect(series[0]?.shots[0]?.powderWeightUnit).toBe(MeasureUnitEnum.G);
  });
});
