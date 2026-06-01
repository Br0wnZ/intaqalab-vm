import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MasterDataCreateItemType, MasterDataResponseType } from '../models/utils.model';
import { MasterDataService } from '../services/master-data.service';

interface MasterDataStoreState {
  isInitialized: boolean;
}

const initialState: MasterDataStoreState = {
  isInitialized: false,
};

export const MasterDataStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MasterDataService)) => ({
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

    deleteStatus: computed(() => service.deleteById.status()),
    isDeleting: computed(() => service.deleteById.isLoading()),

    isMutating: computed(
      () => service.saveResource.isLoading() || service.updateResource.isLoading() || service.deleteById.isLoading(),
    ),
  })),

  withMethods((store, service = inject(MasterDataService)) => ({
    search(params: { page: number; pageSize: number; sortField?: string; sortDirection?: 'asc' | 'desc' | '' }): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    createItem(record: MasterDataCreateItemType<MasterDataResponseType>): void {
      service.create(record);
    },

    updateItem(record: MasterDataResponseType): void {
      service.updateItem(record);
    },

    deleteItem(id: string | number): void {
      service.deleteItem(id);
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

export type MasterDataStoreType = InstanceType<typeof MasterDataStore>;
