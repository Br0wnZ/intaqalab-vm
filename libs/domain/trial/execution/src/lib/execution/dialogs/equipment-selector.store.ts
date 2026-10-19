import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, untracked } from '@angular/core';
import { injectCurrentUserRole } from '@intaqalab/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import { ExecutionService } from '../../services/execution.service';
import type {
  EquipmentMagnitudeSelectionGroup,
  EquipmentSelectorDialogData,
  EquipmentTypeEnum,
  TagConfig,
  TagRow,
  TagTableState,
} from '../models';
import { EquipmentMagnitudeTagEnum } from '../models';
import {
  collectPlannedMeasureIds,
  resolvePlannedEquipmentTags,
  resolvePlannedLengthMagnitudes,
  resolvePlannedSeriesByTag,
  resolveRequiredEquipmentCategories,
  resolveVisibleEquipmentTags,
} from '../utils/equipment-planning.utils';
import {
  INIT_STATE,
  SELECT_ALL_SERIES_VALUE,
  TAG_CONFIGS,
  apiToDialogFormat,
  dialogStatesToApiFormat,
  hasIncompleteEquipmentRows,
  hydrateFromInitialEquipments,
} from './equipment-selector-dialog.mapper';

function isNotFoundError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}

export interface EquipmentSelectorState {
  fireTrialId: string | null;
  selectedTagId: string;
  tagStates: Record<string, TagTableState>;
  initialEquipmentsJson: string;
  itemsByCategory: Record<string, Array<{ id: string; label: string }>>;
  loadedCategories: Record<string, boolean>;
  itemsLoading: boolean;
  itemsError: boolean;
  isInitialized: boolean;
  serieOptions: Array<{ value: string; label: string }>;
  disparoOptions: Array<{ value: string; label: string }>;
  serieDisparoMap: Record<string, string[]>;
}

const initialState: EquipmentSelectorState = {
  fireTrialId: null,
  selectedTagId: '',
  tagStates: {},
  initialEquipmentsJson: '[]',
  itemsByCategory: {},
  loadedCategories: {},
  itemsLoading: false,
  itemsError: false,
  isInitialized: false,
  serieOptions: [],
  disparoOptions: [],
  serieDisparoMap: {},
};

