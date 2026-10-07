import { describe, expect, it } from 'vitest';

import {
  mapPlanningSeriesToOptions,
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
  mapShotOptionsToPlanningNumbers,
  mapShotsToDisparoOptions,
} from './selection-options';

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

    it('uses globalNumber when available', () => {
      const result = mapShotsToDisparoOptions([
        { shotId: 'shot-1', globalNumber: 10 },
        { shotId: 'shot-2', globalNumber: null },
      ]);

      expect(result).toEqual([
        { value: 'shot-1', label: 'Disparo 10' },
        { value: 'shot-2', label: 'Disparo 2' },
      ]);
    });

    it('enriches progress shots with planning global numbers by shot ID', () => {
      const result = mapShotsToDisparoOptions(
        [{ shotId: 'shot-b' }, { shotId: 'shot-a' }],
        [],
        [
          { id: 'shot-a', globalNumber: 12 },
          { id: 'shot-b', globalNumber: 4 },
        ],
      );

      expect(result).toEqual([
        { value: 'shot-b', label: 'Disparo 4' },
        { value: 'shot-a', label: 'Disparo 12' },
      ]);
    });

    it('returns fallback options when shots is empty or null', () => {
      const fallback = [{ value: 'd-fb', label: 'Disparo FB' }];
      expect(mapShotsToDisparoOptions([], fallback)).toEqual(fallback);
      expect(mapShotsToDisparoOptions(null, fallback)).toEqual(fallback);
      expect(mapShotsToDisparoOptions(undefined, fallback)).toEqual(fallback);
    });
  });

  describe('mapShotOptionsToPlanningNumbers', () => {
    it('applies planning global numbers to stored shot options by ID', () => {
      const result = mapShotOptionsToPlanningNumbers(
        [
          { value: 'shot-b', label: 'Disparo 2' },
          { value: 'shot-unknown', label: 'Custom shot' },
        ],
        [
          { id: 'shot-a', globalNumber: 12 },
          { id: 'shot-b', globalNumber: 4 },
        ],
      );

      expect(result).toEqual([
        { value: 'shot-b', label: 'Disparo 4' },
        { value: 'shot-unknown', label: 'Custom shot' },
      ]);
    });
  });

  describe('mapSelectedShotStatus', () => {
    const progress = {
      series: [
        {
          seriesId: 'serie-1',
          shots: [
            { shotId: 'shot-active', status: 'ACTIVE' },
            { shotId: 'shot-pending', status: 'PENDING' },
            { shotId: 'shot-fired', status: 'FIRED' },
          ],
        },
      ],
    };

    it('maps the selected shot progress status', () => {
      expect(mapSelectedShotStatus(progress, 'serie-1', 'shot-fired', null, null, null)).toBe('EJECUTADA');
      expect(mapSelectedShotStatus(progress, 'serie-1', 'shot-pending', null, null, null)).toBe('PENDIENTE');
      expect(mapSelectedShotStatus(progress, 'serie-1', 'shot-active', null, null, null)).toBe('EN_CURSO');
    });

    it('prefers active selection and uses fallback when progress is missing', () => {
      expect(mapSelectedShotStatus(progress, 'serie-1', 'shot-fired', 'serie-1', 'shot-fired', 'PENDIENTE')).toBe(
        'EN_CURSO',
      );
      expect(mapSelectedShotStatus(progress, 'serie-2', 'unknown-shot', null, null, 'PENDIENTE')).toBe('PENDIENTE');
    });
  });

  describe('selected shot status display', () => {
    it('uses consistent labels and classes for each status', () => {
      expect(mapSelectedShotStatusLabel('EN_CURSO')).toBe('En curso');
      expect(mapSelectedShotStatusClass('EN_CURSO')).toBe('bg-blue-100 text-blue-700');
      expect(mapSelectedShotStatusLabel('PENDIENTE')).toBe('Pendiente');
      expect(mapSelectedShotStatusClass('PENDIENTE')).toBe('bg-slate-100 text-slate-700');
      expect(mapSelectedShotStatusLabel('EJECUTADA')).toBe('Ejecutado');
      expect(mapSelectedShotStatusClass('EJECUTADA')).toBe('bg-green-100 text-green-700');
    });

    it('returns empty display values when status is missing or unknown', () => {
      expect(mapSelectedShotStatusLabel(null)).toBe('');
      expect(mapSelectedShotStatusClass(null)).toBe('');
      expect(mapSelectedShotStatusLabel('UNKNOWN')).toBe('');
      expect(mapSelectedShotStatusClass('UNKNOWN')).toBe('');
    });
  });
});
