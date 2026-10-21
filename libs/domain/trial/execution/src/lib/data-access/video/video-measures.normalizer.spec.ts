import { describe, expect, it } from 'vitest';

import { EquipmentMagnitudeTagEnum } from '../../execution/models/equipment.models';
import {
  isConventionalVideoMeasure,
  isHighSpeedVideoMeasure,
  resolveObservedResultControlConfig,
  resolvePlannedVideoMagnitudes,
} from './video-measures.normalizer';

describe('video-measures.normalizer', () => {
  const userSampleMeasuresResponse = {
    series: [
      {
        seriesId: '2eb59874-82f7-4a1b-ab01-d2ab21ddf504',
        seriesName: 'Serie 2',
        measures: {
          topographyMeasures: [],
          munitionsMeasures: [],
          armamentMeasures: [],
          ballisticsMeasures: [
            {
              id: '8268cb19-c6cc-4bcf-808b-327ed694259e',
              name: 'Registro de video-vigilancia de la prueba',
              unit: 'BALLISTICS',
              measurementArea: 'Vigilancia/Seguridad',
              magnitudeCode: 'BAL_VIGILANCE',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
              name: 'Vídeo Alta Velocidad en Boca',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
              name: 'Vídeo Convencional en Boca',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
              name: 'Vídeo Convencional en Piques',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_CONV_RIVALRY',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: '56255e40-3d41-45f4-adbe-2a392bef7297',
              name: 'Vídeo Alta Velocidad en Cierre',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_SEAL',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: 'a37513db-45ff-4646-a590-143f6970994e',
              name: 'Vídeo Convencional en Blanco',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_CONV_TARJET',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
              name: 'Vídeo Alta Velocidad en Pique',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_RIVALRY',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
              name: 'Vídeo Convencional en Cierre',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_CONV_SEAL',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
            {
              id: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
              name: 'Vídeo Alta Velocidad en Blanco',
              unit: 'BALLISTICS',
              measurementArea: 'Cámaras de vídeo de alta velocidad y convencionales',
              magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_TARJET',
              minLimit: null,
              maxLimit: null,
              deviation: null,
            },
          ],
        },
      },
    ],
  };

  it('identifies high speed video measures correctly', () => {
    expect(
      isHighSpeedVideoMeasure({
        id: '1',
        name: 'Vídeo Alta Velocidad en Boca',
        magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
      }),
    ).toBe(true);

    expect(
      isHighSpeedVideoMeasure({
        id: '2',
        name: 'Vídeo Convencional en Boca',
        magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
      }),
    ).toBe(false);

    expect(
      isHighSpeedVideoMeasure({
        id: '3',
        name: 'Registro de video-vigilancia de la prueba',
        magnitudeCode: 'BAL_VIGILANCE',
      }),
    ).toBe(false);
  });

  it('identifies conventional video measures correctly', () => {
    expect(
      isConventionalVideoMeasure({
        id: '1',
        name: 'Vídeo Convencional en Boca',
        magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
      }),
    ).toBe(true);

    expect(
      isConventionalVideoMeasure({
        id: '2',
        name: 'Vídeo Alta Velocidad en Boca',
        magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
      }),
    ).toBe(false);

    expect(
      isConventionalVideoMeasure({
        id: '3',
        name: 'Registro de video-vigilancia de la prueba',
        magnitudeCode: 'BAL_VIGILANCE',
      }),
    ).toBe(false);
  });

  it('resolves Video AV magnitudes with id, value, and label from user GET measures payload', () => {
    const avMagnitudes = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, 'AV');
    expect(avMagnitudes).toHaveLength(4);
    expect(avMagnitudes).toEqual([
      {
        id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
        value: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
        label: 'Vídeo Alta Velocidad en Boca',
      },
      {
        id: '56255e40-3d41-45f4-adbe-2a392bef7297',
        value: '56255e40-3d41-45f4-adbe-2a392bef7297',
        label: 'Vídeo Alta Velocidad en Cierre',
      },
      {
        id: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
        value: '5bfb456c-fab1-4984-9bea-352ba0ace0b0',
        label: 'Vídeo Alta Velocidad en Pique',
      },
      {
        id: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
        value: '77d46c2c-4e3e-4135-8ccc-bdca22d53e05',
        label: 'Vídeo Alta Velocidad en Blanco',
      },
    ]);
  });

  it('resolves Video C magnitudes with id, value, and label from user GET measures payload', () => {
    const cMagnitudes = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, 'C');
    expect(cMagnitudes).toHaveLength(4);
    expect(cMagnitudes).toEqual([
      {
        id: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
        value: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
        label: 'Vídeo Convencional en Boca',
      },
      {
        id: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
        value: '97cdca8e-307f-41a1-91cf-b70dc731a10c',
        label: 'Vídeo Convencional en Piques',
      },
      {
        id: 'a37513db-45ff-4646-a590-143f6970994e',
        value: 'a37513db-45ff-4646-a590-143f6970994e',
        label: 'Vídeo Convencional en Blanco',
      },
      {
        id: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
        value: '2e09862a-d02f-4b30-bb7d-fb7c24d52281',
        label: 'Vídeo Convencional en Cierre',
      },
    ]);
  });

  it('accepts tag enums as videoType', () => {
    const av = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, EquipmentMagnitudeTagEnum.VIDEO_AV);
    expect(av).toHaveLength(4);

    const c = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, EquipmentMagnitudeTagEnum.VIDEO_C);
    expect(c).toHaveLength(4);
  });

  it('filters by seriesId when specified and matches', () => {
    const scoped = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, 'AV', [
      '2eb59874-82f7-4a1b-ab01-d2ab21ddf504',
    ]);
    expect(scoped).toHaveLength(4);
  });

  it('falls back to trial-wide measures if seriesId has no matching measures', () => {
    const fallback = resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, 'AV', ['unknown-series']);
    expect(fallback).toHaveLength(4);
  });

  it('returns empty array when response is null or invalid', () => {
    expect(resolvePlannedVideoMagnitudes(null, 'AV')).toEqual([]);
    expect(resolvePlannedVideoMagnitudes({}, 'AV')).toEqual([]);
    expect(resolvePlannedVideoMagnitudes({ series: [] }, 'AV')).toEqual([]);
    expect(resolvePlannedVideoMagnitudes(userSampleMeasuresResponse, null)).toEqual([]);
  });

  describe('resolveObservedResultControlConfig', () => {
    const mockCatalog = [
      {
        id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
        magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
        qualificationType: 'QUANTITATIVE',
        minValue: 0,
        maxValue: 50000,
        measureUnit: 'FPS',
      },
      {
        id: 'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
        magnitudeCode: 'BAL_CAMERA_CONV_ENTRANCE',
        qualificationType: 'QUALITATIVE',
        values: [
          { code: 'CORRECT', name: { es: 'Correcto', en: 'Correct' }, active: true },
          { code: 'DEFECTIVE', name: { es: 'Defectuoso', en: 'Defective' }, active: true },
          { code: 'INACTIVE', name: { es: 'Inactivo', en: 'Inactive' }, active: false },
        ],
      },
      {
        id: 'qual-without-values',
        magnitudeCode: 'QUAL_NO_VALS',
        qualificationType: 'QUALITATIVE',
        values: [],
      },
    ];

    it('resolves numeric config with min and max for quantitative magnitude', () => {
      const config = resolveObservedResultControlConfig(
        'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
        userSampleMeasuresResponse,
        mockCatalog,
      );

      expect(config).toEqual({
        type: 'numeric',
        isQuantitative: true,
        isQualitative: false,
        min: 0,
        max: 50000,
        options: [],
        unit: 'BALLISTICS',
      });
    });

    it('prioritizes planned minLimit and maxLimit over catalog defaults for quantitative measures', () => {
      const responseWithLimits = {
        series: [
          {
            seriesId: 's1',
            measures: {
              ballisticsMeasures: [
                {
                  id: 'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
                  magnitudeCode: 'BAL_CAMERA_HIGH_VELOCITY_ENTRANCE',
                  minLimit: 1000,
                  maxLimit: 25000,
                  unit: 'FPS',
                },
              ],
            },
          },
        ],
      };

      const config = resolveObservedResultControlConfig(
        'edac8dfe-89f2-4d3b-9eef-5193a93a483f',
        responseWithLimits,
        mockCatalog,
      );

      expect(config).toEqual({
        type: 'numeric',
        isQuantitative: true,
        isQualitative: false,
        min: 1000,
        max: 25000,
        options: [],
        unit: 'FPS',
      });
    });

    it('resolves select config with active options for qualitative magnitude with values', () => {
      const config = resolveObservedResultControlConfig(
        'c5e8ac36-5d75-4c60-aaa5-034a31e7c188',
        userSampleMeasuresResponse,
        mockCatalog,
      );

      expect(config).toEqual({
        type: 'select',
        isQuantitative: false,
        isQualitative: true,
        min: null,
        max: null,
        options: [
          { value: 'CORRECT', label: 'Correcto' },
          { value: 'DEFECTIVE', label: 'Defectuoso' },
        ],
        unit: null,
      });
    });

    it('falls back to text input when qualitative magnitude has no values', () => {
      const planningWithNoVals = {
        series: [
          {
            seriesId: 's1',
            measures: {
              ballisticsMeasures: [
                {
                  id: 'qual-without-values',
                  magnitudeCode: 'QUAL_NO_VALS',
                },
              ],
            },
          },
        ],
      };

      const config = resolveObservedResultControlConfig('qual-without-values', planningWithNoVals, mockCatalog);

      expect(config).toEqual({
        type: 'text',
        isQuantitative: false,
        isQualitative: true,
        min: null,
        max: null,
        options: [],
        unit: null,
      });
    });

    it('falls back to text input when magnitude is not selected or not found', () => {
      expect(resolveObservedResultControlConfig(null, userSampleMeasuresResponse, mockCatalog)).toEqual({
        type: 'text',
        isQuantitative: false,
        isQualitative: false,
        min: null,
        max: null,
        options: [],
        unit: null,
      });

      expect(resolveObservedResultControlConfig('unknown-id', userSampleMeasuresResponse, mockCatalog)).toEqual({
        type: 'text',
        isQuantitative: false,
        isQualitative: false,
        min: null,
        max: null,
        options: [],
        unit: null,
      });
    });
  });
});
