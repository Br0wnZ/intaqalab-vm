import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import { type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';
import { injectClimaticChamberEquipments } from './inject-climatic-chamber-equipments';

describe('injectClimaticChamberEquipments', () => {
  it('returns empty options when resource has no value', () => {
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

    const helper = TestBed.runInInjectionContext(() => injectClimaticChamberEquipments());
    expect(helper.selections()).toEqual([]);
    expect(helper.options()).toEqual([]);
  });

  it('filters CLIMATIC_CHAMBER selections and maps options with catalog labels', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21045,
        categoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER,
      },
      {
        equipmentItemId: 9876,
        categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'CONDITIONING', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.CLIMATIC_CHAMBER]: [{ id: '21045', label: 'Cámara Weiss WT3-180' }],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const helper = TestBed.runInInjectionContext(() => injectClimaticChamberEquipments());
    expect(helper.selections()).toEqual([selections[0]]);

    // Wait for the async loadEquipmentItemsByCategories promise to resolve
    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: '21045', label: 'Cámara Weiss WT3-180' }]);
  });

  it('filters selections by series when seriesFilter is provided', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21045,
        categoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER,
        seriesIds: ['serie-1'],
      },
      {
        equipmentItemId: 21046,
        categoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER,
        seriesIds: ['serie-2'],
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'CONDITIONING', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.CLIMATIC_CHAMBER]: [
          { id: '21045', label: 'Cámara 1' },
          { id: '21046', label: 'Cámara 2' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const helper = TestBed.runInInjectionContext(() => injectClimaticChamberEquipments(() => ['serie-1']));
    expect(helper.selections()).toEqual([selections[0]]);

    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: '21045', label: 'Cámara 1' }]);

    const helperMulti = TestBed.runInInjectionContext(() =>
      injectClimaticChamberEquipments(() => ['serie-1', 'serie-2']),
    );
    expect(helperMulti.selections()).toEqual(selections);
  });
});
