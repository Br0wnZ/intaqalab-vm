import { httpResource } from '@angular/common/http';
import { computed, inject, linkedSignal } from '@angular/core';
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

function cleanFilters(filters: TrialListFilters): TrialListFilters {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return cleaned as TrialListFilters;
}

export const TrialStore = signalStore(
  withState(initialState),

  withComputed((store, dataService = inject(DataTrialCreateModifyService)) => {
    const searchParams = computed(() => (store.emptyList() ? null : store.currentSearch()));

    const trialsResource = httpResource<PaginatedApiResponse<FireTrial>>(dataService.getTrialsList(searchParams));

    const lastValidResponse = linkedSignal<
      PaginatedApiResponse<FireTrial> | undefined,
      PaginatedApiResponse<FireTrial> | null
    >({
      source: () => trialsResource.value(),
      computation: (newVal, prev) => newVal ?? prev?.value ?? null,
    });

    return {
      trialsResource: computed(() => trialsResource),
      items: computed(() => {
        if (store.emptyList()) return [];
        return (trialsResource.value() ?? lastValidResponse())?.items ?? [];
      }),
      totalElements: computed(() => (trialsResource.value() ?? lastValidResponse())?.totalElements ?? 0),
      isLoading: computed(() => trialsResource.isLoading()),
      error: computed(() => (trialsResource.error() ? 'Error al cargar los trials' : null)),
    };
  }),

  withMethods((store) => ({
    search(filters: TrialListFilters): void {
      const current = store.currentSearch();
      const cleaned = cleanFilters(filters);
      const nextSearch: TrialListFilters = {
        ...cleaned,
        sortField: current.sortField,
        sortDirection: current.sortDirection,
        page: 1,
        pageSize: current.pageSize,
      };
      if (JSON.stringify(cleanFilters(current)) === JSON.stringify(cleanFilters(nextSearch))) {
        return;
      }
      patchState(store, { currentSearch: nextSearch });
    },

    setPagination(pageIndex: number, pageSize: number): void {
      const current = store.currentSearch();
      if (current.page === pageIndex + 1 && current.pageSize === pageSize) {
        return;
      }
      patchState(store, { currentSearch: { ...current, page: pageIndex + 1, pageSize } });
    },

    setSort(sortField: string, sortDirection: string): void {
      const current = store.currentSearch();
      if (current.sortField === sortField && current.sortDirection === sortDirection) {
        return;
      }
      patchState(store, { currentSearch: { ...current, sortField, sortDirection, page: 1 } });
    },

    setSearch(search: string): void {
      const current = store.currentSearch();
      if (current.description === search) {
        return;
      }
      patchState(store, { currentSearch: { ...current, description: search, page: 1 } });
    },
  })),
);
