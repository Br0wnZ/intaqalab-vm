import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { ShotMunitionResponse } from '../../execution/models';
import { mapRemoteToMunitionState } from '../../execution/widgets/munition-introduction/munition-introduction.mapper';
import type { PlanningComponentType } from '../../services/execution.service';
import type {
  MunitionIntroAcondicionamientoState,
  MunitionIntroIdentificationState,
  MunitionIntroWeightState,
  MunitionIntroductionState,
} from '../execution-state.models';

/**
 * Maps a catalog category + label to the internal store category string
 * used by the tabs (e.g., isEspoleta checks for 'espoleta', isPolvo checks for 'polvo').
 */
function mapCatalogCategoryToStoreCategory(catalogCategory: string, label: string): string {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('espoleta')) return 'espoleta';
  if (lowerLabel.includes('pólvora') || lowerLabel.includes('polvora')) return 'polvo';
  if (lowerLabel.includes('granada')) return 'granada';
  if (lowerLabel.includes('carga')) return 'carga';
  // MUNITION category → main denomination type (e.g., "Disparo Organizado", "Disparo completo")
  if (catalogCategory === 'MUNITION') return 'munition';
  return 'componente';
}

interface MunitionIntroductionSlice {
  munitionIntroduction: MunitionIntroductionState;
}

const initialWeightState: MunitionIntroWeightState = {
  componente: null,
  balance: null,
  weight: null,
  weightAdded: null,
  weightRemoved: null,
  weighingDateTime: null,
  weighingRange: null,
  observations: null,
};

const initialState: MunitionIntroductionSlice = {
  munitionIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    selectedComponentId: null,
    remoteMunitionResponse: null,
    identificacion: {
      componente: null,
      denominacion: null,
      lote: null,
      numeroCliente: null,
      modoFuncionamiento: null,
      graduacionEspoleta: null,
      observaciones: null,
      denominacionFromPlanning: false,
      loteFromPlanning: false,
      denominacionNotInStock: false,
      loteNotInStock: false,
    },
    weight: initialWeightState,
    weightDataByBalance: {},
    acondicionamiento: {
      camara: null,
      componente: null,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      temperatura: 20,
      temperaturaCorregida: null,
      observaciones: null,
    },
    serieOptions: [
      { value: 'calentamiento', label: 'Calentamiento' },
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    componenteOptions: [
      { value: 'espoleta-01', label: 'Espoleta', category: 'espoleta' },
      { value: 'granada-01', label: 'Granada', category: 'granada' },
      { value: 'polvo-01', label: 'Pólvora', category: 'polvo' },
      { value: 'carga-01', label: 'Carga propulsora', category: 'carga' },
    ],
    denominacionOptions: [
      { value: 'den-01', label: '155mm M107', componenteId: 'granada-01', inStock: true },
      { value: 'den-02', label: 'Espoleta M578', componenteId: 'espoleta-01', inStock: true },
      { value: 'den-03', label: 'Pólvora M232', componenteId: 'polvo-01', inStock: true },
      { value: 'den-04', label: 'Carga L8A1', componenteId: 'carga-01', inStock: true },
    ],
    loteOptions: [
      { value: 'lote-01', label: 'Lote A-2024', denominacionId: 'den-01' },
      { value: 'lote-02', label: 'Lote B-2024', denominacionId: 'den-01' },
      { value: 'lote-03', label: 'Lote C-2025', denominacionId: 'den-02' },
      { value: 'lote-04', label: 'Lote D-2025', denominacionId: 'den-03' },
    ],
    modoFuncionamientoOptions: [
      { value: 'percusion', label: 'Percusión' },
      { value: 'tiempo', label: 'Tiempo' },
      { value: 'ppd', label: 'PPD (Retardo)' },
      { value: 'superpercusion', label: 'Superpercusión' },
    ],
    balanzaOptions: [
      { value: 'bal-01', label: 'Balanza Precisión 500g', rangoMin: 0, rangoMax: 500, unit: 'g' },
      { value: 'bal-02', label: 'Balanza Precisión 2000g', rangoMin: 0, rangoMax: 2000, unit: 'g' },
    ],
    camaraOptions: [],
  },
};

