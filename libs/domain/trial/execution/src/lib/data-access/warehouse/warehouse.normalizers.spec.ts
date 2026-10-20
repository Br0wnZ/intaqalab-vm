import { describe, expect, it } from 'vitest';
import type { DenominationItem, StockListItem } from '../models';
import {
  normalizeDenominations,
  normalizeMunitionTypes,
  normalizeStockItems,
  resolveI18nName,
  toBatchOptions,
  toDenominationOptions,
} from './warehouse.normalizers';

describe('warehouse.normalizers', () => {
  describe('resolveI18nName', () => {
    it('extracts direct strings and i18n object values', () => {
      expect(resolveI18nName('Granada 155')).toBe('Granada 155');
      expect(resolveI18nName({ es: 'Espoleta ES', en: 'Fuse EN' })).toBe('Espoleta ES');
      expect(resolveI18nName({ en: 'Fuse EN' })).toBe('Fuse EN');
      expect(resolveI18nName({ name: 'Fallback name' })).toBe('Fallback name');
      expect(resolveI18nName(null, 'default-val')).toBe('default-val');
    });
  });

  describe('normalizeMunitionTypes', () => {
    it('normalizes paged or array munition types', () => {
      const raw = {
        items: [
          {
            id: 'type-1',
            category: 'MUNITION',
            label: 'Granada 155',
            active: true,
          },
          {
            id: 'type-2',
            category: 'MUNITION_COMPONENT',
            name: { es: 'Espoleta 4AP' },
            active: false,
          },
        ],
      };

      const result = normalizeMunitionTypes(raw);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'type-1',
        category: 'MUNITION',
        label: 'Granada 155',
        observations: undefined,
        active: true,
      });
      expect(result[1]).toEqual({
        id: 'type-2',
        category: 'MUNITION_COMPONENT',
        label: 'Espoleta 4AP',
        observations: undefined,
        active: false,
      });
    });
  });

  describe('normalizeDenominations and toDenominationOptions', () => {
    const sampleDenominations: DenominationItem[] = [
      {
        id: 'den-1',
        category: 'MUNITION',
        name: 'Granada M107',
        munitionType: { id: 'type-1', name: 'Granada' },
        active: true,
      },
      {
        id: 'den-2',
        category: 'MUNITION_COMPONENT',
        name: 'Espoleta M578',
        munitionType: { id: 'type-2', name: 'Espoleta' },
        active: true,
      },
    ];

    it('filters by munitionTypeId and maps to options', () => {
      const options = toDenominationOptions({
        denominations: sampleDenominations,
        munitionTypeId: 'type-1',
      });

      expect(options).toHaveLength(1);
      expect(options[0]).toEqual({
        value: 'den-1',
        label: 'Granada M107',
        munitionTypeId: 'type-1',
        planned: false,
        inStock: true,
      });
    });

    it('prepends planned denomination with inStock=false if missing from catalog', () => {
      const options = toDenominationOptions({
        denominations: sampleDenominations,
        munitionTypeId: 'type-1',
        planned: {
          denominationId: 'den-unstocked',
          denominationName: 'Denominación especial no en catálogo',
          batch: 'LOT-PLANNED',
          clientNumber: 'C-001',
          fuseWorkingModeId: null,
          fuseMeasurement: null,
        },
      });

      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({
        value: 'den-unstocked',
        label: 'Denominación especial no en catálogo',
        munitionTypeId: 'type-1',
        planned: true,
        inStock: false,
        batch: 'LOT-PLANNED',
        clientNumber: 'C-001',
      });
    });
  });

  describe('normalizeStockItems and toBatchOptions', () => {
    it('aggregates stock quantity by batch and marks planned batch', () => {
      const stock: StockListItem[] = [
        {
          id: 'stock-1',
          category: 'MUNITION',
          batch: 'LOT-A',
          quantity: 10,
          status: 'AVAILABLE',
          denomination: { id: 'den-1', name: 'Denom 1' },
        },
        {
          id: 'stock-2',
          category: 'MUNITION',
          batch: 'LOT-A',
          quantity: 15,
          status: 'AVAILABLE',
          denomination: { id: 'den-1', name: 'Denom 1' },
        },
        {
          id: 'stock-3',
          category: 'MUNITION',
          batch: 'LOT-B',
          quantity: 5,
          status: 'AVAILABLE',
          denomination: { id: 'den-1', name: 'Denom 1' },
        },
        {
          id: 'stock-4',
          category: 'MUNITION',
          batch: 'LOT-RETIRED',
          quantity: 100,
          status: 'RETIRED',
          denomination: { id: 'den-1', name: 'Denom 1' },
        },
      ];

      const batchOpts = toBatchOptions({
        stockItems: stock,
        denominationId: 'den-1',
        plannedBatch: 'LOT-B',
      });

      expect(batchOpts).toHaveLength(2);
      const lotA = batchOpts.find((b) => b.value === 'LOT-A');
      expect(lotA?.quantity).toBe(25);
      expect(lotA?.planned).toBe(false);

      const lotB = batchOpts.find((b) => b.value === 'LOT-B');
      expect(lotB?.quantity).toBe(5);
      expect(lotB?.planned).toBe(true);
    });

    it('adds planned batch with inStock=false if not in available stock', () => {
      const batchOpts = toBatchOptions({
        stockItems: [],
        denominationId: 'den-1',
        plannedBatch: 'LOT-NOT-IN-STOCK',
      });

      expect(batchOpts).toHaveLength(1);
      expect(batchOpts[0]).toEqual({
        value: 'LOT-NOT-IN-STOCK',
        label: 'LOT-NOT-IN-STOCK',
        denominationId: 'den-1',
        quantity: 0,
        planned: true,
        inStock: false,
      });
    });
  });
});
