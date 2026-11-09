import type { TrialMunitionsRawItem } from '@intaqalab/data-access-planning';
import { describe, expect, it } from 'vitest';

import { isEspoletaComponent, selectFuseMeasurement } from './planning-fuse.selectors';

function munitionsResponse(): TrialMunitionsRawItem {
  return {
    series: [
      {
        seriesId: 'series-1',
        seriesName: 'Serie 1',
        configurations: [
          {
            id: 'config-1',
            seriesId: 'series-1',
            denomination: null,
            assignedShotIds: ['shot-2'],
            components: [
              {
                fuseMeasurement: 42,
                type: { id: 'type-1', type: 'FUZE', label: 'Espoleta' },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('planning-fuse.selectors', () => {
  it('returns the planned fuse graduation for the assigned shot', () => {
    expect(selectFuseMeasurement(munitionsResponse(), 'series-1', 'shot-2')).toBe(42);
  });

  it('returns null for a shot not assigned to the configuration', () => {
    expect(selectFuseMeasurement(munitionsResponse(), 'series-1', 'shot-1')).toBeNull();
  });

  it('returns null when the series does not exist', () => {
    expect(selectFuseMeasurement(munitionsResponse(), 'series-404', 'shot-2')).toBeNull();
  });

  it('detects fuse components by type, label or fuse data', () => {
    expect(isEspoletaComponent({ type: { id: '1', type: 'FUZE', label: '' } })).toBe(true);
    expect(isEspoletaComponent({ type: { id: '1', type: '', label: 'Espoleta de proximidad' } })).toBe(true);
    expect(isEspoletaComponent({ fuseMeasurement: 10 })).toBe(true);
    expect(isEspoletaComponent({ type: { id: '1', type: 'GRENADE', label: 'Granada' } })).toBe(false);
  });
});
