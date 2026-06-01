import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MovementListSearch } from '../models/movements.model';
import { MunitionsDumpsService } from '../services/munitions-dumps.service';
import { MunitionsStockCertificatesService } from '../services/munitions-stock-certificates.service';

interface MunitionsStockCertificatesStoreState {
  isInitialized: boolean;
  currentSearch: MovementListSearch;
}

const initialState: MunitionsStockCertificatesStoreState = {
  isInitialized: false,
  currentSearch: {},
};

export const MunitionsStockCertificatesStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionsStockCertificatesService)) => ({
    items: computed(() => {
      const response = service.response.value();
      return response?.items ?? [];
    }),

    totalElements: computed(() => {
      const response = service.response.value();
      return response?.totalElements ?? 0;
    }),

    isLoading: computed(() => service.response.isLoading()),

    error: computed(() => service.response.error()),

    hasError: computed(() => service.response.error() !== null),
  })),

  withMethods((store, service = inject(MunitionsStockCertificatesService)) => ({
    searchById(id: string): void {
      service.searchById(id);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },
    deleteItem(itemId: string, certId: string): void {
      service.deleteItem(itemId, certId);
    },
    reload(): void {
      service.response.reload();
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

export type MunitionsStockCertificatesStoreType = InstanceType<typeof MunitionsStockCertificatesStore>;
