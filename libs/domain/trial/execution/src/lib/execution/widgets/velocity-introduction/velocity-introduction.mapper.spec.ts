import { CadenceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { ShotVelocitiesResponse } from '../../../services/execution.service';
import {
  buildRadarAntenaCombinedValue,
  deepClone,
  mapPlanningSeriesToOptions,
  mapRemoteToVelocityState,
  mapShotStatusToEstadoDisparo,
  mapShotsToDisparoOptions,
  mapVelocityFormToRequest,
  numToField,
  parseNum,
  splitRadarAntenaCombinedValue,
} from './velocity-introduction.mapper';

describe('velocity-introduction.mapper', () => {
  describe('numToField', () => {
    it('returns null when value is null', () => {
      expect(numToField(null, 'm/s')).toBeNull();
    });

    it('returns formatted object with string value and unit', () => {
      expect(numToField(850.5, 'm/s')).toEqual({ value: '850.5', unit: 'm/s' });
    });
  });

  describe('parseNum', () => {
    it('returns null when field is null', () => {
      expect(parseNum(null)).toBeNull();
    });

    it('parses valid numeric string to float', () => {
      expect(parseNum({ value: '123.45', unit: 'm/s' })).toBe(123.45);
    });

    it('returns null when value is not a valid number', () => {
      expect(parseNum({ value: 'abc', unit: 'm/s' })).toBeNull();
    });
  });

  describe('mapShotStatusToEstadoDisparo', () => {
    it('maps ACTIVE status to EN_CURSO', () => {
      expect(mapShotStatusToEstadoDisparo('ACTIVE')).toBe('EN_CURSO');
    });

    it('maps PENDING status to PENDIENTE', () => {
      expect(mapShotStatusToEstadoDisparo('PENDING')).toBe('PENDIENTE');
    });

    it('maps FIRED status to EJECUTADA', () => {
      expect(mapShotStatusToEstadoDisparo('FIRED')).toBe('EJECUTADA');
    });

    it('returns fallback status for unknown or null status', () => {
      expect(mapShotStatusToEstadoDisparo(null, 'PENDIENTE')).toBe('PENDIENTE');
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

  describe('mapRemoteToVelocityState', () => {
    it('maps remote shot velocities response to state slice', () => {
      const response: ShotVelocitiesResponse = {
        velocities: [
          {
            radarDopplerId: 2,
            antennaId: 5,
            initialVelocity: 900.2,
            initialVelocityUnit: SpeedUnitEnum.M_S,
            softwareUncertainty: 0.8,
            softwareUncertaintyUnit: SpeedUnitEnum.M_S,
            velocityLoss: 1.5,
            velocityLossUnit: SpeedUnitEnum.M_S,
            cadence: 550,
            cadenceUnit: CadenceUnitEnum.SPM,
            observations: 'Normal shot',
          },
        ],
      };

      const result = mapRemoteToVelocityState(response, 'serie-1', 'shot-1', 'EN_CURSO', {
        radarDoppler: null,
        antena: null,
      });

      expect(result).toEqual({
        serie: 'serie-1',
        disparo: 'shot-1',
        radarDoppler: '2',
        antena: '5',
        velocidad: 900.2,
        velocidadUnit: SpeedUnitEnum.M_S,
        incertidumbreSoftware: 0.8,
        incertidumbreSoftwareUnit: SpeedUnitEnum.M_S,
        perdida: 1.5,
        perdidaUnit: SpeedUnitEnum.M_S,
        cadencia: 550,
        cadenciaUnit: CadenceUnitEnum.SPM,
        observaciones: 'Normal shot',
        estadoDisparo: 'EN_CURSO',
      });
    });

    it('handles empty velocities array with defaults', () => {
      const response: ShotVelocitiesResponse = { velocities: [] };
      const currentDataForm = { radarDoppler: '1', antena: '4' };

      const result = mapRemoteToVelocityState(response, 'serie-1', 'shot-1', 'EN_CURSO', currentDataForm);

      expect(result).toEqual({
        serie: 'serie-1',
        disparo: 'shot-1',
        radarDoppler: '1',
        antena: '4',
        velocidad: null,
        velocidadUnit: SpeedUnitEnum.M_S,
        incertidumbreSoftware: null,
        incertidumbreSoftwareUnit: SpeedUnitEnum.M_S,
        perdida: null,
        perdidaUnit: SpeedUnitEnum.M_S,
        cadencia: null,
        cadenciaUnit: CadenceUnitEnum.SPM,
        observaciones: null,
        estadoDisparo: 'EN_CURSO',
      });
    });
  });

  describe('buildRadarAntenaCombinedValue & splitRadarAntenaCombinedValue', () => {
    it('combines and splits valid radar and antenna IDs', () => {
      const combined = buildRadarAntenaCombinedValue('3', '6');
      expect(combined).toBe('3|6');
      expect(splitRadarAntenaCombinedValue(combined)).toEqual({ radarId: '3', antennaId: '6' });
    });

    it('returns null when either ID is missing', () => {
      expect(buildRadarAntenaCombinedValue(null, '6')).toBeNull();
      expect(buildRadarAntenaCombinedValue('3', null)).toBeNull();
      expect(splitRadarAntenaCombinedValue(null)).toEqual({ radarId: null, antennaId: null });
      expect(splitRadarAntenaCombinedValue('invalid')).toEqual({ radarId: null, antennaId: null });
    });
  });

  describe('mapVelocityFormToRequest', () => {
    it('creates request payload from form inputs', () => {
      const request = mapVelocityFormToRequest({
        radarAntena: '3|6',
        initialVelocity: 870,
        initialVelocityUnit: SpeedUnitEnum.M_S,
        softwareUncertainty: 0.4,
        softwareUncertaintyUnit: SpeedUnitEnum.M_S,
        velocityLoss: 3.2,
        velocityLossUnit: SpeedUnitEnum.M_S,
        cadence: 650,
        cadenceUnit: CadenceUnitEnum.SPM,
        observations: 'Tested',
      });

      expect(request).toEqual([
        {
          radarDopplerId: 3,
          antennaId: 6,
          initialVelocity: 870,
          initialVelocityUnit: SpeedUnitEnum.M_S,
          softwareUncertainty: 0.4,
          softwareUncertaintyUnit: SpeedUnitEnum.M_S,
          velocityLoss: 3.2,
          velocityLossUnit: SpeedUnitEnum.M_S,
          cadence: 650,
          cadenceUnit: CadenceUnitEnum.SPM,
          observations: 'Tested',
        },
      ]);
    });
  });

  describe('deepClone', () => {
    it('creates deep cloned copy of an object', () => {
      const original = { a: 1, nested: { b: 2 } };
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.nested).not.toBe(original.nested);
    });
  });
});
