import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type {
  DenominationModel,
  DenominationUpSertModel,
  SearchDenominationsPaginatedSortedRequest,
} from '../models/denominations.model';
import { DenominationsService } from '../services/denominations.service';

interface DenominationsStoreState {
  isInitialized: boolean;
}

const initialState: DenominationsStoreState = {
  isInitialized: false,
};

export const DenominationsStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(DenominationsService)) => ({
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

    saveStatus: computed(() => service.saveResource.status()),
    isSaving: computed(() => service.saveResource.isLoading()),

    updateStatus: computed(() => service.updateResource.status()),
    isUpdating: computed(() => service.updateResource.isLoading()),

    deleteStatus: computed(() => service.deleteResource.status()),
    isDeleting: computed(() => service.deleteResource.isLoading()),

    isMutating: computed(
      () =>
        service.saveResource.isLoading() || service.updateResource.isLoading() || service.deleteResource.isLoading(),
    ),
  })),

  withMethods((store, service = inject(DenominationsService)) => ({
    search(params: SearchDenominationsPaginatedSortedRequest): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    toogleEnabledItem(item: DenominationUpSertModel): void {
      service.toogleEnabledItem(item);
    },

    createItem(record: DenominationUpSertModel): void {
      service.createItem(record);
    },

    updateItem(record: DenominationModel): void {
      service.updateItem(record);
    },

    deleteItem(item: DenominationModel): void {
      service.deleteItem(item);
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

export type DenominationsStoreType = InstanceType<typeof DenominationsStore>;
