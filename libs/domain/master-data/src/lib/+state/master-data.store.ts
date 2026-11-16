import { computed, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from '@ngrx/signals';

import type { MasterDataCreateItemType, MasterDataResponseType } from '../models/utils.model';
import type { MasterDataSearchRequest } from '../services/master-data.service';
import { MasterDataService } from '../services/master-data.service';

interface MasterDataStoreState {
  isInitialized: boolean;
}

const initialState: MasterDataStoreState = {
  isInitialized: false,
};

export const MasterDataStore = signalStore(
  withState(initialState),

  withProps(() => ({
    _service: inject(MasterDataService),
  })),

  withComputed((store) => ({
    items: computed(() => {
      const response = safeResourceValue(store._service.paginatedResponse);
      return response?.items ?? [];
    }),

    totalElements: computed(() => {
      const response = safeResourceValue(store._service.paginatedResponse);
      return response?.totalElements ?? 0;
    }),

    isLoading: computed(() => store._service.paginatedResponse.isLoading()),

    error: computed(() => store._service.paginatedResponse.error()),

    hasError: computed(
      () => store._service.paginatedResponse.status() === 'error' && store._service.paginatedResponse.error() !== null,
    ),

    saveStatus: computed(() => store._service.saveResource.status()),
    isSaving: computed(() => store._service.saveResource.isLoading()),

    updateStatus: computed(() => store._service.updateResource.status()),
    isUpdating: computed(() => store._service.updateResource.isLoading()),

    deleteStatus: computed(() => store._service.deleteById.status()),
    isDeleting: computed(() => store._service.deleteById.isLoading()),

    isMutating: computed(
      () =>
        store._service.saveResource.isLoading() ||
        store._service.updateResource.isLoading() ||
        store._service.deleteById.isLoading(),
    ),
  })),

  withMethods((store) => ({
    search(params: MasterDataSearchRequest): void {
      store._service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    create(record: MasterDataCreateItemType<MasterDataResponseType>): void {
      store._service.create(record);
    },

    update(record: MasterDataResponseType): void {
      store._service.update(record);
    },

    delete(id: string | number): void {
      store._service.delete(id);
    },

    resetUpsert(): void {
      store._service.resetUpsert();
    },

    resetSwitchStatus(): void {
      store._service.resetSwitchStatus();
    },

    resetDelete(): void {
      store._service.resetDelete();
    },

    resetAll(): void {
      store._service.resetUpsert();
      store._service.resetDelete();
      patchState(store, initialState);
    },

    reload(): void {
      store._service.paginatedResponse.reload();
    },
  })),

  withHooks({
    onDestroy(store) {
      store.resetAll();
    },
  }),
);

export type MasterDataStoreType = InstanceType<typeof MasterDataStore>;
