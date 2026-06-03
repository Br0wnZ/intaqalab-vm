import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MunitionComponentsModel } from '../models/munition-components.model';
import { MunitionComponentService } from '../services/munition-component.service';

interface MunitionComponentStoreState {
  isInitialized: boolean;
}

const initialState: MunitionComponentStoreState = {
  isInitialized: false,
};

export const MunitionComponentStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionComponentService)) => ({
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

  withMethods((store, service = inject(MunitionComponentService)) => ({
    search(params: Record<string, unknown>): void {
      service.searchItems.set(params);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },

    toogleEnabledItem(item: MunitionComponentsModel, enabled: boolean): void {
      service.toogleEnabledItem(item, enabled);
    },

    createItem(record: Omit<MunitionComponentsModel, 'id' | 'active'>): void {
      service.createItem(record);
    },

    updateItem(record: MunitionComponentsModel): void {
      service.updateItem(record);
    },

    deleteItem(item: MunitionComponentsModel): void {
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

export type MunitionComponentStoreType = InstanceType<typeof MunitionComponentStore>;
