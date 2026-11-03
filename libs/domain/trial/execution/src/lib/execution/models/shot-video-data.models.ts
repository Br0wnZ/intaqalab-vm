export interface ShotVideoMeasurement {
  measureId: string;
  observedResult: string;
}

export interface ShotVideoData {
  cameraId: number;
  recorderId: number;
  channel: number;
  measurements: ShotVideoMeasurement[];
}

export interface ShotVideoDataRequest {
  highSpeedVideoData?: ShotVideoData | null;
  conventionalVideoData?: ShotVideoData | null;
  observations?: string | null;
}

export type ShotVideoDataResponse = ShotVideoDataRequest;