export function withMunitionIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      updateMunitionIntroductionPlanningOptions(
        componentTypes: PlanningComponentType[],
        denominations: Array<{
          id: string;
          name: string;
          componentTypeId: string;
          batch?: string | null;
          clientNumber?: string | null;
        }>,
      ): void {
        const planningLotes = denominations.flatMap((d) =>
          d.batch ? [{ value: d.batch, label: d.batch, denominacionId: d.id }] : [],
        );

        patchState(store, (state) => {
          const existingLotes = state.munitionIntroduction.loteOptions;
          const mergedLotes = [...existingLotes];
          for (const pl of planningLotes) {
            if (!mergedLotes.some((l) => l.value === pl.value && l.denominacionId === pl.denominacionId)) {
              mergedLotes.push(pl);
            }
          }

          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              componenteOptions: componentTypes.map(({ id, label, category }) => ({
                value: id,
                label,
                category: mapCatalogCategoryToStoreCategory(category, label),
              })),
              denominacionOptions: denominations.map(({ id, name, componentTypeId, batch, clientNumber }) => ({
                value: id,
                label: name,
                componenteId: componentTypeId,
                inStock: true,
                batch: batch ?? null,
                clientNumber: clientNumber ?? null,
              })),
              loteOptions: mergedLotes,
            },
          };
        });
      },

      /** Adds or merges denomination options without duplicating */
      addMunitionIntroductionDenominations(
        denominations: Array<{
          id: string;
          name: string;
          componentTypeId: string;
          batch?: string | null;
          clientNumber?: string | null;
        }>,
      ): void {
        patchState(store, (state) => {
          const existing = state.munitionIntroduction.denominacionOptions;
          const toAdd = denominations.filter((d) => !existing.some((e) => e.value === d.id));
          if (toAdd.length === 0) return {};

          const newOptions = toAdd.map(({ id, name, componentTypeId, batch, clientNumber }) => ({
            value: id,
            label: name,
            componenteId: componentTypeId,
            inStock: true,
            batch: batch ?? null,
            clientNumber: clientNumber ?? null,
          }));

          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              denominacionOptions: [...existing, ...newOptions],
            },
          };
        });
      },

      /** Updates serie/disparo selector */
      updateMunitionIntroductionSelector(updates: Partial<Pick<MunitionIntroductionState, 'serie' | 'disparo'>>): void {
        patchState(store, (state) => ({
          munitionIntroduction: { ...state.munitionIntroduction, ...updates },
        }));
      },

      /** Updates Identificación tab */
      updateMunitionIntroductionIdentification(updates: Partial<MunitionIntroIdentificationState>): void {
        patchState(store, (state) => ({
          munitionIntroduction: {
            ...state.munitionIntroduction,
            identificacion: { ...state.munitionIntroduction.identificacion, ...updates },
          },
        }));
      },

      /**
       * Updates the active weight state and persists it into weightDataByBalance
       * using the current balance key.
       */
      updateMunitionIntroductionWeight(updates: Partial<MunitionIntroWeightState>): void {
        patchState(store, (state) => {
          const merged: MunitionIntroWeightState = { ...state.munitionIntroduction.weight, ...updates };
          const balanceKey = merged.balance;
          const weightDataByBalance = balanceKey
            ? { ...state.munitionIntroduction.weightDataByBalance, [balanceKey]: merged }
            : state.munitionIntroduction.weightDataByBalance;
          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              weight: merged,
              weightDataByBalance,
            },
          };
        });
      },

      /**
       * Updates weight data for a specific balance key and syncs the active weight
       * state if it matches the currently selected balance.
       */
      updateMunitionIntroductionWeightByBalance(balanceKey: string, data: Partial<MunitionIntroWeightState>): void {
        patchState(store, (state) => {
          const existing = state.munitionIntroduction.weightDataByBalance[balanceKey] ?? initialWeightState;
          const updated: MunitionIntroWeightState = { ...existing, ...data, balance: balanceKey };
          const weightDataByBalance = {
            ...state.munitionIntroduction.weightDataByBalance,
            [balanceKey]: updated,
          };
          // Also update the active weight state if this is the currently selected balance
          const isActive = state.munitionIntroduction.weight.balance === balanceKey;
          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              weight: isActive ? updated : state.munitionIntroduction.weight,
              weightDataByBalance,
            },
          };
        });
      },

      /**
       * Switches the active balance and loads its persisted weight data from memory.
       * If no data exists for the balance, resets to empty defaults.
       */
      setActiveMunitionBalance(balanceKey: string): void {
        patchState(store, (state) => {
          const persisted = state.munitionIntroduction.weightDataByBalance[balanceKey];
          const active: MunitionIntroWeightState = persisted
            ? { ...persisted, balance: balanceKey }
            : { ...initialWeightState, balance: balanceKey };
          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              weight: active,
            },
          };
        });
      },

      /**
       * Loads all weight data from the API response (array per balance).
       * Replaces the entire weightDataByBalance map and sets the active weight
       * to the first entry (or empty if none).
       */
      loadMunitionIntroductionWeightData(weightDataByBalance: Record<string, MunitionIntroWeightState>): void {
        patchState(store, (state) => {
          const keys = Object.keys(weightDataByBalance);
          const firstKey = keys[0];
          const activeWeight: MunitionIntroWeightState =
            firstKey !== undefined && firstKey !== null ? weightDataByBalance[firstKey] : { ...initialWeightState };
          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              weight: activeWeight,
              weightDataByBalance,
            },
          };
        });
      },

      /** Updates Acondicionamiento tab */
      updateMunitionIntroductionAcondicionamiento(updates: Partial<MunitionIntroAcondicionamientoState>): void {
        patchState(store, (state) => ({
          munitionIntroduction: {
            ...state.munitionIntroduction,
            acondicionamiento: { ...state.munitionIntroduction.acondicionamiento, ...updates },
          },
        }));
      },

      /**
       * Loads the full remote ShotMunitionResponse (GET).
       * Sets remoteMunitionResponse and maps data for the target component (or first component).
       */
      loadMunitionIntroductionRemoteResponse(
        response: ShotMunitionResponse,
        preferredComponentId?: string | null,
      ): void {
        patchState(store, (state) => {
          const components = response.munitionData ?? [];
          const targetComponentId =
            (preferredComponentId && components.some((c) => c.componentId === preferredComponentId)
              ? preferredComponentId
              : null) ??
            components[0]?.componentId ??
            null;

          const mapped = mapRemoteToMunitionState(response, targetComponentId);
          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              selectedComponentId: targetComponentId,
              remoteMunitionResponse: response,
              identificacion: {
                ...state.munitionIntroduction.identificacion,
                ...mapped.identificacion,
              },
              weight: {
                ...initialWeightState,
                ...mapped.weight,
              },
              weightDataByBalance: mapped.weightDataByBalance,
              acondicionamiento: {
                ...state.munitionIntroduction.acondicionamiento,
                ...mapped.acondicionamiento,
              },
            },
          };
        });
      },

      /**
       * Switches the active component.
       * Discards all unsaved in-memory edits by reloading pristine data from remoteMunitionResponse.
       * Resets chosen balance to the first balance of this component (or null).
       */
      selectMunitionComponent(componentId: string): void {
        patchState(store, (state) => {
          const remote = state.munitionIntroduction.remoteMunitionResponse;
          const mapped = mapRemoteToMunitionState(remote, componentId);

          return {
            munitionIntroduction: {
              ...state.munitionIntroduction,
              selectedComponentId: componentId,
              identificacion: {
                ...initialState.munitionIntroduction.identificacion,
                ...mapped.identificacion,
              },
              weight: {
                ...initialWeightState,
                ...mapped.weight,
              },
              weightDataByBalance: mapped.weightDataByBalance,
              acondicionamiento: {
                ...initialState.munitionIntroduction.acondicionamiento,
                ...mapped.acondicionamiento,
              },
            },
          };
        });
      },
    })),
  );
}
