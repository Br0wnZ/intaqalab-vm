import { Role } from '@intaqalab/core';
import { QualificationTypeEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import { TAG_CONFIGS } from '../dialogs/equipment-selector-dialog.mapper';
import {
  EquipmentMagnitudeTagEnum,
  EquipmentTypeEnum,
  type PlanningMagnitudeSelection,
  type TrialPlanningMeasuresResponse,
} from '../models';
import {
  collectPlannedMeasureIds,
  resolveNeededEquipmentTags,
  resolvePlannedEquipmentTags,
  resolvePlannedLengthMagnitudes,
  resolvePlannedSeriesByTag,
  resolveRequiredEquipmentCategories,
  resolveVisibleEquipmentTags,
} from './equipment-planning.utils';

describe('equipment-planning.utils', () => {
  const sampleMeasuresResponse: TrialPlanningMeasuresResponse = {
    series: [
      {
        seriesId: 'series-1',
        measures: {
          ballisticsMeasures: [{ id: 'measure-vel' }],
          armamentMeasures: [{ id: 'measure-len' }],
        },
      },
      {
        seriesId: 'series-2',
        measures: {
          topographyMeasures: [{ id: 'measure-time' }],
        },
      },
    ],
  };

  const sampleCatalog: readonly PlanningMagnitudeSelection[] = [
    {
      id: 'measure-vel',
      magnitudeCode: 'BAL_VELOCITY',
      qualificationType: QualificationTypeEnum.QUANTITATIVE,
      measurements: [EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL],
    },
    {
      id: 'measure-len',
      magnitudeCode: 'ARMAMENT_BLOCKED',
      qualificationType: QualificationTypeEnum.QUANTITATIVE,
      measurements: [EquipmentMagnitudeTagEnum.LONGITUD],
    },
    {
      id: 'measure-time',
      magnitudeCode: 'TOP_TIME',
      qualificationType: QualificationTypeEnum.QUANTITATIVE,
      measurements: [EquipmentMagnitudeTagEnum.TIEMPO],
    },
    {
      id: 'measure-draft',
      magnitudeCode: 'DRAFT_CODE',
      // No qualificationType (draft)
      qualificationType: null as unknown as QualificationTypeEnum,
      measurements: [EquipmentMagnitudeTagEnum.SONIDO],
    },
  ];

  it('collects all planned measure IDs across all series and measure groups', () => {
    const ids = collectPlannedMeasureIds(sampleMeasuresResponse);
    expect(ids).toEqual(new Set(['measure-vel', 'measure-len', 'measure-time']));
  });

  it('resolves needed equipment tags excluding unconfigured or draft measures', () => {
    const tags = resolveNeededEquipmentTags(sampleCatalog);
    expect(tags).toContain(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(tags).toContain(EquipmentMagnitudeTagEnum.LONGITUD);
    expect(tags).toContain(EquipmentMagnitudeTagEnum.TIEMPO);
    expect(tags).not.toContain(EquipmentMagnitudeTagEnum.SONIDO);
  });

  it('resolves planned equipment tags by cross-referencing planned IDs with the catalog', () => {
    const plannedIds = new Set(['measure-vel', 'measure-time']);
    const tags = resolvePlannedEquipmentTags(plannedIds, sampleCatalog);
    expect(tags).toEqual([EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL, EquipmentMagnitudeTagEnum.TIEMPO]);
  });

  it('groups planned series IDs by equipment tag', () => {
    const map = resolvePlannedSeriesByTag(sampleMeasuresResponse, sampleCatalog);
    expect(map.get(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL)).toEqual(new Set(['series-1']));
    expect(map.get(EquipmentMagnitudeTagEnum.LONGITUD)).toEqual(new Set(['series-1']));
    expect(map.get(EquipmentMagnitudeTagEnum.TIEMPO)).toEqual(new Set(['series-2']));
    expect(map.get(EquipmentMagnitudeTagEnum.SONIDO)).toBeUndefined();
  });

  it('returns all tags for admin and planning analysis head roles', () => {
    const adminTags = resolveVisibleEquipmentTags([Role.INTAQALAB_ADMIN], TAG_CONFIGS);
    expect(adminTags).toHaveLength(TAG_CONFIGS.length);

    const planningHeadTags = resolveVisibleEquipmentTags([Role.INTAQALAB_PLANNING_ANALYSIS_HEAD], TAG_CONFIGS);
    expect(planningHeadTags).toHaveLength(TAG_CONFIGS.length);
  });

  it('filters tags by technical unit roles for non-admin users', () => {
    const ballisticsTags = resolveVisibleEquipmentTags([Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN], TAG_CONFIGS);
    const tagIds = ballisticsTags.map((tag) => tag.id);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.SONIDO);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.VIDEO_AV);
    expect(tagIds).toContain(EquipmentMagnitudeTagEnum.VIDEO_C);
    expect(tagIds).not.toContain(EquipmentMagnitudeTagEnum.LONGITUD);
    expect(tagIds).not.toContain(EquipmentMagnitudeTagEnum.TIEMPO);
  });

  it('extracts required equipment categories from visible and enabled tags', () => {
    const velocityTag = TAG_CONFIGS.filter((tag) => tag.id === EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL);
    const categories = resolveRequiredEquipmentCategories(velocityTag);
    expect(categories).toContain(EquipmentTypeEnum.DOPPLER_RADAR);
    expect(categories).toContain(EquipmentTypeEnum.ANTENNA);
  });

  it('resolves attack and recoil options for length magnitudes based on planned codes', () => {
    const options = resolvePlannedLengthMagnitudes([sampleCatalog[1]]);
    expect(options).toEqual([{ id: 'ATTACK', label: 'Atacado' }]);
  });
});
