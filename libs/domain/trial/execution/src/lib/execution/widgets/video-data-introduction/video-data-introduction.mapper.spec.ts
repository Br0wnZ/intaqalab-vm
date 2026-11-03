import { describe, expect, it } from 'vitest';

import type { ShotVideoDataResponse } from '../../models';
import {
  buildVideoEquipmentCombinedValue,
  mapVideoFormToRequest,
  mapVideoResponseToForm,
  matchesEquipmentId,
  resolveVideoType,
  splitVideoEquipmentCombinedValue,
} from './video-data-introduction.mapper';

const response: ShotVideoDataResponse = {
  highSpeedVideoData: {
    cameraId: 21051,
    recorderId: 21073,
    channel: 1,
    measurements: [
      { measureId: 'measure-av', observedResult: 'AV result' },
      { measureId: 'measure-av-other', observedResult: 'Other AV result' },
    ],
  },
  conventionalVideoData: {
    cameraId: 21052,
    recorderId: 21073,
    channel: 2,
    measurements: [{ measureId: 'measure-c', observedResult: 'C result' }],
  },
  observations: 'Shared observations',
};

describe('video-data-introduction.mapper', () => {
  it('keeps current video type when its response block exists', () => {
    expect(resolveVideoType(response, 'C')).toBe('C');
    expect(resolveVideoType(response, 'AV')).toBe('AV');
  });

  it('selects the available response block when current type has no data', () => {
    expect(
      resolveVideoType({ highSpeedVideoData: null, conventionalVideoData: response.conventionalVideoData }, 'AV'),
    ).toBe('C');
  });

  it('maps API data to UI fields and zero-pads channel', () => {
    expect(mapVideoResponseToForm(response, 'C')).toEqual({
      equipment: '21052|21073|02',
      camera: '21052',
      grabador: '21073',
      canal: '02',
      magnitud: 'measure-c',
      resultadoObservado: 'C result',
      observaciones: 'Shared observations',
    });
  });

  it('maps UI fields to API data and preserves the other video block', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          camera: '21054',
          grabador: '21073',
          canal: '03',
          magnitud: 'measure-av',
          resultadoObservado: '',
          observaciones: 'Updated shared observations',
        },
        response,
      ),
    ).toEqual({
      highSpeedVideoData: {
        cameraId: 21054,
        recorderId: 21073,
        channel: 3,
        measurements: [
          { measureId: 'measure-av', observedResult: '' },
          { measureId: 'measure-av-other', observedResult: 'Other AV result' },
        ],
      },
      conventionalVideoData: response.conventionalVideoData,
      observations: 'Updated shared observations',
    });
  });

  it('maps UI fields using equipment when individual fields are missing', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          equipment: '21054|21073|03',
          camera: null,
          grabador: null,
          canal: null,
          magnitud: 'measure-av',
          resultadoObservado: '',
          observaciones: '',
        },
        response,
      ),
    ).toEqual({
      highSpeedVideoData: {
        cameraId: 21054,
        recorderId: 21073,
        channel: 3,
        measurements: [
          { measureId: 'measure-av', observedResult: '' },
          { measureId: 'measure-av-other', observedResult: 'Other AV result' },
        ],
      },
      conventionalVideoData: response.conventionalVideoData,
      observations: null,
    });
  });

  it('returns null when required API fields are missing', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          camera: null,
          grabador: '21073',
          canal: '01',
          magnitud: 'measure-av',
          resultadoObservado: '',
          observaciones: '',
        },
        response,
      ),
    ).toBeNull();
  });

  it('returns null when equipment IDs are not integers', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          camera: 'camera-av',
          grabador: '21073',
          canal: '01',
          magnitud: 'measure-av',
          resultadoObservado: '',
          observaciones: '',
        },
        response,
      ),
    ).toBeNull();
  });

  describe('combined equipment helpers', () => {
    it('builds combined value from components', () => {
      expect(buildVideoEquipmentCombinedValue('cam1', 'rec1', 1)).toBe('cam1|rec1|01');
      expect(buildVideoEquipmentCombinedValue('cam1', null, 2)).toBe('cam1||02');
      expect(buildVideoEquipmentCombinedValue(null, null, null)).toBeNull();
    });

    it('splits combined value into components', () => {
      expect(splitVideoEquipmentCombinedValue('cam1|rec1|01')).toEqual({
        camera: 'cam1',
        grabador: 'rec1',
        canal: '01',
      });
      expect(splitVideoEquipmentCombinedValue(null)).toEqual({
        camera: null,
        grabador: null,
        canal: null,
      });
    });

    it('matches equipment id directly or by numeric suffix', () => {
      expect(matchesEquipmentId(new Set(['1']), '1')).toBe(true);
      expect(matchesEquipmentId(new Set(['1']), 'cam-av-1')).toBe(true);
      expect(matchesEquipmentId(new Set(['1']), 'cam-av-001')).toBe(true);
      expect(matchesEquipmentId(new Set(['2']), 'cam-av-1')).toBe(false);
    });
  });
});
