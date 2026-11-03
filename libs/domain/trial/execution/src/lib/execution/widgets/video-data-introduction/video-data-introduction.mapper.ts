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
  const firstMeasurement = data?.measurements[0];
  const camera = data ? String(data.cameraId) : null;
  const grabador = data ? String(data.recorderId) : null;
  const canal = data ? String(data.channel).padStart(2, '0') : null;
  const equipment = buildVideoEquipmentCombinedValue(camera, grabador, canal);

  return {
    equipment,
    camera,
    grabador,
    canal,
    magnitud: firstMeasurement?.measureId ?? null,
    resultadoObservado: firstMeasurement?.observedResult ?? '',
    observaciones: response?.observations ?? '',
  };
}

function parseEquipmentId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function updateMeasurements(
  measurements: ShotVideoData['measurements'],
  measureId: string,
  observedResult: string,
): ShotVideoData['measurements'] {
  const selectedMeasurement = { measureId, observedResult };
  const hasSelectedMeasurement = measurements.some((measurement) => measurement.measureId === measureId);

  if (!hasSelectedMeasurement) {
    return [...measurements, selectedMeasurement];
  }

  return measurements.map((measurement) => (measurement.measureId === measureId ? selectedMeasurement : measurement));
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

  const cameraId = parseEquipmentId(camera);
  const recorderId = parseEquipmentId(grabador);
  if (cameraId === null || recorderId === null) return null;

  const current = currentResponse ?? {};
  const currentVideoData = tipoVideo === 'AV' ? current.highSpeedVideoData : current.conventionalVideoData;
  const videoData: ShotVideoData = {
    cameraId,
    recorderId,
    channel: Number(canal),
    measurements: updateMeasurements(currentVideoData?.measurements ?? [], magnitud, resultadoObservado),
  };

  return {
    highSpeedVideoData: tipoVideo === 'AV' ? videoData : (current.highSpeedVideoData ?? null),
    conventionalVideoData: tipoVideo === 'C' ? videoData : (current.conventionalVideoData ?? null),
    observations: observaciones || null,
  };
}