export const EquipmentSelectorStore = signalStore(
  withState(initialState),
  withComputed(
    (
      store,
      planningService = inject(EquipmentPlanningService),
      executionService = inject(ExecutionService),
      userRoles = injectCurrentUserRole(),
    ) => {
      const roleVisibleTags = computed<readonly TagConfig[]>(() =>
        resolveVisibleEquipmentTags(userRoles(), TAG_CONFIGS),
      );

      const enabledTagIds = computed<ReadonlySet<string>>(() => {
        const response = planningService.trialMeasuresResource.value();
        if (!response) return new Set<string>();
        return new Set<string>(
          resolvePlannedEquipmentTags(collectPlannedMeasureIds(response), planningService.catalog()),
        );
      });

      const enabledVisibleTags = computed<readonly TagConfig[]>(() =>
        roleVisibleTags().filter((tag) => enabledTagIds().has(tag.id)),
      );

      const visibleTags = enabledVisibleTags;

      const plannedMagnitudes = computed(() => {
        const response = planningService.trialMeasuresResource.value();
        if (!response) return [];
        const plannedIds = collectPlannedMeasureIds(response);
        return planningService.catalog().filter((measure) => plannedIds.has(measure.id));
      });

      const plannedSeriesByTag = computed<ReadonlyMap<string, ReadonlySet<string>>>(() => {
        const response = planningService.trialMeasuresResource.value();
        return response
          ? resolvePlannedSeriesByTag(response, planningService.catalog())
          : new Map<string, ReadonlySet<string>>();
      });

      const activeSeriesOptions = computed(() => {
        const plannedSeries = plannedSeriesByTag().get(store.selectedTagId());
        return store.serieOptions().filter((serie) => plannedSeries?.has(serie.value));
      });

      const activeTagFields = computed(() => {
        const tag = TAG_CONFIGS.find((t) => t.id === store.selectedTagId());
        return tag?.fields ?? [];
      });

      const activeTagRows = computed<readonly TagRow[]>(() => {
        const tagId = store.selectedTagId();
        if (!tagId) return [];
        return store.tagStates()[tagId]?.rows ?? [];
      });

      const paginatedRows = computed<readonly TagRow[]>(() => {
        const rows = activeTagRows();
        const pi = store.tagStates()[store.selectedTagId()]?.pageIndex ?? 0;
        return rows.slice(pi * 5, (pi + 1) * 5);
      });

      const currentEquipments = computed<EquipmentMagnitudeSelectionGroup[]>(() => {
        return dialogStatesToApiFormat(store.tagStates());
      });

      const isDirty = computed(() => {
        if (!store.isInitialized()) return false;
        return JSON.stringify(currentEquipments()) !== store.initialEquipmentsJson();
      });

      const canSave = computed(() => isDirty() && !hasIncompleteEquipmentRows(store.tagStates(), enabledVisibleTags()));

      const error = computed(() => {
        if (planningService.error() || store.itemsError()) return true;
        const resource = executionService.equipmentSelectorResource;
        return resource.status() === 'error' && !isNotFoundError(resource.error());
      });

      const isLoading = computed(() => {
        if (error()) return false;
        return (
          planningService.isLoading() ||
          executionService.equipmentSelectorResource.isLoading() ||
          store.itemsLoading() ||
          !store.isInitialized()
        );
      });

      return {
        roleVisibleTags,
        visibleTags,
        enabledTagIds,
        enabledVisibleTags,
        plannedMagnitudes,
        plannedSeriesByTag,
        activeSeriesOptions,
        activeTagFields,
        activeTagRows,
        paginatedRows,
        currentEquipments,
        isDirty,
        canSave,
        error,
        isLoading,
      };
    },
  ),
  withMethods((store, executionService = inject(ExecutionService)) => {
    function updateTag(tagId: string, updater: (s: TagTableState) => TagTableState): void {
      patchState(store, (state) => ({
        tagStates: {
          ...state.tagStates,
          [tagId]: updater(state.tagStates[tagId] ?? INIT_STATE()),
        },
      }));
    }

    function getDisparosBySeries(series: readonly string[]): string[] {
      if (!series.length) return [];
      const map = store.serieDisparoMap();
      if (!Object.keys(map).length) {
        return store.disparoOptions().map((d) => d.value);
      }
      const disparos = series.flatMap((serie) => map[serie] ?? []);
      return [...new Set(disparos)];
    }

    function loadTagItems(tagId: string, isInitial = false): void {
      const tag = TAG_CONFIGS.find((config) => config.id === tagId);
      if (!tag) {
        if (isInitial) patchState(store, { isInitialized: true });
        return;
      }

      const loaded = store.loadedCategories();
      const missing = resolveRequiredEquipmentCategories([tag]).filter((category) => !loaded[category]);

      if (!missing.length) {
        if (isInitial) patchState(store, { isInitialized: true });
        return;
      }

      if (isInitial) patchState(store, { itemsLoading: true });

      untracked(() => {
        executionService
          .loadEquipmentItemsByCategories(missing)
          .then((items) => {
            patchState(store, (state) => ({
              itemsByCategory: { ...state.itemsByCategory, ...items },
              loadedCategories: missing.reduce<Record<string, boolean>>(
                (acc, category) => ({ ...acc, [category]: true }),
                state.loadedCategories,
              ),
              isInitialized: true,
              itemsLoading: false,
              itemsError: false,
            }));
          })
          .catch((err: unknown) => {
            console.error('[EquipmentSelectorStore] Error cargando equipos por categoría', err);
            patchState(store, { itemsLoading: false, itemsError: true });
          });
      });
    }

    return {
      init(data: EquipmentSelectorDialogData): void {
        patchState(store, {
          fireTrialId: data.fireTrialId,
          serieOptions: data.serieOptions,
          disparoOptions: data.disparoOptions,
          serieDisparoMap: data.serieDisparoMap ?? {},
          itemsByCategory: {},
          loadedCategories: {},
          itemsLoading: false,
          itemsError: false,
          isInitialized: false,
        });
      },

      selectTag(tagId: string): void {
        if (!store.visibleTags().some((tag) => tag.id === tagId) || !store.enabledTagIds().has(tagId)) {
          return;
        }
        patchState(store, (state) => ({
          selectedTagId: tagId,
          tagStates: state.tagStates[tagId] ? state.tagStates : { ...state.tagStates, [tagId]: INIT_STATE() },
        }));
        loadTagItems(tagId);
      },

      /**
       * Carga perezosamente los equipos de las categorías requeridas por la tag indicada.
       * Solo solicita las categorías aún no cargadas, fusionando el resultado en `itemsByCategory`.
       */
      loadTagItems,

      addRow(): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => {
          const rowId = `row-${s.nextId}`;
          return {
            ...s,
            rows: [...s.rows, { rowId, fieldValues: {}, series: [], disparos: [] }],
            nextId: s.nextId + 1,
          };
        });
      },

      removeRow(rowId: string): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => ({
          ...s,
          rows: s.rows.filter((r) => r.rowId !== rowId),
        }));
      },

      setFieldValue(rowId: string, fieldKey: string, value: string): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => ({
          ...s,
          rows: s.rows.map((r) =>
            r.rowId === rowId ? { ...r, fieldValues: { ...r.fieldValues, [fieldKey]: value } } : r,
          ),
        }));
      },

      setRowSeries(rowId: string, series: string[]): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => ({
          ...s,
          rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, series } : r)),
        }));
      },

      setRowDisparos(rowId: string, disparos: string[]): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => ({
          ...s,
          rows: s.rows.map((r) =>
            r.rowId === rowId
              ? { ...r, disparos: disparos.filter((id) => getDisparosBySeries(r.series).includes(id)) }
              : r,
          ),
        }));
      },

      handleSeriesSelection(rowId: string, selectedValues: readonly string[]): void {
        const allowedSeries = store.activeSeriesOptions().map((serie) => serie.value);
        const series = selectedValues.includes(SELECT_ALL_SERIES_VALUE)
          ? allowedSeries
          : selectedValues.filter((value) => allowedSeries.includes(value));
        const disparos = getDisparosBySeries(series);

        const tagId = store.selectedTagId();
        if (!tagId) return;

        updateTag(tagId, (s) => ({
          ...s,
          rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, series, disparos } : r)),
        }));
      },

      setPageIndex(pageIndex: number): void {
        const tagId = store.selectedTagId();
        if (!tagId) return;
        updateTag(tagId, (s) => ({ ...s, pageIndex }));
      },

      getItemsByCategory(categoryId: EquipmentTypeEnum | string | ''): Array<{ id: string; label: string }> {
        if (!categoryId) return [];
        if (categoryId === 'magnitud') {
          return store.selectedTagId() === EquipmentMagnitudeTagEnum.LONGITUD
            ? resolvePlannedLengthMagnitudes(store.plannedMagnitudes())
            : [];
        }
        return store.itemsByCategory()[categoryId] ?? [];
      },

      getShotOptions(series: readonly string[]): EquipmentSelectorDialogData['disparoOptions'] {
        const availableShots = new Set(getDisparosBySeries(series));
        return store.disparoOptions().filter((shot) => availableShots.has(shot.value));
      },
    };
  }),
  withHooks({
    onInit(store, planningService = inject(EquipmentPlanningService), executionService = inject(ExecutionService)) {
      // Dispara la carga remota cuando cambia fireTrialId
      effect(() => {
        const trialId = store.fireTrialId();
        if (trialId) {
          planningService.load(trialId);
          executionService.getEquipmentSelector(trialId);
        }
      });

      // Hidrata y carga categorías de equipos cuando los recursos de planificación y selección resuelven
      effect(() => {
        const equipmentResource = executionService.equipmentSelectorResource;
        const equipmentStatus = equipmentResource.status();
        const equipmentNotFound = equipmentStatus === 'error' && isNotFoundError(equipmentResource.error());
        if (store.isInitialized() || store.itemsLoading() || planningService.isLoading()) return;
        if (
          planningService.error() ||
          planningService.trialMeasuresResource.status() !== 'resolved' ||
          planningService.catalogResource.status() !== 'resolved' ||
          (equipmentStatus !== 'resolved' && !equipmentNotFound)
        ) {
          return;
        }

        const apiData = equipmentResource.hasValue() ? equipmentResource.value() : [];
        const initialDialogFormat = apiData?.length ? apiToDialogFormat(apiData) : [];
        const hydratedStates = initialDialogFormat.length ? hydrateFromInitialEquipments(initialDialogFormat) : {};

        const firstEnabled = store.enabledVisibleTags()[0];
        const selectedTagId = firstEnabled ? firstEnabled.id : '';

        const initialStates: Record<string, TagTableState> = { ...hydratedStates };
        if (selectedTagId && !initialStates[selectedTagId]) {
          initialStates[selectedTagId] = INIT_STATE();
        }

        patchState(store, {
          tagStates: initialStates,
          selectedTagId,
          initialEquipmentsJson: JSON.stringify(dialogStatesToApiFormat(initialStates)),
        });

        untracked(() => store.loadTagItems(selectedTagId, true));
      });
    },
  }),
);
