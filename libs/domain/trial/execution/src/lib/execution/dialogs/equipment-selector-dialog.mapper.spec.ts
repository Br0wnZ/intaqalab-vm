import { Role } from '@intaqalab/core';
import { QualificationTypeEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum, type PlanningMagnitudeSelection } from '../models';
import {
  TAG_CONFIGS,
  collectPlannedMeasureIds,
  dialogStatesToApiFormat,
  hasIncompleteEquipmentRows,
  hydrateFromInitialEquipments,
  resolveNeededEquipmentTags,
  resolvePlannedEquipmentTags,
  resolvePlannedLengthMagnitudes,
  resolvePlannedSeriesByTag,
} from './equipment-selector-dialog.mapper';

const QUANTITATIVE_TRAJECTOGRAPHY: PlanningMagnitudeSelection = {
  id: '709c8ca0-d1b7-466e-9c37-053807ec0f51',
  magnitudeCode: 'BAL_TRAJECTORY_RANGE',
  magnitudeLabel: 'Alcance',
  qualificationType: QualificationTypeEnum.QUANTITATIVE,
  measureUnit: 'M',
  minValue: 0,
  maxValue: 45000,
  measurements: ['TRAJECTOGRAPHY'],
};

const QUALITATIVE_INITIAL_VELOCITY: PlanningMagnitudeSelection = {
  id: '65e66624-b256-4ddf-a4f2-da7c3fd49d99',
  magnitudeCode: 'BAL_INITIAL_VELOCITY_BEAT',
  magnitudeLabel: 'Cadencia de disparo',
  qualificationType: QualificationTypeEnum.QUALITATIVE,
  values: [{ code: 'CORRECT', label: 'Correcto' }],
  measurements: ['INITIAL_VELOCITY'],
};

const INCOMPLETE_MAGNITUDE: PlanningMagnitudeSelection = {
  id: 'draft',
  magnitudeCode: 'DRAFT',
  magnitudeLabel: 'Sin calificación',
  qualificationType: '',
  measurements: ['SOUND'],
};

describe('piezoelectric pressure equipment', () => {
  it('places recorder after amplifier within the piezoelectric pressure tag', () => {
    const tag = TAG_CONFIGS.find((config) => config.id === EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS);

    expect(TAG_CONFIGS.some((config) => config.id === EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM)).toBe(false);
    expect(tag?.fields.map((field) => field.label)).toEqual(['Sensor piezoeléctrico', 'Amplificador', 'Registrador']);
  });

  it('hydrates and saves recorder in the piezoelectric pressure group', () => {
    const groups = [
      {
        id: EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS,
        selections: [
          {
            itemId: 'rec-001',
            categoryId: EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
            series: ['s1'],
            disparos: ['d1'],
          },
        ],
      },
    ];

    const states = hydrateFromInitialEquipments(groups);

    expect(states[EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS].rows[0].fieldValues['registrador']).toBe(
      'rec-001',
    );
    expect(dialogStatesToApiFormat(states)).toEqual(
      groups.map((group) => ({
        ...group,
        selections: group.selections.map((selection) => ({ ...selection, magnitude: null, channel: null })),
      })),
    );
  });
});

describe('video equipment', () => {
  it('should preserve camera and recorder as distinct categories when hydrating and saving', () => {
    const groups = [
      {
        id: EquipmentMagnitudeTagEnum.VIDEO_AV,
        selections: [
          { itemId: 'camera-1', categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA, series: ['s1'], disparos: ['d1'] },
          { itemId: 'recorder-1', categoryId: EquipmentTypeEnum.RECORDER, series: ['s1'], disparos: ['d1'] },
        ],
      },
    ];

    const states = hydrateFromInitialEquipments(groups);
    expect(states[EquipmentMagnitudeTagEnum.VIDEO_AV].rows[0].fieldValues).toEqual({
      camara_av: 'camera-1',
      grabador: 'recorder-1',
    });
    expect(dialogStatesToApiFormat(states)[0].selections.map((selection) => selection.categoryId)).toEqual([
      EquipmentTypeEnum.HIGH_SPEED_CAMERA,
      EquipmentTypeEnum.RECORDER,
    ]);
  });
});

