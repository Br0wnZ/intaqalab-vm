import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import {
  EquipmentMagnitudeTagEnum,
  EquipmentMeasurementGroupEnum,
  type EquipmentSelectionItem,
  EquipmentTypeEnum,
} from '../../models';
import {
  injectAcousticLevelEquipments,
  injectInitialAcousticLevelEquipments,
  injectSoundLevelMeterEquipments,
} from './inject-acoustic-level-equipments';

describe('injectAcousticLevelEquipments', () => {
  it('returns empty options and selections when resource has no value', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => false,
              value: () => undefined,
            },
            loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    });

    const helper = TestBed.runInInjectionContext(() => injectAcousticLevelEquipments());
    expect(helper.selections()).toEqual([]);
    expect(helper.options()).toEqual([]);
  });

  it('filters SOUND_LEVEL_METER selections from SOUND measurement group', () => {
    const soundSelection: EquipmentSelectionItem = {
      equipmentItemId: 5001,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
      seriesIds: ['serie-1'],
      shotIds: ['shot-1'],
    };
    const radarSelection: EquipmentSelectionItem = {
      equipmentItemId: 1001,
      categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
      seriesIds: ['serie-1'],
      shotIds: ['shot-1'],
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => true,
              value: () => [
                {
                  measurementGroup: EquipmentMeasurementGroupEnum.SOUND,
                  selections: [soundSelection, radarSelection],
                },
              ],
            },
            loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    });

    const helper = TestBed.runInInjectionContext(() => injectAcousticLevelEquipments());
    expect(helper.selections()).toEqual([soundSelection]);
    expect(helper.options()).toEqual([{ value: '5001', label: 'Sonómetro 5001' }]);
  });

  it('finds SOUND_LEVEL_METER selections with SONIDO tag or across groups', () => {
    const soundSelection: EquipmentSelectionItem = {
      equipmentItemId: 5002,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => true,
              value: () => [
                {
                  measurementGroup: EquipmentMagnitudeTagEnum.SONIDO,
                  selections: [soundSelection],
                },
              ],
            },
            loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    });

    const helper = TestBed.runInInjectionContext(() => injectSoundLevelMeterEquipments());
    expect(helper.selections()).toEqual([soundSelection]);
    expect(helper.options()).toEqual([{ value: '5002', label: 'Sonómetro 5002' }]);
  });

  it('filters selections by series and shot when filter functions are provided', () => {
    const matchingSel: EquipmentSelectionItem = {
      equipmentItemId: 5001,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
      seriesIds: ['serie-a'],
      shotIds: ['shot-1'],
    };
    const differentSerieSel: EquipmentSelectionItem = {
      equipmentItemId: 5002,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
      seriesIds: ['serie-b'],
      shotIds: ['shot-1'],
    };
    const differentShotSel: EquipmentSelectionItem = {
      equipmentItemId: 5003,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
      seriesIds: ['serie-a'],
      shotIds: ['shot-2'],
    };
    const globalSel: EquipmentSelectionItem = {
      equipmentItemId: 5004,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => true,
              value: () => [
                {
                  measurementGroup: EquipmentMeasurementGroupEnum.SOUND,
                  selections: [matchingSel, differentSerieSel, differentShotSel, globalSel],
                },
              ],
            },
            loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    });

    const helper = TestBed.runInInjectionContext(() =>
      injectAcousticLevelEquipments({
        seriesFilter: () => 'serie-a',
        shotFilter: () => 'shot-1',
      }),
    );

    expect(helper.selections()).toEqual([matchingSel, globalSel]);
    expect(helper.options().map((opt) => opt.value)).toEqual(['5001', '5004']);
  });

  it('maps options with catalog labels and deduplicates identical IDs', async () => {
    const sel1: EquipmentSelectionItem = {
      equipmentItemId: 5001,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
    };
    const sel2: EquipmentSelectionItem = {
      equipmentItemId: 5001,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
    };
    const sel3: EquipmentSelectionItem = {
      equipmentItemId: 5002,
      categoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
    };

    const loadMock = vi.fn().mockResolvedValue({
      [EquipmentTypeEnum.SOUND_LEVEL_METER]: [
        { id: '5001', label: 'Sonómetro Norsonic 140 / SOM-001' },
        { id: '5002', label: 'Sonómetro Norsonic 145 / SOM-002' },
      ],
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => true,
              value: () => [
                {
                  measurementGroup: EquipmentMeasurementGroupEnum.SOUND,
                  selections: [sel1, sel2, sel3],
                },
              ],
            },
            loadEquipmentItemsByCategories: loadMock,
          },
        },
      ],
    });

    const helper = TestBed.runInInjectionContext(() => injectInitialAcousticLevelEquipments());

    await Promise.resolve();

    expect(helper.options()).toEqual([
      { value: '5001', label: 'Sonómetro Norsonic 140 / SOM-001' },
      { value: '5002', label: 'Sonómetro Norsonic 145 / SOM-002' },
    ]);
  });
});
