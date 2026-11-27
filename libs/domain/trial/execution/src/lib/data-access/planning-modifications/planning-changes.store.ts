import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';

import type {
  ApplyPlanningChange,
  PlanningChange,
  PlanningChangeRow,
  PlanningChangeSection,
  PlanningChangesSaveResult,
  PlanningDetectedChange,
} from '../../execution/models/planning-changes.models';
import { toApplyPlanningChangesRequest, toCreatePlanningChangesRequest } from './planning-changes.mapper';
import { PlanningChangesService } from './planning-changes.service';

type SavePhase = 'idle' | 'creating' | 'applying' | 'recovery-required';

interface PlanningChangesState {
  fireTrialId: string | null;
  sectionChanges: Partial<Record<PlanningChangeSection, PlanningDetectedChange[]>>;
  hydratedSections: PlanningChangeSection[];
  invalidSections: PlanningChangeSection[];
  createdChanges: PlanningChange[];
  createdLocalChanges: PlanningDetectedChange[];
  createdRemoteChanges: ApplyPlanningChange[];
  selectedRemoteChangeIds: string[];
  remoteChangeOverrides: Record<string, { requiresApproval: boolean; requestClient: boolean }>;
  processedChanges: PlanningChange[];
  isSaving: boolean;
  error: string | null;
  savePhase: SavePhase;
}

const initialState: PlanningChangesState = {
  fireTrialId: null,
  sectionChanges: {},
  hydratedSections: [],
  invalidSections: [],
  createdChanges: [],
  createdLocalChanges: [],
  createdRemoteChanges: [],
  selectedRemoteChangeIds: [],
  remoteChangeOverrides: {},
  processedChanges: [],
  isSaving: false,
  error: null,
  savePhase: 'idle',
};

const REQUIRED_PLANNING_SECTIONS: ReadonlyArray<PlanningChangeSection> = [
  'general-data',
  'series-and-shots',
  'shooting-conditions',
  'munitions',
  'armament',
  'measures',
];

function errorMessage(): string {
  return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_ERROR';
}

function identity(resourceType: string, resourceId: string, field: string): string {
  return `${resourceType}:${resourceId}:${field}`;
}

function sectionForResource(resourceType: PlanningChange['resourceType']): PlanningChangeSection {
  switch (resourceType) {
    case 'PLANNING_INFO':
      return 'general-data';
    case 'SHOT_CONDITIONS':
      return 'shooting-conditions';
    case 'MUNITION':
    case 'MUNITION_COMPONENT':
      return 'munitions';
    case 'ARMAMENT':
      return 'armament';
  }
}

