/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { SeriesAndShotsService } from '../services/series-and-shots-service';
import type {
  AddNewSerieRequest,
  AddShotToSerieRequest,
  ReorderSeriesRequest,
  Serie,
  Shot,
} from '../utils-models/series-and-shots.model';
import type { UpdateShotRequest } from '../utils-models/update-shot-request.model';
import type { UpsertTrialSerieRequest } from '../utils-models/upsert-trial-serie-info.model';
import { PlanningGeneralDataStore } from './planning-general-data.store';

interface SeriesAndShotsState {
  isInitialized: boolean;
}

const initialState: SeriesAndShotsState = {
  isInitialized: false,
};

export const SeriesAndShotsStore = signalStore(
  withState(initialState),

  withComputed(
    (store, seriesService = inject(SeriesAndShotsService), planningStore = inject(PlanningGeneralDataStore)) => ({
      fireTrialId: computed(() => planningStore.fireTrialId()),

      series: computed<Serie[] | undefined>(() => {
        const response = seriesService.seriesAndShotsResource.value();
        if (!response) return undefined;

        return response.map((serie: any, idx: number) => ({
          id: serie.id,
          name: serie.name,
          shotQuantity: serie.shots?.length ?? 0,
          executionOrder: serie.executionOrder ?? serie.order ?? idx + 1,
          observations: serie.observations,
          shots: (serie.shots || []).map((shot: Shot, sidx: number) => ({
            id: shot.id,
            globalNumber: shot.globalNumber ?? sidx + 1,
            observation: shot.observation || '',
          })),
        }));
      }),

      isLoadingSeries: computed(() => seriesService.seriesAndShotsResource.isLoading()),
      seriesError: computed(() => seriesService.seriesAndShotsResource.error()),

      addSerieStatus: computed(() => seriesService.addNewSerieResource.status()),
      isAddingSerie: computed(() => seriesService.addNewSerieResource.isLoading()),

      updateSerieStatus: computed(() => seriesService.updateSerieResource.status()),
      isUpdatingSerie: computed(() => seriesService.updateSerieResource.isLoading()),

      deleteSerieStatus: computed(() => seriesService.deleteSerieResource.status()),
      isDeletingSerie: computed(() => seriesService.deleteSerieResource.isLoading()),

      addShotStatus: computed(() => seriesService.addShotToSerieResource.status()),
      isAddingShot: computed(() => seriesService.addShotToSerieResource.isLoading()),

      deleteShotStatus: computed(() => seriesService.deleteShotFromSerieResource.status()),
      isDeletingShot: computed(() => seriesService.deleteShotFromSerieResource.isLoading()),

      reorderSeriesStatus: computed(() => seriesService.reorderSeriesResource.status()),

      updateShotStatus: computed(() => seriesService.updateShotResource.status()),
      isUpdatingShot: computed(() => seriesService.updateShotResource.isLoading()),

      isLoading: computed(() => seriesService.seriesAndShotsResource.isLoading()),
    }),
  ),

  withMethods(
    (store, seriesService = inject(SeriesAndShotsService), planningStore = inject(PlanningGeneralDataStore)) => ({
      loadSeries(): void {
        const id = planningStore.fireTrialId();
        if (id) {
          seriesService.getSeriesAndShots(id);
          patchState(store, { isInitialized: true });
        }
      },

      reloadSeries(): void {
        seriesService.seriesAndShotsResource.reload();
      },

      addSerie(request: AddNewSerieRequest): void {
        seriesService.addNewSerie(request);
      },

      updateSerie(request: UpsertTrialSerieRequest): void {
        seriesService.updateSerie(request);
      },

      deleteSerie(serieId: string): void {
        seriesService.deleteSerie(serieId);
      },

      reorderSeries(request: ReorderSeriesRequest): void {
        seriesService.reorderSeries(request);
      },

      resetAddSerie(): void {
        seriesService.resetAddNewSerie();
      },

      resetUpdateSerie(): void {
        seriesService.resetUpdateSerie();
      },

      addShotToSerie(request: AddShotToSerieRequest): void {
        seriesService.addShotToSerie(request);
      },

      deleteShot(shotId: string): void {
        seriesService.deleteShot(shotId);
      },

      updateShot(request: UpdateShotRequest): void {
        seriesService.updateShot(request);
      },

      reset(): void {
        patchState(store, initialState);
      },
    }),
  ),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type SeriesAndShotsStoreType = InstanceType<typeof SeriesAndShotsStore>;
