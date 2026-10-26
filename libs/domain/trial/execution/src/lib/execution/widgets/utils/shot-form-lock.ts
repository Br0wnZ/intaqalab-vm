import type { Signal } from '@angular/core';
import { computed, effect, inject, signal, untracked } from '@angular/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import type { SelectedShotState } from './selection-options';
import { mapSelectedShotStatus, mapSelectedShotStatusClass, mapSelectedShotStatusLabel } from './selection-options';

export interface ShotSelectionGetter {
  serie: string | null | undefined;
  disparo: string | null | undefined;
}

export interface ShotFormLockOptions {
  selectedSerieId: () => string | null | undefined;
  selectedShotId: () => string | null | undefined;
}

export interface ShotFormLock {
  readonly readOnly: Signal<boolean>;
  readonly canEnableHistoricalEdit: Signal<boolean>;
  readonly historicalEditEnabled: Signal<boolean>;
  readonly isCurrentShot: Signal<boolean>;
  readonly isHistoricalFiredShot: Signal<boolean>;
  readonly isUnexecutedShot: Signal<boolean>;
  readonly shotStatus: Signal<SelectedShotState>;
  readonly statusLabel: Signal<string>;
  readonly statusClass: Signal<string>;
  enableHistoricalEdit: () => void;
  lock: () => void;
}

/**
 * 🔒 Hook reactivo para control de estado de edición por serie y disparo.
 *
 * Contrato de ejecución:
 * 1. Disparo en curso (`EN_CURSO`): editable por defecto (`readOnly = false`).
 * 2. Disparo ejecutado (`EJECUTADA` / `FIRED`): bloqueado (`readOnly = true`) pero habilita botón de edición.
 * 3. Disparo pendiente (`PENDIENTE`): bloqueado (`readOnly = true`) sin posibilidad de edición.
 * 4. Prueba en solo lectura (`isTrialReadOnly`): bloqueado sin posibilidad de edición.
 *
 * Reseteos automáticos:
 * - Al cambiar de serie o disparo seleccionado -> vuelve a modo bloqueado.
 * - Al pulsar 'Guardar' en `execution.ts` (`widgetStateService.saveAllDirtyForms()`) -> vuelve a modo bloqueado.
 */
export function injectShotFormLock(
  selectionOrOptions: (() => ShotSelectionGetter) | ShotFormLockOptions,
): ShotFormLock {
  const getSelection: () => ShotSelectionGetter =
    typeof selectionOrOptions === 'function'
      ? selectionOrOptions
      : () => ({
          serie: selectionOrOptions.selectedSerieId(),
          disparo: selectionOrOptions.selectedShotId(),
        });

  const store = inject(ExecutionStore, { optional: true });
  const widgetState = inject(WidgetStateService, { optional: true });

  const historicalEditEnabled = signal(false);

  const isCurrentShot = computed(() => {
    if (!store) return false;
    const { serie, disparo } = getSelection();
    if (!serie || !disparo) return false;
    const activeSerie = store.activeSerieId();
    const activeShot = store.activeShotId();
    if (activeSerie || activeShot) {
      return serie === activeSerie && disparo === activeShot;
    }
    return selectedShotProgress()?.status !== 'FIRED';
  });

  const selectedShotProgress = computed(() => {
    if (!store) return null;
    const { serie, disparo } = getSelection();
    if (!serie || !disparo) return null;
    const progress = store.executionProgress();
    const series = progress?.series.find((s) => s.seriesId === serie);
    return series?.shots.find((sh) => sh.shotId === disparo) ?? null;
  });

  const isHistoricalFiredShot = computed(() => !isCurrentShot() && selectedShotProgress()?.status === 'FIRED');

  const isUnexecutedShot = computed(() => !isCurrentShot() && selectedShotProgress()?.status !== 'FIRED');

  const canEnableHistoricalEdit = computed(
    () => !(store?.isTrialReadOnly() ?? false) && isHistoricalFiredShot() && !historicalEditEnabled(),
  );

  const readOnly = computed(() => {
    const { serie, disparo } = getSelection();
    return (
      !serie ||
      !disparo ||
      (store?.isTrialReadOnly() ?? false) ||
      isUnexecutedShot() ||
      (isHistoricalFiredShot() && !historicalEditEnabled())
    );
  });

  const shotStatus = computed<SelectedShotState>(() => {
    const { serie, disparo } = getSelection();
    const fallbackStatus: SelectedShotState = isCurrentShot()
      ? 'EN_CURSO'
      : isHistoricalFiredShot()
        ? 'EJECUTADA'
        : 'PENDIENTE';

    if (!store) return fallbackStatus;

    return mapSelectedShotStatus(
      store.executionProgress(),
      serie,
      disparo,
      store.activeSerieId(),
      store.activeShotId(),
      fallbackStatus,
    );
  });

  const statusLabel = computed(() => mapSelectedShotStatusLabel(shotStatus()));
  const statusClass = computed(() => mapSelectedShotStatusClass(shotStatus()));

  // 🔄 Reset de edición cuando cambia serie o disparo
  effect(() => {
    getSelection();
    untracked(() => historicalEditEnabled.set(false));
  });

  // 🔒 Re-bloqueo automático tras guardado desde execution.ts
  effect(() => {
    if (widgetState && typeof widgetState.saveSuccessCount === 'function') {
      widgetState.saveSuccessCount();
      untracked(() => historicalEditEnabled.set(false));
    }
  });

  return {
    readOnly,
    canEnableHistoricalEdit,
    historicalEditEnabled: historicalEditEnabled.asReadonly(),
    isCurrentShot,
    isHistoricalFiredShot,
    isUnexecutedShot,
    shotStatus,
    statusLabel,
    statusClass,
    enableHistoricalEdit: () => historicalEditEnabled.set(true),
    lock: () => historicalEditEnabled.set(false),
  };
}
