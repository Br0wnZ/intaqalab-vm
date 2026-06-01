import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MunitionStockListSearch } from '../models/munition-stock-list.model';
import { MunitionsStockListService } from '../services/munitions-stock-list.service';

interface StockListStoreState {
  isInitialized: boolean;
}

const initialState: StockListStoreState = {
  isInitialized: false,
};

export const StockListStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionsStockListService)) => ({
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

  withMethods((store, service = inject(MunitionsStockListService)) => ({
    search(criteria: MunitionStockListSearch): void {
      service.searchItems.set(criteria);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
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

export type StockListStoreType = InstanceType<typeof StockListStore>;
