import { describe, expect, it } from 'vitest';

import type { ArmamentSerie } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';
import { mapLocalToRequest } from './armament.mapper';

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
