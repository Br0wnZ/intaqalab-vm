import { describe, expect, it } from 'vitest';

import {
  buildTypeCatalogMap,
  isFuseComponent,
  normalizePlanningMunitions,
  resolveComponentCategory,
} from './planning-munition.normalizer';

describe('planning-munition.normalizer', () => {
  describe('resolveComponentCategory', () => {
    it('classifies labels into domain categories', () => {
      expect(resolveComponentCategory('Espoleta 4AP')).toBe('espoleta');
      expect(resolveComponentCategory('Granada 155mm')).toBe('granada');
      expect(resolveComponentCategory('Pólvora negra')).toBe('polvo');
      expect(resolveComponentCategory('Carga de proyección')).toBe('carga');
      expect(resolveComponentCategory('Suplemento')).toBe('suplemento');
      expect(resolveComponentCategory('Charge supplement')).toBe('suplemento');
      expect(resolveComponentCategory('Proyectil iluminante')).toBe('granada');
      expect(resolveComponentCategory('Artillery round', 'MUNITION')).toBe('munition');
      expect(resolveComponentCategory('Desconocido', 'MUNITION_COMPONENT')).toBe('componente');
    });
  });

  describe('isFuseComponent', () => {
    it('returns true when category or label matches fuse', () => {
      expect(
        isFuseComponent({
          label: 'Espoleta M578',
          category: 'espoleta',
          fuseWorkingModeId: null,
          fuseMeasurement: null,
        }),
      ).toBe(true);

      expect(
        isFuseComponent({
          label: 'PD Fuse',
          category: 'componente',
          fuseWorkingModeId: null,
          fuseMeasurement: null,
        }),
      ).toBe(true);
    });

    it('returns true when fuse parameters are defined even if label is generic', () => {
      expect(
        isFuseComponent({
          label: 'Componente X',
          category: 'componente',
          fuseWorkingModeId: 'mode-1',
          fuseMeasurement: null,
        }),
      ).toBe(true);

      expect(
        isFuseComponent({
          label: 'Componente Y',
          category: 'componente',
          fuseWorkingModeId: null,
          fuseMeasurement: 15,
        }),
      ).toBe(true);
    });

    it('returns false for non-fuse components', () => {
      expect(
        isFuseComponent({
          label: 'Granada 105mm',
          category: 'granada',
          fuseWorkingModeId: null,
          fuseMeasurement: null,
        }),
      ).toBe(false);

      expect(
        isFuseComponent({
          label: 'Proyectil 155mm',
          category: 'granada',
          fuseWorkingModeId: 'mode-1',
          fuseMeasurement: 5,
        }),
      ).toBe(false);

      expect(
        isFuseComponent({
          label: 'Carga de proyección M4A2',
          category: 'carga',
          fuseWorkingModeId: 'mode-1',
          fuseMeasurement: 5,
        }),
      ).toBe(false);

      expect(
        isFuseComponent({
          label: 'Pólvora simple base',
          category: 'polvo',
          fuseWorkingModeId: 'mode-1',
          fuseMeasurement: null,
        }),
      ).toBe(false);

      expect(
        isFuseComponent({
          label: 'Suplemento de carga',
          category: 'suplemento',
          fuseWorkingModeId: 'mode-1',
          fuseMeasurement: null,
        }),
      ).toBe(false);
    });
  });

  describe('normalizePlanningMunitions', () => {
    it('normalizes fully hydrated payload correctly', () => {
      const raw = {
        series: [
          {
            seriesId: 'series-01',
            configurations: [
              {
                id: 'cfg-01',
                seriesId: 'series-01',
                munitionTypeId: 'type-granada',
                denomination: {
                  id: 'den-granada',
                  name: 'Granada 155mm',
                  munitionTypeId: 'type-granada',
                },
                batch: 'LOT-G-01',
                clientNumber: 'CL-01',
                assignedShotIds: ['shot-01', 'shot-02'],
                components: [
                  {
                    id: 'comp-01',
                    type: {
                      id: 'type-espoleta',
                      label: 'Espoleta 4AP',
                      type: 'MUNITION_COMPONENT',
                    },
                    denomination: {
                      id: 'den-esp',
                      name: 'Espoleta M1',
                    },
                    batch: 'LOT-E-01',
                    clientNumber: 99,
                    fuseWorkingMode: { id: 'mode-perc', label: 'Percusión', type: 'PERCUSSION' },
                    fuseMeasurement: 10,
                  },
                ],
              },
            ],
          },
        ],
      };

      const configs = normalizePlanningMunitions(raw);
      expect(configs).toHaveLength(1);
      const [cfg] = configs;
      expect(cfg.id).toBe('cfg-01');
      expect(cfg.seriesId).toBe('series-01');
      expect(cfg.assignedShotIds).toEqual(['shot-01', 'shot-02']);

      expect(cfg.mainComponent).not.toBeNull();
      expect(cfg.mainComponent?.componentTypeId).toBe('type-granada');
      expect(cfg.mainComponent?.label).toBe('Granada 155mm');
      expect(cfg.mainComponent?.batch).toBe('LOT-G-01');
      expect(cfg.mainComponent?.clientNumber).toBe('CL-01');

      expect(cfg.subComponents).toHaveLength(1);
      const sub = cfg.subComponents[0];
      expect(sub.componentTypeId).toBe('type-espoleta');
      expect(sub.label).toBe('Espoleta 4AP');
      expect(sub.denominationId).toBe('den-esp');
      expect(sub.batch).toBe('LOT-E-01');
      expect(sub.clientNumber).toBe('99');
      expect(sub.fuseWorkingModeId).toBe('mode-perc');
      expect(sub.fuseMeasurement).toBe(10);
      expect(sub.isFuse).toBe(true);
    });

    it('handles string denominations and nested typeId objects', () => {
      const raw = {
        series: [
          {
            seriesId: 'series-legacy',
            configurations: [
              {
                id: 'cfg-legacy',
                denomination: 'den-string-only',
                components: [
                  {
                    id: 'comp-legacy',
                    typeId: {
                      id: { value: 'type-nested-id' },
                      label: 'Espoleta Anidada',
                      type: 'MUNITION_COMPONENT',
                    },
                    denominationId: {
                      id: { value: 'den-nested-id' },
                      name: 'Denom Anidada',
                    },
                    lote: 'LOTE-LEGACY',
                    numeroCliente: 'CLI-LEGACY',
                    fuseWorkingModeId: 'f-mode-123',
                  },
                ],
              },
            ],
          },
        ],
      };

      const typeCatalog = buildTypeCatalogMap([
        {
          id: 'type-nested-id',
          category: 'MUNITION_COMPONENT',
          label: 'Espoleta Anidada Cat',
          active: true,
        },
      ]);

      const configs = normalizePlanningMunitions(raw, typeCatalog);
      expect(configs).toHaveLength(1);
      const [cfg] = configs;
      expect(cfg.subComponents).toHaveLength(1);
      const sub = cfg.subComponents[0];
      expect(sub.componentTypeId).toBe('type-nested-id');
      expect(sub.denominationId).toBe('den-nested-id');
      expect(sub.denominationName).toBe('Denom Anidada');
      expect(sub.batch).toBe('LOTE-LEGACY');
      expect(sub.clientNumber).toBe('CLI-LEGACY');
      expect(sub.fuseWorkingModeId).toBe('f-mode-123');
      expect(sub.isFuse).toBe(true);
    });

    it('returns empty array when input is invalid or has no series', () => {
      expect(normalizePlanningMunitions(null)).toEqual([]);
      expect(normalizePlanningMunitions({})).toEqual([]);
      expect(normalizePlanningMunitions({ series: [] })).toEqual([]);
    });

    it('normalizes loadingZoneValue and loadingZones for propellant charges', () => {
      const raw = {
        series: [
          {
            seriesId: 'series-01',
            configurations: [
              {
                id: 'cfg-01',
                seriesId: 'series-01',
                components: [
                  {
                    id: 'comp-charge',
                    type: { id: 'type-charge', label: 'Carga de proyección', type: 'PROPELLANT_CHARGE' },
                    denomination: { id: 'den-charge', name: 'Carga M4' },
                    loadingZoneValue: '3G',
                  },
                  {
                    id: 'comp-charge-zones',
                    type: { id: 'type-charge-2', label: 'Carga de proyección 2' },
                    denomination: { id: 'den-charge-2', name: 'Carga M5' },
                    zones: ['Z1', 'Z2'],
                  },
                ],
              },
            ],
          },
        ],
      };

      const configs = normalizePlanningMunitions(raw);
      expect(configs[0].subComponents[0].loadingZoneValue).toBe('3G');
      expect(configs[0].subComponents[0].loadingZones).toEqual(['3G']);
      expect(configs[0].subComponents[0].category).toBe('carga');

      expect(configs[0].subComponents[1].loadingZoneValue).toBeNull();
      expect(configs[0].subComponents[1].loadingZones).toEqual(['Z1', 'Z2']);
    });

    it('normalizes quantity and suplemento category correctly', () => {
      const raw = {
        series: [
          {
            seriesId: 'series-01',
            configurations: [
              {
                id: 'cfg-01',
                seriesId: 'series-01',
                components: [
                  {
                    id: 'comp-suppl',
                    type: { id: 'type-suppl', label: 'Suplemento', type: 'MUNITION_COMPONENT' },
                    denomination: { id: 'den-suppl', name: 'Suplemento A' },
                    quantity: 4,
                  },
                ],
              },
            ],
          },
        ],
      };

      const configs = normalizePlanningMunitions(raw);
      expect(configs[0].subComponents[0].category).toBe('suplemento');
      expect(configs[0].subComponents[0].quantity).toBe(4);
      expect(configs[0].subComponents[0].isFuse).toBe(false);
    });
  });
});