export const PlanningChangesStore = signalStore(
  withState(initialState),
  withProps(() => ({ _service: inject(PlanningChangesService) })),
  withComputed((store) => {
    const localChanges = computed(() => Object.values(store.sectionChanges()).flatMap((changes) => changes ?? []));
    const remoteChanges = computed(() => store._service.resource.value() ?? []);
    const allRemoteChanges = computed(() => {
      const byId = new Map<string, PlanningChange>();
      for (const change of remoteChanges()) byId.set(change.id, change);
      for (const change of store.processedChanges()) byId.set(change.id, change);
      return [...byId.values()];
    });
    const remoteRows = computed<PlanningChangeRow[]>(() => {
      const selectedIds = new Set(store.selectedRemoteChangeIds());
      const overrides = store.remoteChangeOverrides();
      return allRemoteChanges().map((change) => ({
        ...change,
        ...(overrides[change.id] ?? {}),
        section: sectionForResource(change.resourceType),
        selectedForApply: selectedIds.has(change.id),
      }));
    });
    const selectedRemoteChanges = computed(() =>
      remoteRows().flatMap((change) =>
        change.status === 'DRAFT' && change.selectedForApply
          ? [{ id: change.id, requiresApproval: change.requiresApproval, requestClient: change.requestClient }]
          : [],
      ),
    );
    const isReady = computed(
      () =>
        store._service.resource.value() !== undefined &&
        !store._service.resource.isLoading() &&
        !store._service.resource.error() &&
        REQUIRED_PLANNING_SECTIONS.every((section) => store.hydratedSections().includes(section)),
    );
    const hasPendingChanges = computed(() => allRemoteChanges().some((change) => change.status === 'PENDING'));
    const hasUnpersistableChanges = computed(() => localChanges().some((change) => !change.persistable));
    const hasExecutedShotChanges = computed(() =>
      localChanges().some((change) => change.localOnlyReason === 'EXECUTED_SHOT'),
    );
    const hasUnsupportedChanges = computed(() =>
      localChanges().some((change) => !change.persistable && change.localOnlyReason !== 'EXECUTED_SHOT'),
    );
    const hasInvalidClassifications = computed(
      () =>
        localChanges().some((change) => change.requiresApproval && change.requestClient) ||
        selectedRemoteChanges().some((change) => change.requiresApproval && change.requestClient),
    );
    const hasUnsavedChanges = computed(() => localChanges().length > 0 || selectedRemoteChanges().length > 0);
    const hasDraftConflict = computed(() => {
      const remoteKeys = new Set(
        remoteChanges()
          .filter((change) => change.status === 'DRAFT')
          .map((change) => identity(change.resourceType, change.resourceId, change.field)),
      );
      return localChanges().some(
        (change) =>
          !!change.resourceType &&
          !!change.resourceId &&
          remoteKeys.has(identity(change.resourceType, change.resourceId, change.field)),
      );
    });
    const canEdit = computed(
      () =>
        store._service.resource.value() !== undefined &&
        !store._service.resource.isLoading() &&
        !store._service.resource.error() &&
        !hasPendingChanges() &&
        store.savePhase() === 'idle' &&
        !store.isSaving(),
    );
    const canSave = computed(
      () =>
        (localChanges().length > 0 || selectedRemoteChanges().length > 0) &&
        !hasUnpersistableChanges() &&
        !hasDraftConflict() &&
        !hasInvalidClassifications() &&
        store.invalidSections().length === 0 &&
        canEdit() &&
        isReady(),
    );
    const rows = computed(() => [...remoteRows(), ...localChanges()]);

    return {
      localChanges,
      remoteChanges,
      allRemoteChanges,
      remoteRows,
      selectedRemoteChanges,
      rows,
      isReady,
      hasPendingChanges,
      hasUnpersistableChanges,
      hasExecutedShotChanges,
      hasUnsupportedChanges,
      hasInvalidClassifications,
      hasUnsavedChanges,
      hasDraftConflict,
      canEdit,
      canSave,
    };
  }),
  withComputed((store) => ({
    isLoading: computed(() => !store.isReady() && !store._service.resource.error()),
    changesError: computed(() => store._service.resource.error() ?? null),
    validationErrors: computed(() => [
      ...(store.hasUnsupportedChanges()
        ? ['TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.UNSUPPORTED_CHANGES']
        : []),
      ...(store.hasExecutedShotChanges()
        ? ['TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.EXECUTED_SHOT_CHANGES']
        : []),
      ...(store.invalidSections().length > 0
        ? ['TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.INVALID_SECTION']
        : []),
      ...(store.hasDraftConflict() ? ['TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.DRAFT_CONFLICT'] : []),
      ...(store.hasInvalidClassifications()
        ? ['TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.CLASSIFICATION_INVALID']
        : []),
    ]),
  })),
  withMethods((store) => {
    const finishApply = async (result: PlanningChange[]): Promise<PlanningChangesSaveResult> => {
      const acceptedCount = result.filter((change) => change.status === 'ACCEPTED').length;
      const pendingCount = result.filter((change) => change.status === 'PENDING').length;
      const processedKeys = new Set(
        result.map((change) => identity(change.resourceType, change.resourceId, change.field)),
      );
      const processedIds = new Set(result.map((change) => change.id));
      const sectionChanges = Object.fromEntries(
        Object.entries(store.sectionChanges()).map(([section, changes]) => [
          section,
          (changes ?? []).filter(
            (change) =>
              !change.resourceType ||
              !change.resourceId ||
              !processedKeys.has(identity(change.resourceType, change.resourceId, change.field)),
          ),
        ]),
      ) as Partial<Record<PlanningChangeSection, PlanningDetectedChange[]>>;
      const remainingCreated = store.createdChanges().filter((change) => !processedIds.has(change.id));
      const remainingCreatedKeys = new Set(
        remainingCreated.map((change) => identity(change.resourceType, change.resourceId, change.field)),
      );
      const remainingLocal = store
        .createdLocalChanges()
        .filter(
          (change) =>
            !!change.resourceType &&
            !!change.resourceId &&
            remainingCreatedKeys.has(identity(change.resourceType, change.resourceId, change.field)),
        );
      const remainingRemote = store.createdRemoteChanges().filter((change) => !processedIds.has(change.id));
      patchState(store, {
        sectionChanges,
        createdChanges: remainingCreated,
        createdLocalChanges: remainingLocal,
        createdRemoteChanges: remainingRemote,
        selectedRemoteChangeIds: store.selectedRemoteChangeIds().filter((id) => !processedIds.has(id)),
        processedChanges: [...store.processedChanges().filter((change) => !processedIds.has(change.id)), ...result],
        isSaving: false,
        savePhase: remainingCreated.length > 0 || remainingRemote.length > 0 ? 'recovery-required' : 'idle',
        error:
          remainingCreated.length > 0 || remainingRemote.length > 0
            ? 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.RECOVERY_REQUIRED'
            : null,
      });
      store._service.reload();
      return { changes: result, acceptedCount, pendingCount };
    };

    const applyAttempt = async (): Promise<PlanningChangesSaveResult | null> => {
      const fireTrialId = store.fireTrialId();
      const createdChanges = [...store.createdChanges()];
      const createdLocalChanges = [...store.createdLocalChanges()];
      const remoteItems = [...store.createdRemoteChanges()];
      if (!fireTrialId || (createdChanges.length === 0 && remoteItems.length === 0)) return null;
      const createdItems =
        createdChanges.length > 0 ? toApplyPlanningChangesRequest(createdChanges, createdLocalChanges).changes : [];
      const result = await store._service.apply(fireTrialId, { changes: [...createdItems, ...remoteItems] });
      return finishApply(result);
    };

    return {
      load(fireTrialId: string): void {
        patchState(store, { fireTrialId, error: null });
        store._service.load(fireTrialId);
      },

      reload(): void {
        store._service.reload();
      },

      replaceSectionChanges(
        section: PlanningChangeSection,
        changes: ReadonlyArray<PlanningDetectedChange>,
        valid = true,
      ): void {
        if (store.hasPendingChanges()) return;
        const previous = store.sectionChanges()[section] ?? [];
        const previousByKey = new Map(previous.map((change) => [change.key, change]));
        const updated = changes.map((change) => {
          const existing = previousByKey.get(change.key);
          return existing
            ? {
                ...change,
                requiresApproval: existing.requiresApproval,
                requestClient: existing.requestClient,
              }
            : change;
        });
        const sectionChanges = { ...store.sectionChanges(), [section]: updated };
        const invalidSections = valid
          ? store.invalidSections().filter((item) => item !== section)
          : [...new Set([...store.invalidSections(), section])];
        const hydratedSections = store.hydratedSections().includes(section)
          ? store.hydratedSections()
          : [...store.hydratedSections(), section];
        patchState(store, { sectionChanges, invalidSections, hydratedSections, error: null });
      },

      updateClassification(key: string, classification: 'acepta' | 'solicita' | 'none'): void {
        const sectionChanges = Object.fromEntries(
          Object.entries(store.sectionChanges()).map(([section, changes]) => [
            section,
            (changes ?? []).map((change) => {
              if (change.key !== key) return change;
              return {
                ...change,
                classification:
                  classification === 'acepta'
                    ? 'requires-approval'
                    : classification === 'solicita'
                      ? 'requested-by-client'
                      : 'none',
                requiresApproval: classification === 'acepta',
                requestClient: classification === 'solicita',
              };
            }),
          ]),
        ) as Partial<Record<PlanningChangeSection, PlanningDetectedChange[]>>;
        const remoteChange = store.remoteChanges().find((change) => change.id === key && change.status === 'DRAFT');
        if (!remoteChange) {
          patchState(store, { sectionChanges });
          return;
        }

        const selectedIds = new Set(store.selectedRemoteChangeIds());
        selectedIds.add(key);
        patchState(store, {
          sectionChanges,
          selectedRemoteChangeIds: [...selectedIds],
          remoteChangeOverrides: {
            ...store.remoteChangeOverrides(),
            [key]: {
              requiresApproval: classification === 'acepta',
              requestClient: classification === 'solicita',
            },
          },
        });
      },

      toggleRemoteApply(id: string, selected: boolean): void {
        const change = store.remoteChanges().find((item) => item.id === id && item.status === 'DRAFT');
        if (!change) return;
        const selectedIds = new Set(store.selectedRemoteChangeIds());
        if (selected) selectedIds.add(id);
        else selectedIds.delete(id);
        const overrides = { ...store.remoteChangeOverrides() };
        if (!selected) delete overrides[id];
        patchState(store, { selectedRemoteChangeIds: [...selectedIds], remoteChangeOverrides: overrides });
      },

      async save(): Promise<PlanningChangesSaveResult | null> {
        if (!store.canSave()) return null;
        const fireTrialId = store.fireTrialId();
        if (!fireTrialId) return null;

        const localChanges = [...store.localChanges()];
        const remoteItems = [...store.selectedRemoteChanges()];
        patchState(store, {
          isSaving: true,
          savePhase: localChanges.length > 0 ? 'creating' : 'applying',
          createdLocalChanges: localChanges,
          createdRemoteChanges: remoteItems,
          error: null,
        });

        try {
          if (localChanges.length > 0) {
            const createdChanges = await store._service.create(
              fireTrialId,
              toCreatePlanningChangesRequest(localChanges),
            );
            if (createdChanges.length !== localChanges.length) {
              patchState(store, {
                createdChanges: [...createdChanges],
                savePhase: 'recovery-required',
                isSaving: false,
                error: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.RECOVERY_REQUIRED',
              });
              return null;
            }
            patchState(store, { createdChanges: [...createdChanges], savePhase: 'applying' });
          }
          return await applyAttempt();
        } catch {
          const phase = store.savePhase() === 'applying' ? 'recovery-required' : 'idle';
          patchState(store, { isSaving: false, savePhase: phase, error: errorMessage() });
          store._service.reload();
          return null;
        }
      },

      async retryApply(): Promise<PlanningChangesSaveResult | null> {
        if (
          store.savePhase() !== 'recovery-required' ||
          (store.createdChanges().length === 0 && store.createdRemoteChanges().length === 0)
        ) {
          return null;
        }
        patchState(store, { isSaving: true, savePhase: 'applying', error: null });
        try {
          return await applyAttempt();
        } catch {
          patchState(store, { isSaving: false, savePhase: 'recovery-required', error: errorMessage() });
          store._service.reload();
          return null;
        }
      },

      reset(): void {
        patchState(store, { ...initialState });
      },
    };
  }),
);
