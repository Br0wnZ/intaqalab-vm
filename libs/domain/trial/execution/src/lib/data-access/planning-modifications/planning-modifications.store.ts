import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';

import type {
  ApplyChangeItem,
  ModificationClassification,
  PlanningChange,
  PlanningModification,
  PlanningModificationDraftItem,
  SubmitPlanningModificationsResponse,
} from './models/planning-modification.models';
import { PlanningModificationsService } from './planning-modifications.service';

export interface PlanningModificationsState {
  fireTrialId: string | null;
  centerId: string | undefined;
  modifications: PlanningModification[];
  changesOverrides: Record<string, { requiresApproval: boolean; requestClient: boolean }>;
  hasPendingModifications: boolean;
  validationErrors: string[];
  isSaving: boolean;
  isValidating: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: PlanningModificationsState = {
  fireTrialId: null,
  centerId: undefined,
  modifications: [],
  changesOverrides: {},
  hasPendingModifications: false,
  validationErrors: [],
  isSaving: false,
  isValidating: false,
  isLoading: false,
  error: null,
};

function toDraftItem(mod: PlanningModification): PlanningModificationDraftItem {
  return {
    id: mod.id,
    parameter: mod.parameter,
    action: mod.action,
    previousValue: mod.previousValue,
    newValue: mod.newValue,
    affectedShots: mod.affectedShots,
    classification: mod.classification,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const PlanningModificationsStore = signalStore(
  withState(initialState),
  withProps(() => ({
    _service: inject(PlanningModificationsService),
  })),
  withComputed((store) => {
    const effectiveChanges = computed(() => {
      const rawChanges = store._service.changesResource?.value?.() ?? [];
      const overrides = store.changesOverrides();
      return rawChanges.map((c) => {
        const override = overrides[c.id];
        if (override) {
          return {
            ...c,
            requiresApproval: override.requiresApproval,
            requestClient: override.requestClient,
          };
        }
        return c;
      });
    });

    const draftChanges = computed(() => effectiveChanges().filter((c) => c.status === 'DRAFT'));

    const draftModifications = computed(() => store.modifications().filter((m) => m.status === 'BORRADOR'));
    const pendingModifications = computed(() => store.modifications().filter((m) => m.status === 'PENDIENTE'));
    const acceptedModifications = computed(() => store.modifications().filter((m) => m.status === 'ACEPTADO'));
    const rejectedModifications = computed(() => store.modifications().filter((m) => m.status === 'RECHAZADO'));

    const canSave = computed(
      () =>
        store.validationErrors().length === 0 &&
        (draftModifications().length > 0 || draftChanges().length > 0) &&
        !store.isSaving() &&
        !store.isValidating(),
    );

    return {
      effectiveChanges,
      draftChanges,
      draftModifications,
      pendingModifications,
      acceptedModifications,
      rejectedModifications,
      canSave,
    };
  }),
  withComputed((store) => ({
    changes: computed(() => store.effectiveChanges()),
    isLoadingChanges: computed(() => store._service.changesResource.isLoading()),
    changesError: computed(() => store._service.changesResource.error() ?? null),
  })),
  withMethods((store) => ({
    setValidationErrors(errors: string[]): void {
      patchState(store, { validationErrors: [...errors] });
    },

    addModification(mod: PlanningModification): void {
      const current = store.modifications();
      const matchIndex = current.findIndex((existing) => (mod.key ? existing.key === mod.key : existing.id === mod.id));

      const updated =
        matchIndex >= 0
          ? current.map((existing, index) => (index === matchIndex ? { ...existing, ...mod } : existing))
          : [...current, mod];

      patchState(store, {
        modifications: updated,
        hasPendingModifications: updated.some((m) => m.status === 'PENDIENTE'),
      });
    },

    removeModificationByKey(key: string): void {
      const updated = store.modifications().filter((m) => m.key !== key && m.id !== key);
      patchState(store, {
        modifications: updated,
        hasPendingModifications: updated.some((m) => m.status === 'PENDIENTE'),
      });
    },

    updateClassification(modId: string, classification: ModificationClassification): void {
      const updated = store.modifications().map((m) => (m.id === modId ? { ...m, classification } : m));
      const isAcepta = classification === 'acepta';
      const isSolicita = classification === 'solicita';
      const updatedOverrides = {
        ...store.changesOverrides(),
        [modId]: {
          requiresApproval: isAcepta,
          requestClient: isSolicita,
        },
      };
      patchState(store, {
        modifications: updated,
        changesOverrides: updatedOverrides,
      });
    },

    async validateAndSave(
      validator?: () => Promise<string[]> | string[],
    ): Promise<SubmitPlanningModificationsResponse | null> {
      const fireTrialId = store.fireTrialId();
      const drafts = store.draftModifications();
      const draftChangesToApply = store.draftChanges();
      if (!fireTrialId || (drafts.length === 0 && draftChangesToApply.length === 0)) {
        return null;
      }

      if (validator) {
        patchState(store, { isValidating: true, error: null });
        try {
          const errors = await validator();
          patchState(store, { validationErrors: [...errors], isValidating: false });
          if (errors.length > 0) {
            return null;
          }
        } catch (error) {
          patchState(store, {
            isValidating: false,
            error: getErrorMessage(error, 'Validation failed'),
          });
          return null;
        }
      }

      if (store.validationErrors().length > 0) {
        return null;
      }

      patchState(store, { isSaving: true, error: null });
      try {
        let acceptedCount = 0;
        let pendingCount = 0;
        let allModifications = [...store.modifications()];

        // 1. Apply draft changes via POST .../planning/changes/apply
        if (draftChangesToApply.length > 0) {
          const applyItems: ApplyChangeItem[] = draftChangesToApply.map((c) => ({
            id: c.id,
            requiresApproval: Boolean(c.requiresApproval && !c.requestClient),
            requestClient: Boolean(c.requestClient && !c.requiresApproval),
          }));

          const appliedChanges = await store._service.applyChanges(
            fireTrialId,
            { changes: applyItems },
            store.centerId(),
          );

          acceptedCount += appliedChanges.filter((c) => c.status === 'ACCEPTED').length;
          pendingCount += appliedChanges.filter((c) => c.status === 'PENDING').length;
          store._service.reloadChanges();
        }

        // 2. Submit local draft modifications if any
        if (drafts.length > 0) {
          const draftItems = drafts.map(toDraftItem);
          const savedDrafts = await store._service.saveDraft(
            fireTrialId,
            { modifications: draftItems },
            store.centerId(),
          );
          const submitItems = savedDrafts.length > 0 ? savedDrafts.map(toDraftItem) : draftItems;
          const response = await store._service.submitModifications(
            fireTrialId,
            { modifications: submitItems },
            store.centerId(),
          );

          acceptedCount += response.acceptedCount;
          pendingCount += response.pendingCount;

          const nonDrafts = store.modifications().filter((m) => m.status !== 'BORRADOR');
          const submittedIds = new Set(response.modifications.map((m) => m.id));
          allModifications = [...nonDrafts.filter((m) => !submittedIds.has(m.id)), ...response.modifications];
        }

        patchState(store, {
          modifications: allModifications,
          changesOverrides: {},
          hasPendingModifications: pendingCount > 0 || allModifications.some((m) => m.status === 'PENDIENTE'),
          isSaving: false,
        });

        return {
          modifications: allModifications,
          acceptedCount,
          pendingCount,
        };
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: getErrorMessage(error, 'Failed to submit planning modifications'),
        });
        return null;
      }
    },

    async loadModifications(fireTrialId: string, centerId?: string): Promise<PlanningModification[]> {
      patchState(store, {
        fireTrialId,
        centerId,
        isLoading: true,
        error: null,
      });

      try {
        const items = await store._service.fetchModifications(fireTrialId, centerId);
        patchState(store, {
          modifications: items,
          hasPendingModifications: items.some((m) => m.status === 'PENDIENTE'),
          isLoading: false,
        });
        return items;
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: getErrorMessage(error, 'Failed to load planning modifications'),
        });
        return [];
      }
    },

    async checkHasPendingModifications(fireTrialId: string, centerId?: string): Promise<boolean> {
      patchState(store, {
        fireTrialId,
        centerId,
        isLoading: true,
        error: null,
      });

      try {
        const items = await store._service.fetchModifications(fireTrialId, centerId);
        const hasPending = items.some((m) => m.status === 'PENDIENTE');
        patchState(store, {
          modifications: items,
          hasPendingModifications: hasPending,
          isLoading: false,
        });
        return hasPending;
      } catch (error) {
        patchState(store, {
          isLoading: false,
          error: getErrorMessage(error, 'Failed to check pending modifications'),
        });
        return false;
      }
    },

    async approveModification(
      modId: string,
      comment?: string,
      fireTrialIdOverride?: string,
      centerIdOverride?: string,
    ): Promise<PlanningModification | null> {
      const fireTrialId = fireTrialIdOverride ?? store.fireTrialId();
      if (!fireTrialId) {
        return null;
      }

      patchState(store, { isSaving: true, error: null });
      try {
        const updatedMod = await store._service.approveModification(
          fireTrialId,
          modId,
          comment !== undefined ? { comment } : undefined,
          centerIdOverride ?? store.centerId(),
        );

        const updatedList = store.modifications().map((m) => (m.id === modId ? updatedMod : m));
        patchState(store, {
          modifications: updatedList,
          hasPendingModifications: updatedList.some((m) => m.status === 'PENDIENTE'),
          isSaving: false,
        });
        return updatedMod;
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: getErrorMessage(error, 'Failed to approve modification'),
        });
        return null;
      }
    },

