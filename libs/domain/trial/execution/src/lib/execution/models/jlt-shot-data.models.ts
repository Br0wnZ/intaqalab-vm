import type { DistanceUnitEnum } from '@intaqalab/models';

export interface JltShotDataPayload {
  jet: string;
  pieceOperator: string;
  attackDistance: number | null;
  attackDistanceUnit?: DistanceUnitEnum;
  recoilDistance: number | null;
  recoilDistanceUnit?: DistanceUnitEnum;
  observations?: string | null;
}

export type JltShotDataRequest = JltShotDataPayload;

export type JltShotDataResponse = JltShotDataPayload | { jltData: JltShotDataPayload };
