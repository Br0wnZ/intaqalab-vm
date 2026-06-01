import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { MeasuresService } from '../services/measures/measures.service';
import type { EventLogMeasuresSearch } from '../utils-models/measures.model';

interface MeasuresStoreState {
  isInitialized: boolean;
}

const initialState: MeasuresStoreState = {
  isInitialized: false,
};

export const EventLogMeasuresStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MeasuresService)) => ({
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

  withMethods((store, service = inject(MeasuresService)) => ({
    search(params: { page: number; pageSize: number; sortField?: string; sortDirection?: 'asc' | 'desc' | '' }): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    searchWithFilters(documentSearch: EventLogMeasuresSearch) {
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

export type EventLogMeasuresStoreType = InstanceType<typeof EventLogMeasuresStore>;
