import { DistanceUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import {
  calculateShotOrder,
  extractJltData,
  findLastShotId,
  isShotInSerie,
  mapEstadoDisparoToClass,
  mapEstadoDisparoToLabel,
  mapJltShotStateToRequest,
  mapPlanningSeriesToOptions,
  mapPlanningShotsToDisparoOptions,
  mapRemoteToJltShotState,
  mapShotStatusToEstadoDisparo,
  numToField,
  parseNum,
} from './jlt-shot-data.mapper';

describe('jlt-shot-data.mapper', () => {
  describe('numToField and parseNum', () => {
    it('converts number to field structure', () => {
      expect(numToField(25, 'mm')).toEqual({ value: '25', unit: 'mm' });
      expect(numToField(0, 'mm')).toEqual({ value: '0', unit: 'mm' });
      expect(numToField(null, 'mm')).toBeNull();
      expect(numToField(undefined, 'mm')).toBeNull();
    });

    it('parses valid numeric field to float', () => {
      expect(parseNum({ value: '12.5', unit: 'mm' })).toBe(12.5);
      expect(parseNum({ value: '0', unit: 'mm' })).toBe(0);
      expect(parseNum(null)).toBeNull();
      expect(parseNum({ value: '', unit: 'mm' })).toBeNull();
      expect(parseNum({ value: 'invalid', unit: 'mm' })).toBeNull();
    });
  });

  describe('status mappers', () => {
    it('maps shot status to estado disparo', () => {
      expect(mapShotStatusToEstadoDisparo('ACTIVE')).toBe('EN_CURSO');
      expect(mapShotStatusToEstadoDisparo('PENDING')).toBe('PENDIENTE');
      expect(mapShotStatusToEstadoDisparo('FIRED')).toBe('EJECUTADA');
      expect(mapShotStatusToEstadoDisparo(null, 'PENDIENTE')).toBe('PENDIENTE');
    });

    it('maps estado disparo to display label', () => {
      expect(mapEstadoDisparoToLabel('EN_CURSO')).toBe('En curso');
      expect(mapEstadoDisparoToLabel('PENDIENTE')).toBe('Pendiente');
      expect(mapEstadoDisparoToLabel('EJECUTADA')).toBe('Ejecutada');
      expect(mapEstadoDisparoToLabel(null)).toBe('—');
    });

    it('maps estado disparo to badge CSS classes', () => {
      expect(mapEstadoDisparoToClass('EN_CURSO')).toBe('bg-green-100 text-green-700');
      expect(mapEstadoDisparoToClass('PENDIENTE')).toBe('bg-blue-100 text-blue-700');
      expect(mapEstadoDisparoToClass('EJECUTADA')).toBe('bg-gray-100 text-gray-600');
      expect(mapEstadoDisparoToClass(null)).toBe('bg-gray-100 text-gray-500');
    });
  });

  describe('options mappers', () => {
    it('maps planning series to options with fallback', () => {
      const fallback = [{ value: 'fb-1', label: 'Fallback 1' }];
      expect(mapPlanningSeriesToOptions(null, fallback)).toEqual(fallback);
      expect(mapPlanningSeriesToOptions([], fallback)).toEqual(fallback);

      const series = [
        { id: 's-1', name: 'Serie Uno' },
        { id: 's-2', name: '   ' },
      ];
      expect(mapPlanningSeriesToOptions(series, fallback)).toEqual([
        { value: 's-1', label: 'Serie Uno' },
        { value: 's-2', label: 'Serie 2' },
      ]);
    });

    it('maps planning or progress shots to disparo options', () => {
      const fallback = [{ value: 'sh-fb', label: 'Disparo FB' }];

      expect(
        mapPlanningShotsToDisparoOptions({ id: 's-1', shots: [{ id: 'shot-1', globalNumber: 10 }] }, null, fallback),
      ).toEqual([{ value: 'shot-1', label: 'Disparo 10' }]);

      expect(
        mapPlanningShotsToDisparoOptions(null, { seriesId: 's-1', shots: [{ shotId: 'shot-prog-1' }] }, fallback),
      ).toEqual([{ value: 'shot-prog-1', label: 'Disparo 1' }]);

      expect(mapPlanningShotsToDisparoOptions(null, null, fallback)).toEqual(fallback);
    });
  });

  describe('series and shot navigation helpers', () => {
    const progress = [
      {
        seriesId: 's-1',
        shots: [{ shotId: 'shot-1' }, { shotId: 'shot-2' }],
      },
      {
        seriesId: 's-2',
        shots: [{ shotId: 'shot-3' }],
      },
    ];

    it('finds last shot id in series', () => {
      expect(findLastShotId(progress, 's-1')).toBe('shot-2');
      expect(findLastShotId(progress, 's-2')).toBe('shot-3');
      expect(findLastShotId(progress, 's-unknown')).toBeNull();
      expect(findLastShotId(null, 's-1')).toBeNull();
    });

    it('calculates global shot order across series', () => {
      expect(calculateShotOrder(progress, 's-1', 'shot-1')).toBe(0);
      expect(calculateShotOrder(progress, 's-1', 'shot-2')).toBe(1);
      expect(calculateShotOrder(progress, 's-2', 'shot-3')).toBe(2);
      expect(calculateShotOrder(progress, 's-1', 'shot-unknown')).toBeNull();
      expect(calculateShotOrder(null, 's-1', 'shot-1')).toBeNull();
    });

    it('verifies if shot exists in serie', () => {
      expect(isShotInSerie('shot-1', 's-1', progress, null)).toBe(true);
      expect(isShotInSerie('shot-3', 's-1', progress, null)).toBe(false);
      expect(isShotInSerie(null, 's-1', progress, null)).toBe(false);

      const planning = [{ id: 's-plan', shots: [{ id: 'shot-plan-1' }] }];
      expect(isShotInSerie('shot-plan-1', 's-plan', null, planning)).toBe(true);
    });
  });

  describe('remote data and request mapping', () => {
    it('extracts JLT payload from flat and wrapped responses', () => {
      const payload = {
        jet: 'JET-01',
        pieceOperator: 'OP-01',
        attackDistance: 12.5,
        attackDistanceUnit: DistanceUnitEnum.MM,
        recoilDistance: 8.3,
        recoilDistanceUnit: DistanceUnitEnum.MM,
        observations: 'OK',
      };

      expect(extractJltData(payload)).toEqual(payload);
      expect(extractJltData({ jltData: payload })).toEqual(payload);
      expect(extractJltData(null)).toEqual({
        jet: '',
        pieceOperator: '',
        attackDistance: null,
        attackDistanceUnit: DistanceUnitEnum.MM,
        recoilDistance: null,
        recoilDistanceUnit: DistanceUnitEnum.MM,
        observations: null,
      });
    });

    it('maps remote response to state with defaults', () => {
      const inheritedDefaults = { jet: 'JET-DEF', pieceOperator: 'OP-DEF' };
      const selection = { serie: 's-1', disparo: 'shot-1', estadoDisparo: 'EN_CURSO' as const };

      const stateWithEmptyRemote = mapRemoteToJltShotState(null, inheritedDefaults, selection);
      expect(stateWithEmptyRemote).toEqual({
        serie: 's-1',
        disparo: 'shot-1',
        jet: 'JET-DEF',
        operadorPieza: 'OP-DEF',
        observaciones: null,
        atacado: null,
        retroceso: null,
        estadoDisparo: 'EN_CURSO',
      });

      const stateWithRemote = mapRemoteToJltShotState(
        {
          jet: 'JET-REMOTE',
          pieceOperator: 'OP-REMOTE',
          attackDistance: 20,
          recoilDistance: 15,
          observations: 'Obs',
        },
        inheritedDefaults,
        selection,
      );
      expect(stateWithRemote.jet).toBe('JET-REMOTE');
      expect(stateWithRemote.operadorPieza).toBe('OP-REMOTE');
      expect(stateWithRemote.atacado).toBe(20);
      expect(stateWithRemote.retroceso).toBe(15);
      expect(stateWithRemote.observaciones).toBe('Obs');
    });

    it('maps state to request payload', () => {
      const request = mapJltShotStateToRequest({
        jet: 'JET-01',
        operadorPieza: 'OP-01',
        atacado: 10,
        retroceso: 5,
        observaciones: 'None',
      });

      expect(request).toEqual({
        jet: 'JET-01',
        pieceOperator: 'OP-01',
        attackDistance: 10,
        attackDistanceUnit: DistanceUnitEnum.MM,
        recoilDistance: 5,
        recoilDistanceUnit: DistanceUnitEnum.MM,
        observations: 'None',
      });
    });
  });
});
