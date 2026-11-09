import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { EquipmentSelectionService } from '../../../data-access';
import { EquipmentMeasurementGroupEnum, type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';
import { injectInitialIpgPressureEquipments } from './inject-initial-ipg-pressure-equipments';

describe('injectInitialIpgPressureEquipments', () => {
  const createMockService = (groups: Array<{ measurementGroup: string; selections: EquipmentSelectionItem[] }>) => ({
    equipmentSelectorResource: {
      hasValue: () => true,
      value: () => groups,
    },
  });

  it('returns empty array when resource has no value', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EquipmentSelectionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => false,
              value: () => undefined,
            },
          },
        },
      ],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialIpgPressureEquipments());
    expect(selections()).toEqual([]);
  });

  it('returns selections for IPG_PRESSURE group', () => {
    const mockService = createMockService([
      {
        measurementGroup: EquipmentMeasurementGroupEnum.IPG_PRESSURE,
        selections: [
          {
            equipmentItemId: 21081,
            categoryId: EquipmentTypeEnum.IPG_SENSOR,
            seriesIds: ['serie-1'],
            shotIds: ['shot-1'],
          },
          {
            equipmentItemId: 21082,
            categoryId: EquipmentTypeEnum.MICROMODULE,
            seriesIds: ['serie-1'],
            shotIds: ['shot-1'],
          },
        ],
      },
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: EquipmentSelectionService, useValue: mockService }],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialIpgPressureEquipments());
    expect(selections()).toHaveLength(2);
    expect(selections()[0].equipmentItemId).toBe(21081);
    expect(selections()[1].equipmentItemId).toBe(21082);
  });
});
