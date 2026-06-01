import { httpResource } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import type {
  FireTrial,
  PaginatedApiResponse,
  PaginatedSortedViewRequest,
  TrialSearchFilters,
} from '@intaqalab/models';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { DataTrialCreateModifyService } from '../../../services/data-trial-create-modify-service';

type TrialListFilters = Partial<TrialSearchFilters & PaginatedSortedViewRequest>;

interface TrialState {
  currentSearch: TrialListFilters;
  emptyList: boolean;
}

const initialState: TrialState = {
  currentSearch: {
    pageSize: 10,
    page: 1,
    sortField: 'createdAt',
    sortDirection: 'desc',
  },
  emptyList: false,
};

export const TrialStore = signalStore(
  withState(initialState),

  withComputed((store, dataService = inject(DataTrialCreateModifyService)) => {
    const searchParams = computed(() => (store.emptyList() ? null : store.currentSearch()));

    const trialsResource = httpResource<PaginatedApiResponse<FireTrial>>(dataService.getTrialsList(searchParams));

    return {
      trialsResource: computed(() => trialsResource),
      items: computed(() => {
        if (store.emptyList()) return [];
        return trialsResource.value()?.items ?? [];
      }),
      totalElements: computed(() => trialsResource.value()?.totalElements ?? 0),
      isLoading: computed(() => trialsResource.isLoading()),
      error: computed(() => (trialsResource.error() ? 'Error al cargar los trials' : null)),
    };
  }),

  withMethods((store) => ({
    search(filters: TrialListFilters): void {
      const current = store.currentSearch();
      patchState(store, {
        currentSearch: {
          sortField: current.sortField,
          sortDirection: current.sortDirection,
          ...filters,
          page: 1,
          pageSize: current.pageSize,
        },
      });
    },

    setPagination(pageIndex: number, pageSize: number): void {
      const current = store.currentSearch();
      patchState(store, { currentSearch: { ...current, page: pageIndex + 1, pageSize } });
    },

    setSort(sortField: string, sortDirection: string): void {
      const current = store.currentSearch();
      patchState(store, { currentSearch: { ...current, sortField, sortDirection, page: 1 } });
    },

    setSearch(search: string): void {
      const current = store.currentSearch();
      patchState(store, { currentSearch: { ...current, description: search, page: 1 } });
    },
  })),
);
