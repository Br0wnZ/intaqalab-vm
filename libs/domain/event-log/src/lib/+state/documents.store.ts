import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { DocumentsService } from '../services/documents/documents.service';
import type { EventLogDocumentsSearch } from '../utils-models/documents.model';

interface DocumentsStoreState {
  isInitialized: boolean;
}

const initialState: DocumentsStoreState = {
  isInitialized: false,
};

export const EventLogDocumentsStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(DocumentsService)) => ({
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

  withMethods((store, service = inject(DocumentsService)) => ({
    search(params: { page: number; pageSize: number; sortField?: string; sortDirection?: 'asc' | 'desc' | '' }): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    searchWithFilters(documentSearch: EventLogDocumentsSearch) {
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

export type EventLogDocumentsStoreType = InstanceType<typeof EventLogDocumentsStore>;
