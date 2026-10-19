import type { ShotVideoData, ShotVideoDataRequest, ShotVideoDataResponse } from '../../models';

export type VideoType = 'AV' | 'C';

export const VIDEO_EQUIPMENT_SEPARATOR = '|';

/**
 * Builds composite equipment string: "cameraId|recorderId|channel".
 */
export function buildVideoEquipmentCombinedValue(
  cameraId: string | number | null | undefined,
  recorderId: string | number | null | undefined,
  channel: string | number | null | undefined,
): string | null {
  const cam = cameraId !== null && cameraId !== undefined && cameraId !== '' ? String(cameraId) : '';
  const rec = recorderId !== null && recorderId !== undefined && recorderId !== '' ? String(recorderId) : '';
  const ch = channel !== null && channel !== undefined && channel !== '' ? String(channel).padStart(2, '0') : '';

  if (!cam && !rec && !ch) return null;
  return `${cam}${VIDEO_EQUIPMENT_SEPARATOR}${rec}${VIDEO_EQUIPMENT_SEPARATOR}${ch}`;
}

/**
 * Splits composite equipment string into its camera, recorder, and channel components.
 */
export function splitVideoEquipmentCombinedValue(value: string | null | undefined): {
  camera: string | null;
  grabador: string | null;
  canal: string | null;
} {
  if (!value) return { camera: null, grabador: null, canal: null };
  const parts = value.split(VIDEO_EQUIPMENT_SEPARATOR);
  return {
    camera: parts[0] || null,
    grabador: parts[1] || null,
    canal: parts[2] || null,
  };
}

/**
 * Matches equipment item ID directly or by numeric suffix.
 */
export const matchesEquipmentId = (idSet: ReadonlySet<string>, itemId: string): boolean => {
  if (idSet.has(itemId)) return true;
  const num = itemId.match(/(\d+)$/)?.[1];
  return Boolean(num && (idSet.has(num) || idSet.has(String(Number(num)))));
};

export interface VideoDataFormValue {
  tipoVideo: VideoType | null;
  equipment?: string | null;
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
  const camera = data?.cameraId ?? null;
  const grabador = data?.recorderId ?? null;
  const canal = data ? String(data.channel).padStart(2, '0') : null;
  const equipment = buildVideoEquipmentCombinedValue(camera, grabador, canal);

  return {
    equipment,
    camera,
    grabador,
    canal,
    magnitud: data?.measureId ?? null,
    resultadoObservado: data?.observedResult ?? '',
    observaciones: data?.observations ?? '',
  };
}

export function mapVideoFormToRequest(
  formValue: VideoDataFormValue,
  currentResponse: ShotVideoDataResponse | null,
): ShotVideoDataRequest | null {
  let { camera, grabador, canal } = formValue;
  const { tipoVideo, equipment, magnitud, resultadoObservado, observaciones } = formValue;

  if (equipment && (!camera || !grabador || !canal)) {
    const split = splitVideoEquipmentCombinedValue(equipment);
    camera = camera ?? split.camera;
    grabador = grabador ?? split.grabador;
    canal = canal ?? split.canal;
  }

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
