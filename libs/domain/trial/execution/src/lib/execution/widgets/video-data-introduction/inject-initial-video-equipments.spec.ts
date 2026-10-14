import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, EquipmentTypeEnum } from '../../models';
import {
  injectInitialConventionalVideoEquipments,
  injectInitialHighSpeedVideoEquipments,
  injectInitialVideoEquipments,
} from './inject-initial-video-equipments';

describe('injectInitialVideoEquipments', () => {
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
          provide: ExecutionService,
          useValue: {
            equipmentSelectorResource: {
              hasValue: () => false,
              value: () => undefined,
            },
          },
        },
      ],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialVideoEquipments());
    expect(selections()).toEqual([]);
  });

  it('returns AV selections when tipoVideo is AV', () => {
    const mockService = createMockService([
      {
        measurementGroup: EquipmentMeasurementGroupEnum.HIGH_SPEED_VIDEO,
        selections: [
          {
            equipmentItemId: 1,
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
          },
        ],
      },
      {
        measurementGroup: EquipmentMeasurementGroupEnum.CONVENTIONAL_VIDEO,
        selections: [
          {
            equipmentItemId: 2,
            categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
          },
        ],
      },
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialHighSpeedVideoEquipments());
    expect(selections()).toEqual([
      {
        equipmentItemId: 1,
        categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
      },
    ]);
  });

  it('returns C selections when tipoVideo is C', () => {
    const mockService = createMockService([
      {
        measurementGroup: EquipmentMeasurementGroupEnum.HIGH_SPEED_VIDEO,
        selections: [
          {
            equipmentItemId: 1,
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
          },
        ],
      },
      {
        measurementGroup: EquipmentMeasurementGroupEnum.CONVENTIONAL_VIDEO,
        selections: [
          {
            equipmentItemId: 2,
            categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
          },
        ],
      },
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialConventionalVideoEquipments());
    expect(selections()).toEqual([
      {
        equipmentItemId: 2,
        categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
      },
    ]);
  });

  it('returns all video selections when tipoVideo is not specified', () => {
    const mockService = createMockService([
      {
        measurementGroup: 'VIDEO_AV',
        selections: [
          {
            equipmentItemId: 1,
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
          },
        ],
      },
      {
        measurementGroup: 'VIDEO_C',
        selections: [
          {
            equipmentItemId: 2,
            categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
          },
        ],
      },
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialVideoEquipments());
    expect(selections()).toHaveLength(2);
  });
});
