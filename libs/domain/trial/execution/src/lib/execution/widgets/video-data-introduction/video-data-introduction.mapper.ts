import type { ShotVideoData, ShotVideoDataRequest, ShotVideoDataResponse } from '../../models';

export type VideoType = 'AV' | 'C';

export interface VideoDataFormValue {
  tipoVideo: VideoType | null;
  camera: string | null;
  grabador: string | null;
  canal: string | null;
  magnitud: string | null;
  resultadoObservado: string;
  observaciones: string;
}

export function resolveVideoType(response: ShotVideoDataResponse, currentType: VideoType | null): VideoType {
  if (currentType === 'C' && response.conventionalVideoData) return 'C';
  if (currentType === 'AV' && response.highSpeedVideoData) return 'AV';
  return response.highSpeedVideoData ? 'AV' : 'C';
}

export function mapVideoResponseToForm(
  response: ShotVideoDataResponse | null,
  tipoVideo: VideoType | null,
): Omit<VideoDataFormValue, 'tipoVideo'> {
  const data = tipoVideo === 'AV' ? response?.highSpeedVideoData : response?.conventionalVideoData;

  return {
    camera: data?.cameraId ?? null,
    grabador: data?.recorderId ?? null,
    canal: data ? String(data.channel).padStart(2, '0') : null,
    magnitud: data?.measureId ?? null,
    resultadoObservado: data?.observedResult ?? '',
    observaciones: data?.observations ?? '',
  };
}

export function mapVideoFormToRequest(
  formValue: VideoDataFormValue,
  currentResponse: ShotVideoDataResponse | null,
): ShotVideoDataRequest | null {
  const { tipoVideo, camera, grabador, canal, magnitud, resultadoObservado, observaciones } = formValue;
  if (!tipoVideo || !camera || !grabador || !canal || !magnitud) return null;

  const videoData: ShotVideoData = {
    cameraId: camera,
    recorderId: grabador,
    channel: Number(canal),
    measureId: magnitud,
    observedResult: resultadoObservado || null,
    observations: observaciones || null,
  };
  const current = currentResponse ?? {};

  return tipoVideo === 'AV'
    ? { ...current, highSpeedVideoData: videoData }
    : { ...current, conventionalVideoData: videoData };
}
