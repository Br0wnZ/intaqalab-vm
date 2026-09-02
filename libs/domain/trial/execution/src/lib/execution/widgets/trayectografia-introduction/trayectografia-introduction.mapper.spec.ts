import { DistanceUnitEnum, TimeUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { ShotTrajectographyResponse } from '../../models/shot-trajectography.models';
import {
  extractTrayectografiaData,
  mapDistanceUnitToApi,
  mapDistanceUnitToUi,
  mapPlanningSeriesToOptions,
  mapRemoteToTrayectografiaState,
  mapShotStatusToClass,
  mapShotStatusToLabel,
  mapShotsToDisparoOptions,
  mapTimeUnitToApi,
  mapTimeUnitToUi,
  mapTrayectografiaStateToRequest,
  numToField,
  parseNum,
} from './trayectografia-introduction.mapper';

describe('trayectografia-introduction.mapper', () => {
  describe('numToField', () => {
    it('returns null when value is null or undefined', () => {
      expect(numToField(null, 'm')).toBeNull();
      expect(numToField(undefined, 'm')).toBeNull();
    });

    it('returns formatted object with string value and unit', () => {
      expect(numToField(120, 'm')).toEqual({ value: '120', unit: 'm' });
    });
  });

  describe('parseNum', () => {
    it('returns null when field is null or empty', () => {
      expect(parseNum(null)).toBeNull();
      expect(parseNum({ value: '', unit: 'm' })).toBeNull();
      expect(parseNum({ value: '   ', unit: 'm' })).toBeNull();
    });

    it('parses valid numeric string to float', () => {
      expect(parseNum({ value: '45.75', unit: 'm' })).toBe(45.75);
    });

    it('returns null when value is not a valid number', () => {
      expect(parseNum({ value: 'invalid', unit: 'm' })).toBeNull();
    });
  });

  describe('mapShotStatusToLabel and mapShotStatusToClass', () => {
    it('maps EN_CURSO correctly', () => {
      expect(mapShotStatusToLabel('EN_CURSO')).toBe('En curso');
      expect(mapShotStatusToClass('EN_CURSO')).toBe('bg-green-100 text-green-700');
    });

    it('maps PENDIENTE correctly', () => {
      expect(mapShotStatusToLabel('PENDIENTE')).toBe('Pendiente');
      expect(mapShotStatusToClass('PENDIENTE')).toBe('bg-amber-100 text-amber-700');
    });

    it('maps EJECUTADA correctly', () => {
      expect(mapShotStatusToLabel('EJECUTADA')).toBe('Ejecutada');
      expect(mapShotStatusToClass('EJECUTADA')).toBe('bg-blue-100 text-blue-700');
    });

    it('maps fallback status for null', () => {
      expect(mapShotStatusToLabel(null)).toBe('—');
      expect(mapShotStatusToClass(null)).toBe('bg-gray-100 text-gray-500');
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

  describe('unit mappers', () => {
    it('mapDistanceUnitToApi converts strings and enums correctly', () => {
      expect(mapDistanceUnitToApi('m')).toBe(DistanceUnitEnum.M);
      expect(mapDistanceUnitToApi('km')).toBe(DistanceUnitEnum.KM);
      expect(mapDistanceUnitToApi('mm')).toBe(DistanceUnitEnum.MM);
      expect(mapDistanceUnitToApi('μm')).toBe(DistanceUnitEnum.UM);
      expect(mapDistanceUnitToApi(null)).toBeNull();
    });

    it('mapDistanceUnitToUi converts API enums to UI strings', () => {
      expect(mapDistanceUnitToUi(DistanceUnitEnum.M)).toBe('m');
      expect(mapDistanceUnitToUi(DistanceUnitEnum.KM)).toBe('km');
      expect(mapDistanceUnitToUi(DistanceUnitEnum.MM)).toBe('mm');
      expect(mapDistanceUnitToUi(DistanceUnitEnum.UM)).toBe('μm');
      expect(mapDistanceUnitToUi(null, 'm')).toBe('m');
    });

    it('mapTimeUnitToApi converts strings and enums correctly', () => {
      expect(mapTimeUnitToApi('s')).toBe(TimeUnitEnum.S);
      expect(mapTimeUnitToApi('ms')).toBe(TimeUnitEnum.MS);
      expect(mapTimeUnitToApi(null)).toBeNull();
    });

    it('mapTimeUnitToUi converts API enums to UI strings', () => {
      expect(mapTimeUnitToUi(TimeUnitEnum.S)).toBe('s');
      expect(mapTimeUnitToUi(TimeUnitEnum.MS)).toBe('ms');
      expect(mapTimeUnitToUi(null, 's')).toBe('s');
    });
  });

  describe('extractTrayectografiaData', () => {
    it('returns null when response or trajectographyData is null', () => {
      expect(extractTrayectografiaData(null)).toBeNull();
      expect(extractTrayectografiaData({ trajectographyData: null })).toBeNull();
    });

    it('returns trajectographyData from response', () => {
      const data = { trajectographyRadarId: 'radar-1' };
      expect(extractTrayectografiaData({ trajectographyData: data })).toEqual(data);
    });
  });

  describe('mapRemoteToTrayectografiaState', () => {
    it('returns empty object when response or trajectographyData is null', () => {
      expect(mapRemoteToTrayectografiaState(null)).toEqual({});
      expect(mapRemoteToTrayectografiaState({ trajectographyData: null })).toEqual({});
    });

    it('maps complete remote response to state structures', () => {
      const response: ShotTrajectographyResponse = {
        trajectographyData: {
          trajectographyRadarId: 'radar-doppler-01',
          trajectoryData: {
            range: 1500,
            rangeUnit: DistanceUnitEnum.M,
            drift: 12,
            driftUnit: DistanceUnitEnum.M,
            flightTime: 35.5,
            flightTimeUnit: TimeUnitEnum.S,
            fuseFunctioningTime: 30,
            fuseFunctioningTimeUnit: TimeUnitEnum.S,
            fuseFunctioningHeight: 200,
            fuseFunctioningHeightUnit: DistanceUnitEnum.M,
            fuseFunctioningRange: 1400,
            fuseFunctioningRangeUnit: DistanceUnitEnum.M,
            arrow: 5,
            arrowUnit: DistanceUnitEnum.M,
            flightQualification: 'correcto',
            aerodynamicCoefficient: 0.35,
            smokeCanisterEjectionTime: 10,
            smokeCanisterEjectionTimeUnit: TimeUnitEnum.S,
            observations: 'Trajectory obs',
          },
          functioningData: {
            fuseTrajectographyFunctioning: 'ok',
            smokeMunitionRadarFunctioning: 'ok',
            illuminatingMunitionRadarFunctioning: 'ok',
            ejectedCanisterCount: 4,
            observations: 'Functioning obs',
          },
          traceData: {
            traceTime: 8,
            traceTimeUnit: TimeUnitEnum.S,
            radarTraceExistence: 'si',
            observations: 'Trace obs',
          },
        },
      };

      const result = mapRemoteToTrayectografiaState(response);

      expect(result.equipo).toBe('radar-doppler-01');
      expect(result.trayectorias?.alcance).toBe(1500);
      expect(result.trayectorias?.alcanceUnit).toBe('m');
      expect(result.trayectorias?.tiempoVuelo).toBe(35.5);
      expect(result.funcionamientos?.numeroBotesEyectados).toBe(4);
      expect(result.trazas?.tiempoTraza).toBe(8);
      expect(result.trazas?.existenciaTrazaRadar).toBe('si');
    });
  });

  describe('mapTrayectografiaStateToRequest', () => {
    it('converts component state to PUT request body', () => {
      const state = {
        equipo: 'radar-01',
        trayectorias: {
          alcance: 1200,
          alcanceUnit: 'm',
          deriva: 5,
          derivaUnit: 'm',
          tiempoVuelo: 20,
          tiempoVueloUnit: 's',
          tiempoFuncionamientoEspoleta: 15,
          tiempoFuncionamientoEspoletaUnit: 's',
          alturaFuncionamientoEspoleta: 100,
          alturaFuncionamientoEspoletaUnit: 'm',
          alcanceFuncionamientoEspoleta: 1100,
          alcanceFuncionamientoEspoletaUnit: 'm',
          flecha: 3,
          flechaUnit: 'm',
          calificacionVuelo: 'correcto',
          coeficienteAerodinamico: 0.2,
          tiempoEyeccionBotesFumigenos: 5,
          tiempoEyeccionBotesFumigenosUnit: 's',
          observaciones: 'Obs tray',
        },
        funcionamientos: {
          funcionamientoEspoletasTrayectografia: 'func-1',
          funcionamientoMunicionFumigenaRadar: 'func-2',
          funcionamientoMunicionIluminanteRadar: 'func-3',
          numeroBotesEyectados: 6,
          observaciones: 'Obs func',
        },
        trazas: {
          tiempoTraza: 4,
          tiempoTrazaUnit: 's',
          existenciaTrazaRadar: 'si',
          observaciones: 'Obs trace',
        },
      };

      const request = mapTrayectografiaStateToRequest(state);

      expect(request.trajectographyRadarId).toBe('radar-01');
      expect(request.trajectoryData?.range).toBe(1200);
      expect(request.trajectoryData?.rangeUnit).toBe(DistanceUnitEnum.M);
      expect(request.trajectoryData?.flightTimeUnit).toBe(TimeUnitEnum.S);
      expect(request.functioningData?.ejectedCanisterCount).toBe(6);
      expect(request.traceData?.traceTimeUnit).toBe(TimeUnitEnum.S);
    });
  });
});
