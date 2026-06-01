import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { SeriesAndShootsService } from '../services/series-and-shoots/series-and-shoots.service';
import type { EventLogSeriesAndShootsSearch } from '../utils-models/series-and-shoots.model';

interface SeriesAndShootsStoreState {
  isInitialized: boolean;
}

const initialState: SeriesAndShootsStoreState = {
  isInitialized: false,
};

export const EventLogSeriesAndShootsStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(SeriesAndShootsService)) => ({
    items: computed(() => {
      const response = service.paginatedResponse.value();
      return response?.items ?? [];
    }),

    totalElements: computed(() => {
      const response = service.paginatedResponse.value();
      return response?.totalElements ?? 0;
    }),

    isLoading: computed(() => service.paginatedResponse.isLoading()),

    error: computed(() => service.paginatedResponse.error()),

    hasError: computed(() => service.paginatedResponse.error() !== null),
  })),

  withMethods((store, service = inject(SeriesAndShootsService)) => ({
    search(params: { page: number; pageSize: number; sortField?: string; sortDirection?: 'asc' | 'desc' | '' }): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    searchWithFilters(documentSearch: EventLogSeriesAndShootsSearch) {
      service.filtersItems.set(documentSearch);
    },

    reload(): void {
      service.paginatedResponse.reload();
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type EventLogSeriesAndShootsStoreType = InstanceType<typeof EventLogSeriesAndShootsStore>;
