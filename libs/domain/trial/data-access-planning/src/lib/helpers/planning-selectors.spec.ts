import { describe, expect, it } from 'vitest';

import type { TrialArmamentResponse } from '../models/planning-armament.model';
import type { TrialMeasuresResponse } from '../models/planning-measures.model';
import type { TrialMunitionsRawItem } from '../models/planning-munitions.model';
import type { PlanningSeriesItem } from '../models/planning-series.model';
import {
  flattenSeriesShots,
  getArmamentByShotId,
  getMeasureByMagnitudeCode,
  getMeasuresForFamily,
  getMunitionConfigsByShotId,
  getSeriesById,
  getShotById,
} from './planning-selectors';

const SERIES: PlanningSeriesItem[] = [
  {
    id: 'serie-1',
    name: 'Serie 1',
    executionOrder: 1,
    shots: [
      { id: 'shot-1', globalNumber: 2, observation: null },
      { id: 'shot-2', globalNumber: 1, observation: 'primero' },
    ],
  },
  {
    id: 'serie-2',
    name: 'Serie 2',
    executionOrder: 2,
    shots: [{ id: 'shot-3', globalNumber: 3, observation: null }],
  },
];

const MEASURES: TrialMeasuresResponse = {
  series: [
    {
      seriesId: 'serie-1',
      seriesName: 'Serie 1',
      measures: {
        topographyMeasures: [],
        munitionsMeasures: [],
        armamentMeasures: [],
        ballisticsMeasures: [
          {
            id: 'measure-1',
            name: 'Velocidad inicial',
            magnitudeCode: 'BAL_INITIAL_VELOCITY',
            deviation: 10,
          },
        ],
      },
    },
  ],
};

const MUNITIONS: TrialMunitionsRawItem = {
  series: [
    {
      seriesId: 'serie-1',
      seriesName: 'Serie 1',
      configurations: [
        { id: 'config-1', seriesId: 'serie-1', denomination: null, components: [], assignedShotIds: ['shot-1'] },
        { id: 'config-2', seriesId: 'serie-1', denomination: null, components: [], assignedShotIds: [] },
      ],
    },
  ],
};

const ARMAMENT: TrialArmamentResponse = {
  series: [
    {
      seriesId: 'serie-1',
      seriesName: 'Serie 1',
      shots: [{ shotId: 'shot-1', armament: { weaponName: 'Houfizer', isInstrumented: true } }],
    },
  ],
};

describe('planning selectors', () => {
  it('getSeriesById should return the matching series by id', () => {
    expect(getSeriesById(SERIES, 'serie-2')?.name).toBe('Serie 2');
    expect(getSeriesById(SERIES, 'unknown')).toBeUndefined();
    expect(getSeriesById(null, 'serie-1')).toBeUndefined();
    expect(getSeriesById(undefined, 'serie-1')).toBeUndefined();
  });

  it('getShotById should find shots across series', () => {
    expect(getShotById(SERIES, 'shot-3')?.globalNumber).toBe(3);
    expect(getShotById(SERIES, 'unknown')).toBeUndefined();
    expect(getShotById(undefined, 'shot-1')).toBeUndefined();
  });

  it('flattenSeriesShots should flatten and sort shots by globalNumber', () => {
    const shots = flattenSeriesShots(SERIES);
    expect(shots.map((shot) => shot.id)).toEqual(['shot-2', 'shot-1', 'shot-3']);
    expect(flattenSeriesShots(undefined)).toEqual([]);
    expect(flattenSeriesShots(null)).toEqual([]);
  });

  it('getMeasuresForFamily should return the family measures of the series', () => {
    const ballistics = getMeasuresForFamily(MEASURES, 'serie-1', 'ballisticsMeasures');
    expect(ballistics).toHaveLength(1);
    expect(ballistics[0]?.magnitudeCode).toBe('BAL_INITIAL_VELOCITY');

    expect(getMeasuresForFamily(MEASURES, 'serie-2', 'ballisticsMeasures')).toEqual([]);
    expect(getMeasuresForFamily(undefined, 'serie-1', 'ballisticsMeasures')).toEqual([]);
  });

  it('getMeasureByMagnitudeCode should search all family lists', () => {
    const measure = getMeasureByMagnitudeCode(MEASURES, 'serie-1', 'BAL_INITIAL_VELOCITY');
    expect(measure?.deviation).toBe(10);
    expect(getMeasureByMagnitudeCode(MEASURES, 'serie-1', 'UNKNOWN_CODE')).toBeUndefined();
    expect(getMeasureByMagnitudeCode(MEASURES, 'serie-2', 'BAL_INITIAL_VELOCITY')).toBeUndefined();
  });

  it('getMunitionConfigsByShotId should include global and assigned configurations', () => {
    const configs = getMunitionConfigsByShotId(MUNITIONS, 'serie-1', 'shot-1');
    expect(configs.map((config) => config.id)).toEqual(['config-1', 'config-2']);

    const configsShot2 = getMunitionConfigsByShotId(MUNITIONS, 'serie-1', 'shot-2');
    expect(configsShot2.map((config) => config.id)).toEqual(['config-2']);

    expect(getMunitionConfigsByShotId(MUNITIONS, 'serie-2', 'shot-1')).toEqual([]);
    expect(getMunitionConfigsByShotId(undefined, 'serie-1', 'shot-1')).toEqual([]);
  });

  it('getArmamentByShotId should return the planned armament of a shot', () => {
    const armament = getArmamentByShotId(ARMAMENT, 'serie-1', 'shot-1');
    expect(armament?.armament?.isInstrumented).toBe(true);
    expect(getArmamentByShotId(ARMAMENT, 'serie-1', 'shot-2')).toBeUndefined();
    expect(getArmamentByShotId(undefined, 'serie-1', 'shot-1')).toBeUndefined();
  });
});
