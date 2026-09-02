import { TimeUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { ShotTopographyResponse } from '../../models/shot-topography.models';
import {
  extractTopographyData,
  mapPlanningSeriesToOptions,
  mapRemoteToTopographyState,
  mapShotStatusToClass,
  mapShotStatusToLabel,
  mapShotsToDisparoOptions,
  mapTimeUnitToApi,
  mapTimeUnitToUi,
  mapTopographyStateToRequest,
  numToField,
  parseNum,
} from './topography-introduction.mapper';

describe('topography-introduction.mapper', () => {
  describe('numToField', () => {
    it('returns null when value is null or undefined', () => {
      expect(numToField(null, 's')).toBeNull();
      expect(numToField(undefined, 's')).toBeNull();
    });

    it('returns formatted object with string value and unit', () => {
      expect(numToField(15.5, 's')).toEqual({ value: '15.5', unit: 's' });
    });
  });

  describe('parseNum', () => {
    it('returns null when field is null or empty', () => {
      expect(parseNum(null)).toBeNull();
      expect(parseNum({ value: '', unit: 's' })).toBeNull();
      expect(parseNum({ value: '   ', unit: 's' })).toBeNull();
    });

    it('parses valid numeric string to float', () => {
      expect(parseNum({ value: '45.75', unit: 's' })).toBe(45.75);
    });

    it('returns null when value is not a valid number', () => {
      expect(parseNum({ value: 'invalid', unit: 's' })).toBeNull();
    });
  });

  describe('unit mappers', () => {
    it('mapTimeUnitToApi converts strings and enums correctly', () => {
      expect(mapTimeUnitToApi('s')).toBe(TimeUnitEnum.S);
      expect(mapTimeUnitToApi('ms')).toBe(TimeUnitEnum.MS);
      expect(mapTimeUnitToApi(TimeUnitEnum.S)).toBe(TimeUnitEnum.S);
      expect(mapTimeUnitToApi(null)).toBeNull();
    });

    it('mapTimeUnitToUi converts API enums to UI strings', () => {
      expect(mapTimeUnitToUi(TimeUnitEnum.S)).toBe('s');
      expect(mapTimeUnitToUi(TimeUnitEnum.MS)).toBe('ms');
      expect(mapTimeUnitToUi(null, 's')).toBe('s');
    });
  });

  describe('mapShotStatusToLabel and mapShotStatusToClass', () => {
    it('maps EN_CURSO correctly', () => {
      expect(mapShotStatusToLabel('EN_CURSO')).toBe('En curso');
      expect(mapShotStatusToClass('EN_CURSO')).toBe('bg-green-100 text-green-700');
    });

    it('maps PENDIENTE correctly', () => {
      expect(mapShotStatusToLabel('PENDIENTE')).toBe('Pendiente');
      expect(mapShotStatusToClass('PENDIENTE')).toBe('bg-yellow-100 text-yellow-700');
    });

    it('maps EJECUTADA correctly', () => {
      expect(mapShotStatusToLabel('EJECUTADA')).toBe('Ejecutada');
      expect(mapShotStatusToClass('EJECUTADA')).toBe('bg-blue-100 text-blue-700');
    });

    it('maps fallback status for null or unknown', () => {
      expect(mapShotStatusToLabel(null)).toBe('—');
      expect(mapShotStatusToClass(null)).toBe('bg-slate-100 text-slate-500');
    });
  });

  describe('mapPlanningSeriesToOptions', () => {
    it('maps planning series array to select options', () => {
      const result = mapPlanningSeriesToOptions([
        { id: 'serie-1', name: 'Serie Uno' },
        { id: 'serie-2', name: '' },
      ]);

      expect(result).toEqual([
        { value: 'serie-1', label: 'Serie Uno' },
        { value: 'serie-2', label: 'Serie 2' },
      ]);
    });

    it('returns fallback options when series list is empty or null', () => {
      const fallback = [{ value: 'def-1', label: 'Default' }];
      expect(mapPlanningSeriesToOptions([], fallback)).toEqual(fallback);
      expect(mapPlanningSeriesToOptions(null, fallback)).toEqual(fallback);
    });
  });

  describe('mapShotsToDisparoOptions', () => {
    it('maps shot array to select options', () => {
      const result = mapShotsToDisparoOptions([{ shotId: 'shot-1' }, { shotId: 'shot-2' }]);

      expect(result).toEqual([
        { value: 'shot-1', label: 'Disparo 1' },
        { value: 'shot-2', label: 'Disparo 2' },
      ]);
    });

    it('returns fallback options when shot list is empty or null', () => {
      const fallback = [{ value: 'def-1', label: 'Default' }];
      expect(mapShotsToDisparoOptions([], fallback)).toEqual(fallback);
      expect(mapShotsToDisparoOptions(null, fallback)).toEqual(fallback);
    });
  });

  describe('extractTopographyData', () => {
    it('returns null when response or topographyData is null', () => {
      expect(extractTopographyData(null)).toBeNull();
      expect(extractTopographyData({ topographyData: null })).toBeNull();
    });

    it('returns topographyData from response', () => {
      const data = { chronometerId: 'chrono-01' };
      expect(extractTopographyData({ topographyData: data })).toEqual(data);
    });
  });

  describe('mapRemoteToTopographyState', () => {
    it('returns empty object when response or topographyData is null', () => {
      expect(mapRemoteToTopographyState(null)).toEqual({});
      expect(mapRemoteToTopographyState({ topographyData: null })).toEqual({});
    });

    it('maps complete remote response to state structures', () => {
      const response: ShotTopographyResponse = {
        topographyData: {
          chronometerId: 'crono-01',
          flightTime: 23.4,
          flightTimeUnit: TimeUnitEnum.S,
          illuminationTime: 12.1,
          illuminationTimeUnit: TimeUnitEnum.S,
          smokeTrailCount: 3,
          observations: 'Test observation',
        },
      };

      const result = mapRemoteToTopographyState(response);

      expect(result.equipo).toBe('crono-01');
      expect(result.tiempoVuelo).toBe(23.4);
      expect(result.tiempoVueloUnit).toBe('s');
      expect(result.tiempoIluminacion).toBe(12.1);
      expect(result.tiempoIluminacionUnit).toBe('s');
      expect(result.numeroEstelaHumo).toBe(3);
      expect(result.observaciones).toBe('Test observation');
    });
  });

  describe('mapTopographyStateToRequest', () => {
    it('converts component state to PUT request body', () => {
      const state = {
        equipo: 'crono-02',
        tiempoVuelo: 14.2,
        tiempoVueloUnit: 's',
        tiempoIluminacion: 8.5,
        tiempoIluminacionUnit: 's',
        numeroEstelaHumo: 2,
        observaciones: 'Saved obs',
      };

      const request = mapTopographyStateToRequest(state);

      expect(request.chronometerId).toBe('crono-02');
      expect(request.flightTime).toBe(14.2);
      expect(request.flightTimeUnit).toBe(TimeUnitEnum.S);
      expect(request.illuminationTime).toBe(8.5);
      expect(request.illuminationTimeUnit).toBe(TimeUnitEnum.S);
      expect(request.smokeTrailCount).toBe(2);
      expect(request.observations).toBe('Saved obs');
    });
  });
});