describe('equipment row validation', () => {
  it('should require all physical equipment, a series and a shot for edited rows', () => {
    const tag = TAG_CONFIGS.find((config) => config.id === EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    if (!tag) throw new Error('Velocity tag missing');
    const states = {
      [tag.id]: {
        rows: [{ rowId: 'row-1', fieldValues: { radar_doppler: '1' }, series: ['s1'], disparos: ['d1'] }],
        nextId: 2,
        pageIndex: 0,
      },
    };

    expect(hasIncompleteEquipmentRows(states, [tag])).toBe(true);
    states[tag.id].rows[0].fieldValues['antena'] = '2';
    expect(hasIncompleteEquipmentRows(states, [tag])).toBe(false);
  });

  it('should reject video channels outside 1-32 and ignore untouched rows', () => {
    const tag = TAG_CONFIGS.find((config) => config.id === EquipmentMagnitudeTagEnum.VIDEO_AV);
    if (!tag) throw new Error('Video tag missing');
    const states = {
      [tag.id]: {
        rows: [{ rowId: 'row-1', fieldValues: {}, series: [], disparos: [] }],
        nextId: 2,
        pageIndex: 0,
      },
    };

    expect(hasIncompleteEquipmentRows(states, [tag])).toBe(false);
    states[tag.id].rows[0].fieldValues = { camara_av: '1', grabador: '2', canal: '33' };
    states[tag.id].rows[0].series = ['s1'];
    states[tag.id].rows[0].disparos = ['d1'];
    expect(hasIncompleteEquipmentRows(states, [tag])).toBe(true);
    states[tag.id].rows[0].fieldValues['canal'] = '32';
    expect(hasIncompleteEquipmentRows(states, [tag])).toBe(false);
  });
});

describe('resolveNeededEquipmentTags', () => {
  it('should reserve access to every tag for admin and planning head only', () => {
    expect(TAG_CONFIGS.every((tag) => tag.allowedRoles.includes(Role.INTAQALAB_ADMIN))).toBe(true);
    expect(TAG_CONFIGS.every((tag) => tag.allowedRoles.includes(Role.INTAQALAB_PLANNING_ANALYSIS_HEAD))).toBe(true);
    expect(TAG_CONFIGS.some((tag) => tag.allowedRoles.includes(Role.HEAD_ARMAMENT_TRIALS))).toBe(false);
  });

  it('should map planning measurements to their equipment magnitude tags', () => {
    const result = resolveNeededEquipmentTags([QUANTITATIVE_TRAJECTOGRAPHY, QUALITATIVE_INITIAL_VELOCITY]);

    expect(result).toEqual([EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA, EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL]);
  });

  it('should use catalog measurement groups only for measure IDs selected across planning series', () => {
    const plannedIds = collectPlannedMeasureIds({
      series: [
        {
          seriesId: 's1',
          measures: { ballisticsMeasures: [{ id: QUANTITATIVE_TRAJECTOGRAPHY.id }] },
        },
        {
          seriesId: 's2',
          measures: { ballisticsMeasures: [{ id: '34acca4d-cb46-4e0d-a79d-4d31143cafdb' }] },
        },
      ],
    });
    const result = resolvePlannedEquipmentTags(plannedIds, [
      QUANTITATIVE_TRAJECTOGRAPHY,
      {
        ...QUALITATIVE_INITIAL_VELOCITY,
        id: '34acca4d-cb46-4e0d-a79d-4d31143cafdb',
        measurements: ['TRAJECTOGRAPHY', 'HIGH_SPEED_VIDEO'],
      },
      { ...QUALITATIVE_INITIAL_VELOCITY, id: 'not-planned' },
    ]);

    expect([...plannedIds]).toEqual([QUANTITATIVE_TRAJECTOGRAPHY.id, '34acca4d-cb46-4e0d-a79d-4d31143cafdb']);
    expect(result).toEqual([EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA, EquipmentMagnitudeTagEnum.VIDEO_AV]);
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

  it('should restrict each enabled tag to the series that planned its measurements', () => {
    const catalog = [QUANTITATIVE_TRAJECTOGRAPHY, QUALITATIVE_INITIAL_VELOCITY];
    const byTag = resolvePlannedSeriesByTag(
      {
        series: [
          { seriesId: 's1', measures: { ballisticsMeasures: [{ id: QUANTITATIVE_TRAJECTOGRAPHY.id }] } },
          { seriesId: 's2', measures: { ballisticsMeasures: [{ id: QUALITATIVE_INITIAL_VELOCITY.id }] } },
        ],
      },
      catalog,
    );

    expect([...(byTag.get(EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA) ?? [])]).toEqual(['s1']);
    expect([...(byTag.get(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL) ?? [])]).toEqual(['s2']);
  });

  it('should expose only the supported length magnitudes requested in planning', () => {
    const result = resolvePlannedLengthMagnitudes([
      { ...QUANTITATIVE_TRAJECTOGRAPHY, id: 'attack', magnitudeCode: 'ARMAMENT_BLOCKED', measurements: ['LENGTH'] },
      {
        ...QUANTITATIVE_TRAJECTOGRAPHY,
        id: 'afd3b7d8-3c31-4c9f-b2dc-2e3640eaf5ad',
        magnitudeCode: 'UNKNOWN',
        measurements: ['LENGTH'],
      },
      { ...QUANTITATIVE_TRAJECTOGRAPHY, id: 'unrelated', magnitudeCode: 'ARMAMENT_RETREAT' },
    ]);

    expect(result).toEqual([
      { id: 'ATTACK', label: 'Atacado' },
      { id: 'RECOIL', label: 'Retroceso' },
    ]);
  });
});
