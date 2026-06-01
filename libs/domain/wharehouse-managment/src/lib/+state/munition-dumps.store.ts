import { computed, inject } from '@angular/core';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MunitionsDumpModel } from '../models/munitions-dumps.model';
import { MunitionsDumpsService } from '../services/munitions-dumps.service';

interface MunitionsDumpsStoreState {
  isInitialized: boolean;
}

const initialState: MunitionsDumpsStoreState = {
  isInitialized: false,
};

export const MunitionsDumpsStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionsDumpsService)) => ({
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

  withMethods((store, service = inject(MunitionsDumpsService)) => ({
    search(params: Record<string, unknown>): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    toogleEnabledItem(item: MunitionsDumpModel, enabled: boolean): void {
      service.toogleEnabledItem(item, enabled);
    },

    createItem(record: Omit<MunitionsDumpModel, 'id' | 'enabled'>): void {
      service.createItem(record);
    },

    updateItem(record: MunitionsDumpModel): void {
      service.updateItem(record);
    },

    deleteItem(item: MunitionsDumpModel): void {
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

export type MunitionsDumpsStoreType = InstanceType<typeof MunitionsDumpsStore>;
