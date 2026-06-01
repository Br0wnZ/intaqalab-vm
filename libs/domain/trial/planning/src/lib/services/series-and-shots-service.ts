import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  AddNewSerieRequest,
  AddShotToSerieRequest,
  ReorderSeriesRequest,
  Serie,
  SeriesAndShotsResponse,
  Shot,
} from '../utils-models/series-and-shots.model';
import type { UpdateShotRequest } from '../utils-models/update-shot-request.model';
import type { UpsertTrialSerieRequest } from '../utils-models/upsert-trial-serie-info.model';

@Injectable({
  providedIn: 'root',
})
export class SeriesAndShotsService {
  readonly #getSeriesParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #addNewSerieParams = signal<AddNewSerieRequest | null>(null);
  readonly #updateSerieParams = signal<UpsertTrialSerieRequest | null>(null);
  readonly #deleteSerieParams = signal<{ serieId: string } | null>(null);
  readonly #reorderSeriesParams = signal<ReorderSeriesRequest | null>(null);
  readonly #addShotToSerieParams = signal<AddShotToSerieRequest | null>(null);
  readonly #updateShotParams = signal<UpdateShotRequest | null>(null);
  readonly #deleteShotParams = signal<{ shotId: string } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly seriesAndShotsResource = httpResource<Serie[]>(() => {
    const params = this.#getSeriesParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/series`,
      method: 'GET',
    };
  });

  readonly addNewSerieResource = httpResource<SeriesAndShotsResponse>(() => {
    const body = this.#addNewSerieParams();
    if (!body) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${body.trialId}/planning/series`,
      method: 'POST',
      body,
    };
  });

  readonly updateSerieResource = httpResource<void>(() => {
    const body = this.#updateSerieParams();
    if (!body) return undefined;
    const { id, ...data } = body;
    return {
      url: `${this.#planningUrl}/planning/series/${id}`,
      method: 'PUT',
      body: data,
    };
  });

  readonly deleteSerieResource = httpResource<void>(() => {
    const params = this.#deleteSerieParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/planning/series/${params.serieId}`,
      method: 'DELETE',
    };
  });

  readonly reorderSeriesResource = httpResource<void>(() => {
    const body = this.#reorderSeriesParams();
    if (!body) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${body.trialId}/planning/series/reorder`,
      method: 'PUT',
      body: { seriesIds: body.seriesIds },
    };
  });

  readonly addShotToSerieResource = httpResource<Shot>(() => {
    const body = this.#addShotToSerieParams();
    if (!body) return undefined;
    const { serieId, ...rest } = body;
    return {
      url: `${this.#planningUrl}/planning/series/${serieId}/shots`,
      method: 'POST',
      body: rest,
    };
  });

  readonly updateShotResource = httpResource<void>(() => {
    const body = this.#updateShotParams();
    if (!body) return undefined;
    return {
      url: `${this.#planningUrl}/planning/shots/${body.shotId}`,
      method: 'PUT',
      body,
    };
  });

  readonly deleteShotFromSerieResource = httpResource<void>(() => {
    const params = this.#deleteShotParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/planning/shots/${params.shotId}`,
      method: 'DELETE',
    };
  });

  getSeriesAndShots(trialId: FireTrial['id']) {
    this.#getSeriesParams.set({ trialId });
  }

  addNewSerie(request: AddNewSerieRequest) {
    this.#addNewSerieParams.set(request);
  }

  updateSerie(request: UpsertTrialSerieRequest) {
    this.#updateSerieParams.set(request);
  }

  deleteSerie(serieId: string) {
    this.#deleteSerieParams.set({ serieId });
  }

  deleteShot(shotId: string) {
    this.#deleteShotParams.set({ shotId });
  }

  reorderSeries(request: ReorderSeriesRequest) {
    this.#reorderSeriesParams.set(request);
  }

  addShotToSerie(request: AddShotToSerieRequest) {
    this.#addShotToSerieParams.set(request);
  }

  updateShot(request: UpdateShotRequest) {
    this.#updateShotParams.set(request);
  }

  resetAddNewSerie() {
    this.#addNewSerieParams.set(null);
  }

  resetUpdateSerie() {
    this.#updateSerieParams.set(null);
  }
}
