import { DistanceUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { ShotManometerPressuresResponse } from '../../models/shot-manometer-pressures.models';
import {
  buildShotManometerPressuresRequest,
  extractManometerPressuresData,
  mapDistanceUnitToApi,
  mapDistanceUnitToUi,
  mapPlanningSeriesToOptions,
  mapRemoteToManometerState,
  mapShotsToDisparoOptions,
  numToField,
  parseNum,
} from './manometer-introduction.mapper';

describe('manometer-introduction.mapper', () => {
  it('mapPlanningSeriesToOptions maps series or returns fallback', () => {
    const planning = [
      { id: 'serie-1', name: 'Serie Uno' },
      { id: 'serie-2', name: null },
    ];
    const result = mapPlanningSeriesToOptions(planning, [{ value: 'fb', label: 'Fallback' }]);
    expect(result).toEqual([
      { value: 'serie-1', label: 'Serie Uno' },
      { value: 'serie-2', label: 'Serie 2' },
    ]);

    expect(mapPlanningSeriesToOptions([], [{ value: 'fb', label: 'Fallback' }])).toEqual([
      { value: 'fb', label: 'Fallback' },
    ]);
  });

  it('mapShotsToDisparoOptions maps shots or returns fallback', () => {
    const shots = [{ shotId: 'shot-1' }, { shotId: 'shot-2' }];
    const result = mapShotsToDisparoOptions(shots, [{ value: 'fb', label: 'Fallback' }]);
    expect(result).toEqual([
      { value: 'shot-1', label: 'Disparo 1' },
      { value: 'shot-2', label: 'Disparo 2' },
    ]);

    expect(mapShotsToDisparoOptions(null, [{ value: 'fb', label: 'Fallback' }])).toEqual([
      { value: 'fb', label: 'Fallback' },
    ]);
  });

  it('mapDistanceUnitToUi and mapDistanceUnitToApi convert units correctly', () => {
    expect(mapDistanceUnitToUi(DistanceUnitEnum.UM)).toBe('μm');
    expect(mapDistanceUnitToUi(DistanceUnitEnum.MM)).toBe('mm');
    expect(mapDistanceUnitToUi(null)).toBe('μm');

    expect(mapDistanceUnitToApi('μm')).toBe(DistanceUnitEnum.UM);
    expect(mapDistanceUnitToApi('mm')).toBe(DistanceUnitEnum.MM);
    expect(mapDistanceUnitToApi(null)).toBe(DistanceUnitEnum.UM);
  });

  it('numToField and parseNum convert numbers accurately', () => {
    expect(numToField(125.4, 'μm')).toEqual({ value: '125.4', unit: 'μm' });
    expect(numToField(null)).toBeNull();

    expect(parseNum({ value: '125.4', unit: 'μm' })).toBe(125.4);
    expect(parseNum({ value: '125,4', unit: 'μm' })).toBe(125.4);
    expect(parseNum({ value: '0', unit: 'μm' })).toBe(0);
    expect(parseNum(null)).toBeNull();
    expect(parseNum({ value: '', unit: 'μm' })).toBeNull();
  });

  it('extractManometerPressuresData extracts nested or flat data', () => {
    const nested: ShotManometerPressuresResponse = {
      manometerPressuresData: {
        h1: 120,
        observations: 'test',
      },
    };
    expect(extractManometerPressuresData(nested)).toEqual({ h1: 120, observations: 'test' });
    expect(extractManometerPressuresData(null)).toBeNull();
  });

  it('mapRemoteToManometerState maps response to state fields', () => {
    const response: ShotManometerPressuresResponse = {
      manometerPressuresData: {
        pressureGaugeId: 'gauge-1',
        crusherId: 'crusher-1',
        probeId: 'probe-1',
        h1: 125.4,
        h1Unit: DistanceUnitEnum.UM,
        h2: 126.1,
        h2Unit: DistanceUnitEnum.UM,
        h3: 125.8,
        h3Unit: DistanceUnitEnum.MM,
        h4: 126.0,
        h4Unit: DistanceUnitEnum.UM,
        h5: 125.6,
        h5Unit: DistanceUnitEnum.UM,
        observations: 'All good',
      },
    };

    const state = mapRemoteToManometerState(response);
    expect(state).toEqual({
      manometro: 'gauge-1',
      crusher: 'crusher-1',
      micrometroPalpador: 'probe-1',
      h1: 125.4,
      h1Unit: 'μm',
      h2: 126.1,
      h2Unit: 'μm',
      h3: 125.8,
      h3Unit: 'mm',
      h4: 126.0,
      h4Unit: 'μm',
      h5: 125.6,
      h5Unit: 'μm',
      observaciones: 'All good',
    });
  });

  it('buildShotManometerPressuresRequest constructs correct request payload', () => {
    const request = buildShotManometerPressuresRequest({
      manometro: 'gauge-1',
      crusher: 'crusher-1',
      micrometroPalpador: 'probe-1',
      h1Field: { value: '125.4', unit: 'μm' },
      h2Field: { value: '126.1', unit: 'μm' },
      h3Field: { value: '125.8', unit: 'mm' },
      h4Field: { value: '126.0', unit: 'μm' },
      h5Field: { value: '125.6', unit: 'μm' },
      observaciones: 'Obs',
    });

    expect(request).toEqual({
      pressureGaugeId: 'gauge-1',
      crusherId: 'crusher-1',
      probeId: 'probe-1',
      h1: 125.4,
      h1Unit: DistanceUnitEnum.UM,
      h2: 126.1,
      h2Unit: DistanceUnitEnum.UM,
      h3: 125.8,
      h3Unit: DistanceUnitEnum.MM,
      h4: 126.0,
      h4Unit: DistanceUnitEnum.UM,
      h5: 125.6,
      h5Unit: DistanceUnitEnum.UM,
      observations: 'Obs',
    });
  });
});
