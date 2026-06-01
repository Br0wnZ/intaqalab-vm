import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { GeneralDataService } from '../services/general-data/general-data.service';
import type { EventLogGeneralDataSearch } from '../utils-models/general-data.model';

interface GeneralDataStoreState {
  isInitialized: boolean;
}

const initialState: GeneralDataStoreState = {
  isInitialized: false,
};

export const EventLogGeneralDataStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(GeneralDataService)) => ({
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

  withMethods((store, service = inject(GeneralDataService)) => ({
    search(params: { page: number; pageSize: number; sortField?: string; sortDirection?: 'asc' | 'desc' | '' }): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    searchWithFilters(documentSearch: EventLogGeneralDataSearch) {
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

export type EventLogGeneralDataStoreType = InstanceType<typeof EventLogGeneralDataStore>;
