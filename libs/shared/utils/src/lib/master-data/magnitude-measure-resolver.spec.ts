import { MagnitudeInputTypeEnum, type MagnitudeMeasureSource, QualificationTypeEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import { resolveMagnitudeDisplayConfig } from './magnitude-measure-resolver';

describe('resolveMagnitudeDisplayConfig', () => {
  it('should resolve a numeric input config for a quantitative magnitude', () => {
    const source: MagnitudeMeasureSource = {
      magnitudeCode: 'BAL_TRAJECTORY_RANGE',
      magnitudeLabel: 'Alcance',
      qualificationType: QualificationTypeEnum.QUANTITATIVE,
      measureUnit: 'M',
      minValue: 0,
      maxValue: 45000,
    };

    const result = resolveMagnitudeDisplayConfig(source);

    expect(result).toEqual({
      magnitudeCode: 'BAL_TRAJECTORY_RANGE',
      magnitudeLabel: 'Alcance',
      measure: {
        inputType: MagnitudeInputTypeEnum.NUMERIC,
        unit: 'M',
        minValue: 0,
        maxValue: 45000,
      },
    });
  });

  it('should resolve a single-select config for a qualitative magnitude', () => {
    const source: MagnitudeMeasureSource = {
      magnitudeCode: 'BAL_TRAJECTORY_FLY_CALIFICATION',
      magnitudeLabel: 'Calificación del vuelo',
      qualificationType: QualificationTypeEnum.QUALITATIVE,
      values: [
        { code: 'CORRECT', label: 'Correcto' },
        { code: 'INCORRECT', label: 'Incorrecto' },
      ],
    };

    const result = resolveMagnitudeDisplayConfig(source);

    expect(result).toEqual({
      magnitudeCode: 'BAL_TRAJECTORY_FLY_CALIFICATION',
      magnitudeLabel: 'Calificación del vuelo',
      measure: {
        inputType: MagnitudeInputTypeEnum.SINGLE_SELECT,
        options: [
          { code: 'CORRECT', label: 'Correcto' },
          { code: 'INCORRECT', label: 'Incorrecto' },
        ],
      },
    });
  });

  it('should default missing limits and values to safe empty fallbacks', () => {
    const quantitative = resolveMagnitudeDisplayConfig({
      magnitudeCode: 'MG001',
      magnitudeLabel: 'Sin límites',
      qualificationType: QualificationTypeEnum.QUANTITATIVE,
    });
    const qualitative = resolveMagnitudeDisplayConfig({
      magnitudeCode: 'MG002',
      magnitudeLabel: 'Sin opciones',
      qualificationType: QualificationTypeEnum.QUALITATIVE,
    });

    expect(quantitative?.measure).toEqual({
      inputType: MagnitudeInputTypeEnum.NUMERIC,
      unit: null,
      minValue: null,
      maxValue: null,
    });
    expect(qualitative?.measure).toEqual({ inputType: MagnitudeInputTypeEnum.SINGLE_SELECT, options: [] });
  });

  it('should return null when the qualificationType is not recognized', () => {
    const result = resolveMagnitudeDisplayConfig({
      magnitudeCode: 'MG003',
      magnitudeLabel: 'Incompleta',
      qualificationType: '',
    });

    expect(result).toBeNull();
  });
});
