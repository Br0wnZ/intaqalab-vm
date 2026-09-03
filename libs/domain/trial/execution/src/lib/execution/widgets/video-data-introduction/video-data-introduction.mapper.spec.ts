import { describe, expect, it } from 'vitest';

import type { ShotVideoDataResponse } from '../../models';
import { mapVideoFormToRequest, mapVideoResponseToForm, resolveVideoType } from './video-data-introduction.mapper';

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
});
