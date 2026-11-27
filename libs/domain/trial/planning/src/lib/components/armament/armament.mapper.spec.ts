import { describe, expect, it } from 'vitest';

import type { ArmamentSerie } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { buildSeriesFromStore, mapBackendToLocal, mapLocalToRequest } from './armament.mapper';

describe('armament defaults', () => {
  it('should preserve the persisted assignment ID independently from shot and catalog IDs', () => {
    const [series] = mapBackendToLocal([
      {
        seriesId: 'series-1',
        seriesName: 'Series 1',
        shots: [{ shotId: 'shot-1', armament: { id: 'armament-1', weaponExternalId: 101, tubeExternalId: 501 } }],
      },
    ]);

    expect(series.shots[0]).toMatchObject({
      shotId: 'shot-1',
      armament: { id: 'armament-1', weaponExternalId: '101', tubeExternalId: '501' },
    });
  });

  it('should preserve assignment IDs when rebuilding rows from series and saved armament', () => {
    const [series] = buildSeriesFromStore(
      [
        {
          id: 'series-1',
          name: 'Series 1',
          shotQuantity: 1,
          executionOrder: 1,
          observations: '',
          shots: [{ id: 'shot-1', globalNumber: 7, observation: '' }],
        },
      ],
      [
        {
          seriesId: 'series-1',
          seriesName: 'Series 1',
          shots: [{ shotId: 'shot-1', armament: { id: 'armament-1', weaponExternalId: 101, tubeExternalId: 501 } }],
        },
      ],
    );

    expect(series.shots[0]).toMatchObject({ shotId: 'shot-1', globalNumber: 7, armament: { id: 'armament-1' } });
  });

  it('should default tube life percentage to 100 when API data is missing', () => {
    const [series] = mapBackendToLocal([
      {
        seriesId: 'series-1',
        seriesName: 'Series 1',
        shots: [{ shotId: 'shot-1' }],
      },
    ]);

    expect(series.shots[0].armament.tubeLifePercentage).toBe(100);
  });

  it('should default tube life percentage to 100 for new shots', () => {
    const [series] = buildSeriesFromStore([
      {
        id: 'series-1',
        name: 'Series 1',
        shotQuantity: 1,
        executionOrder: 1,
        observations: '',
        shots: [{ id: 'shot-1', globalNumber: 1, observation: '' }],
      },
    ]);

    expect(series.shots[0].armament.tubeLifePercentage).toBe(100);
  });
});

describe('mapLocalToRequest', () => {
  const series: ArmamentSerie[] = [
    {
      seriesId: 'series-1',
      seriesName: 'Series 1',
      shots: [
        {
          shotId: 'shot-1',
          armament: {
            weaponType: SpecimenType.Weapon,
            weaponExternalId: '446',
            weaponName: 'Weapon',
            tubeExternalId: '447',
            tubeName: 'Tube',
            isInstrumented: true,
            tubeLifePercentage: 80,
            observations: '',
          },
        },
      ],
    },
  ];

  it.each([SpecimenType.Mortar, 'MORTAR'])('should omit tube-specific fields for %s shots', (weaponType) => {
    const mortarSeries = structuredClone(series);
    mortarSeries[0].shots[0].armament.weaponType = weaponType;

    const [request] = mapLocalToRequest(mortarSeries);

    expect(request.itemType).toBe('MORTAR');
    expect(request.weaponExternalId).toBe(446);
    expect(request.tubeExternalId).toBeUndefined();
    expect(request.isInstrumented).toBeUndefined();
    expect(request.lifeUsefulPercentage).toBeUndefined();
    expect(JSON.stringify(request)).not.toContain('"tubeExternalId"');
    expect(JSON.stringify(request)).not.toContain('"isInstrumented"');
    expect(JSON.stringify(request)).not.toContain('"lifeUsefulPercentage"');
  });

  it('should preserve tube-specific fields for weapon shots', () => {
    const [request] = mapLocalToRequest(series);

    expect(request.itemType).toBe('WEAPON');
    expect(request.tubeExternalId).toBe(447);
    expect(request.isInstrumented).toBe(true);
    expect(request.lifeUsefulPercentage).toBe(80);
  });
});
