import type { FireTrial } from '@intaqalab/models';

export type Serie = {
  id: string;
  name: string;
  shotQuantity: number;
  executionOrder: number;
  observations: string;
  shots: Shot[];
};

export type Shot = {
  id: string;
  globalNumber: number;
  observation: string;
};

export type AddNewSerieRequest = {
  trialId: FireTrial['id'];
  name: string;
  numberOfShots: number;
  observations?: string;
};

export type SeriesAndShotsResponse = {
  id: Serie['id'];
  name: Serie['name'];
  order: Serie['executionOrder'];
  observations: Serie['observations'];
  shots: Serie['shots'];
};

export type ReorderSeriesRequest = {
  trialId: FireTrial['id'];
  seriesIds: Serie['id'][];
};

export type AddShotToSerieRequest = {
  serieId: Serie['id'];
};
