import { SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { PropellantChargeParametersResponse } from '../../models/propelling-charge-parameters.models';
import {
  mapPropellantChargeParametersToSeries,
  mapPropellantChargeSeriesItem,
  normalizePowderWeightToGrams,
  normalizeSpeedToMs,
} from './informacion-tarado.mapper';

describe('informacion-tarado.mapper', () => {
  describe('normalizePowderWeightToGrams', () => {
    it('returns null when weight is null or undefined', () => {
      expect(normalizePowderWeightToGrams(null, WeightUnitEnum.KG)).toBeNull();
      expect(normalizePowderWeightToGrams(undefined, undefined)).toBeNull();
    });

    it('converts KG to grams properly', () => {
      expect(normalizePowderWeightToGrams(3.75, WeightUnitEnum.KG)).toBe(3750);
      expect(normalizePowderWeightToGrams(0.5, WeightUnitEnum.KG)).toBe(500);
    });

    it('keeps G unchanged', () => {
      expect(normalizePowderWeightToGrams(400, WeightUnitEnum.G)).toBe(400);
    });

    it('heuristically converts small weights without unit as kg', () => {
      expect(normalizePowderWeightToGrams(4.2, undefined)).toBe(4200);
      expect(normalizePowderWeightToGrams(450, undefined)).toBe(450);
    });
  });

  describe('normalizeSpeedToMs', () => {
    it('returns null when speed is null or undefined', () => {
      expect(normalizeSpeedToMs(null, SpeedUnitEnum.M_S)).toBeNull();
      expect(normalizeSpeedToMs(undefined, undefined)).toBeNull();
    });

    it('returns m/s value directly when unit is M_S or undefined', () => {
      expect(normalizeSpeedToMs(780, SpeedUnitEnum.M_S)).toBe(780);
      expect(normalizeSpeedToMs(810, undefined)).toBe(810);
    });

    it('converts KM_H to m/s', () => {
      expect(normalizeSpeedToMs(360, SpeedUnitEnum.KM_H)).toBe(100);
    });
  });

  describe('mapPropellantChargeSeriesItem', () => {
    it('maps all fields correctly with S prefix for seriesNumber', () => {
      const item = {
        seriesId: '550e8400-e29b-41d4-a716-446655440100',
        seriesNumber: 1,
        seriesName: 'Tarado pólvora tipo A Zona 1 baja',
        loadingZone: 'Z1',
        nominalSpeed: 780,
        nominalSpeedUnit: SpeedUnitEnum.M_S,
        maximumSpeedDeviation: 10,
        maximumSpeedDeviationUnit: SpeedUnitEnum.M_S,
        powderWeight: 3.75,
        powderWeightUnit: WeightUnitEnum.KG,
        observations: 'Parámetros uniformes en la serie.',
      };

      const result = mapPropellantChargeSeriesItem(item);

      expect(result).toEqual({
        numero: 'S1',
        nombre: 'Tarado pólvora tipo A Zona 1 baja',
        zona: 'Z1',
        velocidadNominal: 780,
        desviacionVelocidadMax: 10,
        pesoPolvora: 3750,
        seriesId: '550e8400-e29b-41d4-a716-446655440100',
        observations: 'Parámetros uniformes en la serie.',
      });
    });

    it('keeps existing S prefix if already present in seriesNumber string', () => {
      const item = {
        seriesId: 'id-2',
        seriesNumber: 'S2' as unknown as number,
        seriesName: 'Serie 2',
        loadingZone: null,
        nominalSpeed: null,
        maximumSpeedDeviation: null,
        powderWeight: null,
        observations: null,
      };

      const result = mapPropellantChargeSeriesItem(item);
      expect(result.numero).toBe('S2');
      expect(result.zona).toBeNull();
      expect(result.velocidadNominal).toBeNull();
      expect(result.pesoPolvora).toBeNull();
    });
  });

  describe('mapPropellantChargeParametersToSeries', () => {
    it('returns empty array when response is null or empty', () => {
      expect(mapPropellantChargeParametersToSeries(null)).toEqual([]);
      expect(mapPropellantChargeParametersToSeries(undefined)).toEqual([]);
      expect(mapPropellantChargeParametersToSeries({ series: [] })).toEqual([]);
    });

    it('maps an entire response with multiple series', () => {
      const response: PropellantChargeParametersResponse = {
        series: [
          {
            seriesId: 'id-1',
            seriesNumber: 1,
            seriesName: 'Serie 1',
            loadingZone: 'Z1',
            nominalSpeed: 780,
            nominalSpeedUnit: SpeedUnitEnum.M_S,
            maximumSpeedDeviation: 10,
            maximumSpeedDeviationUnit: SpeedUnitEnum.M_S,
            powderWeight: 3.75,
            powderWeightUnit: WeightUnitEnum.KG,
            observations: null,
          },
          {
            seriesId: 'id-2',
            seriesNumber: 2,
            seriesName: 'Serie 2',
            loadingZone: 'Z2',
            nominalSpeed: 820,
            nominalSpeedUnit: SpeedUnitEnum.M_S,
            maximumSpeedDeviation: 12,
            maximumSpeedDeviationUnit: SpeedUnitEnum.M_S,
            powderWeight: 450,
            powderWeightUnit: WeightUnitEnum.G,
            observations: 'Test observation',
          },
        ],
      };

      const mapped = mapPropellantChargeParametersToSeries(response);

      expect(mapped).toHaveLength(2);
      expect(mapped[0].numero).toBe('S1');
      expect(mapped[0].pesoPolvora).toBe(3750);
      expect(mapped[1].numero).toBe('S2');
      expect(mapped[1].pesoPolvora).toBe(450);
      expect(mapped[1].observations).toBe('Test observation');
    });
  });
});
