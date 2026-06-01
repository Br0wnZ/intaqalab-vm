import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { StanagService } from '../services/stanag-service';
import type { StanagCriterionItem, StanagCriterionRequest } from '../utils-models/stanag.model';

export type { StanagCriterionItem, StanagCriterionRequest };

interface StanagState {
  isInitialized: boolean;
}

const initialState: StanagState = {
  isInitialized: false,
};

export const StanagStore = signalStore(
  withState(initialState),

  withComputed((store, stanagService = inject(StanagService)) => ({
    stanagCriteria: computed<StanagCriterionItem[]>(() => {
      const response = stanagService.listResource.value();
      return response?.items ?? [];
    }),

    stanagPagination: computed(() => {
      const response = stanagService.listResource.value();
      if (!response) return null;
      return {
        page: response.page,
        pageSize: response.pageSize,
        totalElements: response.totalElements,
      };
    }),

    isLoadingList: computed(() => stanagService.listResource.isLoading()),

    selectedCriterion: computed(() => stanagService.getResource.value()),

    isCreating: computed(() => stanagService.createResource.isLoading()),
    createStatus: computed(() => stanagService.createResource.status()),

    isUpdating: computed(() => stanagService.updateResource.isLoading()),
    updateStatus: computed(() => stanagService.updateResource.status()),

    isDeleting: computed(() => stanagService.deleteResource.isLoading()),
    deleteStatus: computed(() => stanagService.deleteResource.status()),

    isLoading: computed(
      () =>
        stanagService.listResource.isLoading() ||
        stanagService.getResource.isLoading() ||
        stanagService.createResource.isLoading() ||
        stanagService.updateResource.isLoading() ||
        stanagService.deleteResource.isLoading(),
    ),
  })),

  withMethods((store, stanagService = inject(StanagService)) => ({
    loadCriteria(page?: number, pageSize?: number): void {
      stanagService.list(page, pageSize);
      patchState(store, { isInitialized: true });
    },

    getCriterion(id: string): void {
      stanagService.get(id);
    },

    createCriterion(body: StanagCriterionRequest): void {
      stanagService.create(body);
    },

    updateCriterion(id: string, body: StanagCriterionRequest): void {
      stanagService.update(id, body);
    },

    deleteCriterion(id: string): void {
      stanagService.remove(id);
    },

    resetCreate(): void {
      stanagService.resetCreate();
    },

    resetUpdate(): void {
      stanagService.resetUpdate();
    },

    resetDelete(): void {
      stanagService.resetDelete();
    },

    reset(): void {
      stanagService.resetCreate();
      stanagService.resetUpdate();
      stanagService.resetDelete();
      patchState(store, initialState);
    },
  })),
);
