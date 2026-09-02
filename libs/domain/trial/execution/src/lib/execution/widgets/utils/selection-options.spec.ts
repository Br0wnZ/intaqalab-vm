import { describe, expect, it } from 'vitest';

import { mapPlanningSeriesToOptions, mapShotsToDisparoOptions } from './selection-options';

describe('selection-options', () => {
  describe('mapPlanningSeriesToOptions', () => {
    it('maps planning series to selector options', () => {
      const planning = [
        { id: 's-1', name: 'Calentamiento' },
        { id: 's-2', name: null },
      ];
      const result = mapPlanningSeriesToOptions(planning);
      expect(result).toEqual([
        { value: 's-1', label: 'Calentamiento' },
        { value: 's-2', label: 'Serie 2' },
      ]);
    });

    it('returns fallback options when planning is empty or null', () => {
      const fallback = [{ value: 'fb-1', label: 'Fallback' }];
      expect(mapPlanningSeriesToOptions([], fallback)).toEqual(fallback);
      expect(mapPlanningSeriesToOptions(null, fallback)).toEqual(fallback);
      expect(mapPlanningSeriesToOptions(undefined, fallback)).toEqual(fallback);
    });
  });

  describe('mapShotsToDisparoOptions', () => {
    it('maps shots to selector options', () => {
      const shots = [{ shotId: 'shot-1' }, { id: 'shot-2' }, {}];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = mapShotsToDisparoOptions(shots as any);
      expect(result).toEqual([
        { value: 'shot-1', label: 'Disparo 1' },
        { value: 'shot-2', label: 'Disparo 2' },
        { value: 'disparo-3', label: 'Disparo 3' },
      ]);
    });

    it('returns fallback options when shots is empty or null', () => {
      const fallback = [{ value: 'd-fb', label: 'Disparo FB' }];
      expect(mapShotsToDisparoOptions([], fallback)).toEqual(fallback);
      expect(mapShotsToDisparoOptions(null, fallback)).toEqual(fallback);
      expect(mapShotsToDisparoOptions(undefined, fallback)).toEqual(fallback);
    });
  });
});
