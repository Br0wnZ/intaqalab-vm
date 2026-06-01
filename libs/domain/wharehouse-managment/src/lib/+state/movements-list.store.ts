import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MovementListSearch } from '../models/movements.model';
import { MovementsListService } from '../services/movements-list.service';
import { MunitionsDumpsService } from '../services/munitions-dumps.service';

interface MovementsListStoreState {
  isInitialized: boolean;
  currentSearch: MovementListSearch;
}

const initialState: MovementsListStoreState = {
  isInitialized: false,
  currentSearch: {},
};

export const MovementsListStore = signalStore(
  withState(initialState),

  withComputed(
    (store, service = inject(MovementsListService), munitionDumpsService = inject(MunitionsDumpsService)) => ({
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
    }),
  ),

  withMethods(
    (store, service = inject(MovementsListService), munitionDumpsService = inject(MunitionsDumpsService)) => ({
      search(params: MovementListSearch): void {
        service.searchItems.set(params);
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
    }),
  ),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type MovementsListStoreType = InstanceType<typeof MovementsListStore>;
