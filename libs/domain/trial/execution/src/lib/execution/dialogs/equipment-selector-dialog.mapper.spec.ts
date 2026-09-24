import { QualificationTypeEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import { EquipmentMagnitudeTagEnum, type PlanningMagnitudeSelection } from '../models';
import { resolveNeededEquipmentTags } from './equipment-selector-dialog.mapper';

const QUANTITATIVE_TRAJECTOGRAPHY: PlanningMagnitudeSelection = {
  magnitudeCode: 'BAL_TRAJECTORY_RANGE',
  magnitudeLabel: 'Alcance',
  qualificationType: QualificationTypeEnum.QUANTITATIVE,
  measureUnit: 'M',
  minValue: 0,
  maxValue: 45000,
  measurements: ['TRAJECTOGRAPHY'],
};

const QUALITATIVE_INITIAL_VELOCITY: PlanningMagnitudeSelection = {
  magnitudeCode: 'BAL_INITIAL_VELOCITY_BEAT',
  magnitudeLabel: 'Cadencia de disparo',
  qualificationType: QualificationTypeEnum.QUALITATIVE,
  values: [{ code: 'CORRECT', label: 'Correcto' }],
  measurements: ['INITIAL_VELOCITY'],
};

const INCOMPLETE_MAGNITUDE: PlanningMagnitudeSelection = {
  magnitudeCode: 'DRAFT',
  magnitudeLabel: 'Sin calificación',
  qualificationType: '',
  measurements: ['SOUND'],
};

describe('resolveNeededEquipmentTags', () => {
  it('should map planning measurements to their equipment magnitude tags', () => {
    const result = resolveNeededEquipmentTags([QUANTITATIVE_TRAJECTOGRAPHY, QUALITATIVE_INITIAL_VELOCITY]);

    expect(result).toEqual([EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA, EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL]);
  });

  it('should deduplicate repeated measurement groups across magnitudes', () => {
    const result = resolveNeededEquipmentTags([QUANTITATIVE_TRAJECTOGRAPHY, { ...QUANTITATIVE_TRAJECTOGRAPHY }]);

    expect(result).toEqual([EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA]);
  });

  it('should discard magnitudes without a recognized qualificationType', () => {
    const result = resolveNeededEquipmentTags([INCOMPLETE_MAGNITUDE]);

    expect(result).toEqual([]);
  });

  it('should ignore measurement codes not present in EquipmentMagnitudeTagEnum', () => {
    const result = resolveNeededEquipmentTags([{ ...QUANTITATIVE_TRAJECTOGRAPHY, measurements: ['UNKNOWN_GROUP'] }]);

    expect(result).toEqual([]);
  });
});
