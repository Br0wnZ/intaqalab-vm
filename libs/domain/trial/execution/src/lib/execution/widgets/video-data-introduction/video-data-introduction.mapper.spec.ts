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
    cameraId: 'camera-av',
    recorderId: 'recorder-av',
    channel: 1,
    measureId: 'measure-av',
    observedResult: 'AV result',
    observations: 'AV observations',
  },
  conventionalVideoData: {
    cameraId: 'camera-c',
    recorderId: 'recorder-c',
    channel: 2,
    measureId: 'measure-c',
    observedResult: 'C result',
    observations: 'C observations',
  },
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
      equipment: 'camera-c|recorder-c|02',
      camera: 'camera-c',
      grabador: 'recorder-c',
      canal: '02',
      magnitud: 'measure-c',
      resultadoObservado: 'C result',
      observaciones: 'C observations',
    });
  });

  it('maps UI fields to API data and preserves the other video block', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          camera: 'camera-av-updated',
          grabador: 'recorder-av',
          canal: '03',
          magnitud: 'measure-av',
          resultadoObservado: '',
          observaciones: '',
        },
        response,
      ),
    ).toEqual({
      highSpeedVideoData: {
        cameraId: 'camera-av-updated',
        recorderId: 'recorder-av',
        channel: 3,
        measureId: 'measure-av',
        observedResult: null,
        observations: null,
      },
      conventionalVideoData: response.conventionalVideoData,
    });
  });

  it('maps UI fields using equipment when individual fields are missing', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          equipment: 'camera-av-updated|recorder-av|03',
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
        cameraId: 'camera-av-updated',
        recorderId: 'recorder-av',
        channel: 3,
        measureId: 'measure-av',
        observedResult: null,
        observations: null,
      },
      conventionalVideoData: response.conventionalVideoData,
    });
  });

  it('returns null when required API fields are missing', () => {
    expect(
      mapVideoFormToRequest(
        {
          tipoVideo: 'AV',
          camera: null,
          grabador: 'recorder-av',
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
