import { describe, expect, it } from 'vitest';

import type { NormalizedMunitionConfig } from '../models';
import { filterConfigsForShot, isConfigAssignedToShot, selectShotMunitionComponents } from './shot-munition.selectors';

describe('shot-munition.selectors', () => {
  const sampleConfigs: NormalizedMunitionConfig[] = [
    {
      id: 'cfg-1',
      seriesId: 'serie-a',
      assignedShotIds: ['shot-1', 'shot-2'],
      mainComponent: {
        id: 'main-1',
        componentTypeId: 'type-granada-155',
        label: 'Granada 155mm',
        category: 'granada',
        rawCategory: 'MUNITION',
        denominationId: 'den-155',
        denominationName: '155mm HE',
        batch: 'LOT-G1',
        clientNumber: 'C1',
        fuseWorkingModeId: null,
        fuseMeasurement: null,
        isFuse: false,
      },
      subComponents: [
        {
          id: 'sub-1',
          componentTypeId: 'type-espoleta-4ap',
          label: 'Espoleta 4AP',
          category: 'espoleta',
          rawCategory: 'MUNITION_COMPONENT',
          denominationId: 'den-esp-4ap',
          denominationName: '4AP',
          batch: 'LOT-E1',
          clientNumber: 'C2',
          fuseWorkingModeId: 'mode-perc',
          fuseMeasurement: 5,
          isFuse: true,
        },
      ],
    },
    {
      id: 'cfg-2',
      seriesId: 'serie-a',
      assignedShotIds: ['shot-3'],
      mainComponent: {
        id: 'main-2',
        componentTypeId: 'type-granada-mortero',
        label: 'Granada mortero',
        category: 'granada',
        rawCategory: 'MUNITION',
        denominationId: 'den-gm',
        denominationName: 'GM 81mm',
        batch: 'LOT-GM',
        clientNumber: 'C3',
        fuseWorkingModeId: null,
        fuseMeasurement: null,
        isFuse: false,
      },
      subComponents: [],
    },
    {
      id: 'cfg-3',
      seriesId: 'serie-b',
      assignedShotIds: null, // applies to all shots in serie-b
      mainComponent: null,
      subComponents: [
        {
          id: 'sub-3',
          componentTypeId: 'type-carga',
          label: 'Carga propulsora',
          category: 'carga',
          rawCategory: 'MUNITION_COMPONENT',
          denominationId: 'den-carga',
          denominationName: 'Carga M232',
          batch: null,
          clientNumber: null,
          fuseWorkingModeId: null,
          fuseMeasurement: null,
          isFuse: false,
        },
      ],
    },
  ];

  describe('isConfigAssignedToShot', () => {
    it('returns true when assignedShotIds is null or empty', () => {
      expect(isConfigAssignedToShot(sampleConfigs[2], 'any-shot')).toBe(true);
      expect(isConfigAssignedToShot({ ...sampleConfigs[2], assignedShotIds: [] }, 'any-shot')).toBe(true);
    });

    it('returns true when shotId is null or matches assigned list', () => {
      expect(isConfigAssignedToShot(sampleConfigs[0], null)).toBe(true);
      expect(isConfigAssignedToShot(sampleConfigs[0], 'shot-1')).toBe(true);
      expect(isConfigAssignedToShot(sampleConfigs[0], 'shot-3')).toBe(false);
    });
  });

  describe('filterConfigsForShot', () => {
    it('returns empty array if seriesId is null', () => {
      expect(filterConfigsForShot(sampleConfigs, null, 'shot-1')).toEqual([]);
    });

    it('filters configurations by series and shot', () => {
      const shots1 = filterConfigsForShot(sampleConfigs, 'serie-a', 'shot-1');
      expect(shots1).toHaveLength(1);
      expect(shots1[0].id).toBe('cfg-1');

      const shots3 = filterConfigsForShot(sampleConfigs, 'serie-a', 'shot-3');
      expect(shots3).toHaveLength(1);
      expect(shots3[0].id).toBe('cfg-2');

      const serieB = filterConfigsForShot(sampleConfigs, 'serie-b', 'shot-99');
      expect(serieB).toHaveLength(1);
      expect(serieB[0].id).toBe('cfg-3');
    });
  });

  describe('selectShotMunitionComponents', () => {
    it('extracts main and sub components deduplicating by componentTypeId', () => {
      const options = selectShotMunitionComponents({
        configs: sampleConfigs,
        seriesId: 'serie-a',
        shotId: 'shot-1',
      });

      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({
        value: 'type-granada-155',
        label: 'Granada 155mm',
        category: 'granada',
        rawCategory: 'MUNITION',
        source: 'CONFIGURATION',
        configurationId: 'cfg-1',
        isFuse: false,
        planned: {
          denominationId: 'den-155',
          denominationName: '155mm HE',
          batch: 'LOT-G1',
          clientNumber: 'C1',
          fuseWorkingModeId: null,
          fuseMeasurement: null,
        },
      });

      expect(options[1]).toEqual({
        value: 'type-espoleta-4ap',
        label: 'Espoleta 4AP',
        category: 'espoleta',
        rawCategory: 'MUNITION_COMPONENT',
        source: 'COMPONENT',
        configurationId: 'cfg-1',
        isFuse: true,
        planned: {
          denominationId: 'den-esp-4ap',
          denominationName: '4AP',
          batch: 'LOT-E1',
          clientNumber: 'C2',
          fuseWorkingModeId: 'mode-perc',
          fuseMeasurement: 5,
        },
      });
    });

    it('returns different components when shotId switches', () => {
      const shot3Options = selectShotMunitionComponents({
        configs: sampleConfigs,
        seriesId: 'serie-a',
        shotId: 'shot-3',
      });

      expect(shot3Options).toHaveLength(1);
      expect(shot3Options[0].value).toBe('type-granada-mortero');
    });
  });
});
