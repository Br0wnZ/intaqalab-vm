import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionService } from '../../../services/execution.service';
import { type EquipmentSelectionItem, EquipmentTypeEnum } from '../../models';
import { injectBalanceEquipments } from './inject-balance-equipments';

describe('injectBalanceEquipments', () => {
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

    const helper = TestBed.runInInjectionContext(() => injectBalanceEquipments());
    expect(helper.selections()).toEqual([]);
    expect(helper.options()).toEqual([]);
  });

  it('filters BALANCE selections and maps options with catalog labels', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21031,
        categoryId: EquipmentTypeEnum.BALANCE,
      },
      {
        equipmentItemId: 9876,
        categoryId: EquipmentTypeEnum.DOPPLER_RADAR,
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'WEIGHT', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.BALANCE]: [{ id: '21031', label: 'Balanza Mettler Toledo XP10000 / BAL-001' }],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const helper = TestBed.runInInjectionContext(() => injectBalanceEquipments());
    expect(helper.selections()).toEqual([selections[0]]);

    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: 'bal-01', label: 'Balanza Mettler Toledo XP10000 / BAL-001' }]);
  });

  it('filters selections by series when seriesFilter is provided', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21031,
        categoryId: EquipmentTypeEnum.BALANCE,
        seriesIds: ['serie-1'],
      },
      {
        equipmentItemId: 21032,
        categoryId: EquipmentTypeEnum.BALANCE,
        seriesIds: ['serie-2'],
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'WEIGHT', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.BALANCE]: [
          { id: '21031', label: 'Balanza 1' },
          { id: '21032', label: 'Balanza 2' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const helper = TestBed.runInInjectionContext(() => injectBalanceEquipments(() => ['serie-1']));
    expect(helper.selections()).toEqual([selections[0]]);

    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: 'bal-01', label: 'Balanza 1' }]);
  });

  it('filters selections by shot when shotFilter is provided', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21031,
        categoryId: EquipmentTypeEnum.BALANCE,
        shotIds: ['disparo-1'],
      },
      {
        equipmentItemId: 21032,
        categoryId: EquipmentTypeEnum.BALANCE,
        shotIds: ['disparo-2'],
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'WEIGHT', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.BALANCE]: [
          { id: '21031', label: 'Balanza 1' },
          { id: '21032', label: 'Balanza 2' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    const helper = TestBed.runInInjectionContext(() => injectBalanceEquipments({ shotFilter: () => 'disparo-2' }));
    expect(helper.selections()).toEqual([selections[1]]);

    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: 'bal-02', label: 'Balanza 2' }]);
  });

  it('allows different balances for each series and shot combination', async () => {
    const selections: EquipmentSelectionItem[] = [
      {
        equipmentItemId: 21031,
        categoryId: EquipmentTypeEnum.BALANCE,
        seriesIds: ['serie-1'],
        shotIds: ['disparo-1'],
      },
      {
        equipmentItemId: 21032,
        categoryId: EquipmentTypeEnum.BALANCE,
        seriesIds: ['serie-1'],
        shotIds: ['disparo-2'],
      },
      {
        equipmentItemId: 21031,
        categoryId: EquipmentTypeEnum.BALANCE,
        seriesIds: ['serie-2'],
        shotIds: ['disparo-1'],
      },
    ];

    const mockService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [{ measurementGroup: 'WEIGHT', selections }],
      },
      loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({
        [EquipmentTypeEnum.BALANCE]: [
          { id: '21031', label: 'Balanza 1' },
          { id: '21032', label: 'Balanza 2' },
        ],
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockService }],
    });

    // Serie 1, Disparo 2 -> Should only match 21032 ('bal-02')
    const helper = TestBed.runInInjectionContext(() =>
      injectBalanceEquipments(
        () => ['serie-1'],
        () => ['disparo-2'],
      ),
    );
    expect(helper.selections()).toEqual([selections[1]]);

    await Promise.resolve();
    expect(helper.options()).toEqual([{ value: 'bal-02', label: 'Balanza 2' }]);
  });
});