    async rejectModification(
      modId: string,
      comment?: string,
      fireTrialIdOverride?: string,
      centerIdOverride?: string,
    ): Promise<PlanningModification | null> {
      const fireTrialId = fireTrialIdOverride ?? store.fireTrialId();
      if (!fireTrialId) {
        return null;
      }

      patchState(store, { isSaving: true, error: null });
      try {
        const updatedMod = await store._service.rejectModification(
          fireTrialId,
          modId,
          comment !== undefined ? { comment } : undefined,
          centerIdOverride ?? store.centerId(),
        );

        const updatedList = store.modifications().map((m) => (m.id === modId ? updatedMod : m));
        patchState(store, {
          modifications: updatedList,
          hasPendingModifications: updatedList.some((m) => m.status === 'PENDIENTE'),
          isSaving: false,
        });
        return updatedMod;
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: getErrorMessage(error, 'Failed to reject modification'),
        });
        return null;
      }
    },

    async applyChanges(applyItems?: ApplyChangeItem[]): Promise<PlanningChange[] | null> {
      const fireTrialId = store.fireTrialId();
      if (!fireTrialId) {
        return null;
      }

      patchState(store, { isSaving: true, error: null });
      try {
        const itemsToApply: ApplyChangeItem[] =
          applyItems ??
          store.draftChanges().map((c) => ({
            id: c.id,
            requiresApproval: Boolean(c.requiresApproval && !c.requestClient),
            requestClient: Boolean(c.requestClient && !c.requiresApproval),
          }));

        const applied = await store._service.applyChanges(fireTrialId, { changes: itemsToApply }, store.centerId());

        store._service.reloadChanges();

        patchState(store, {
          isSaving: false,
          changesOverrides: {},
          hasPendingModifications: applied.some((c) => c.status === 'PENDING'),
        });

        return applied;
      } catch (error) {
        patchState(store, {
          isSaving: false,
          error: getErrorMessage(error, 'Failed to apply planning changes'),
        });
        return null;
      }
    },

    loadChanges(fireTrialId: string, centerId?: string): void {
      patchState(store, { fireTrialId, centerId });
      store._service.loadChanges(fireTrialId, centerId);
    },

    reloadChanges(): void {
      store._service.reloadChanges();
    },

    reset(): void {
      patchState(store, { ...initialState });
    },
  })),
);
