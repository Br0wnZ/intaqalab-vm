export interface ShotVideoData {
  cameraId: string;
  recorderId: string;
  channel: number;
  measureId: string;
  observedResult?: string | null;
  observations?: string | null;
}

export interface ShotVideoDataRequest {
  highSpeedVideoData?: ShotVideoData | null;
  conventionalVideoData?: ShotVideoData | null;
}

export type ShotVideoDataResponse = ShotVideoDataRequest;
