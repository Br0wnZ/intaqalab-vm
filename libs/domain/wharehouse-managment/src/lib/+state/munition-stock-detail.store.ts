import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MovementListSearch } from '../models/movements.model';
import type { UpdateAssociatedComponentsPayload } from '../services/munitions-stock-detail.service';
import { MunitionsStockDetailService } from '../services/munitions-stock-detail.service';

interface MunitionsStockDetailStoreState {
  isInitialized: boolean;
  currentSearch: MovementListSearch;
}

const initialState: MunitionsStockDetailStoreState = {
  isInitialized: false,
  currentSearch: {},
};

export const MunitionsStockDetailStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionsStockDetailService)) => ({
    item: computed(() => {
      const response = service.response.value();
      return response;
    }),

    isLoading: computed(() => service.response.isLoading()),

    error: computed(() => service.response.error()),

    hasError: computed(() => service.response.error() !== null),
  })),

  withMethods((store, service = inject(MunitionsStockDetailService)) => ({
    searchById(id: string, entity?: string): void {
      service.searchById(id, entity);
      if (!store.isInitialized()) {
        patchState(store, { isInitialized: true });
      }
    },
    updateAssociatedComponents(dataToSend: UpdateAssociatedComponentsPayload): void {
      service.updateAssociatedComponents(dataToSend);
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

export type MunitionsStockDetailStoreType = InstanceType<typeof MunitionsStockDetailStore>;
