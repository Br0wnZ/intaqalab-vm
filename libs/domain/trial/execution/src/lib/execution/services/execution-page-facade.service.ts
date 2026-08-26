import { Injectable, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { injectCurrentUser } from '@intaqalab/core';
import { explicitEffect, injectPageVisibility } from '@intaqalab/utils';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore } from '../../+state/execution.store';
import { CancelExecutionDialog } from '../dialogs/cancel-execution-dialog';
import { EquipmentSelectorDialog } from '../dialogs/equipment-selector-dialog';
import { InterruptExecutionDialog } from '../dialogs/interrupt-execution-dialog';
import { PauseExecutionDialog } from '../dialogs/pause-execution-dialog';
import type { EquipmentSelectorDialogResult } from '../models';
import type { Widget } from '../models/execution-grid.models';
import type { ExecutionHeaderData, ExecutionShotInfo } from '../models/execution-page.models';
import { WidgetId } from '../models/widget-id.enum';
import { injectWidgets } from '../utils/inject-widgets';
import { WidgetStateService } from './widget-state.service';

const EXECUTION_STATE_POLLING_MS = 5_000;

@Injectable()
export class ExecutionPageFacade {
  readonly #dialog = inject(MatDialog);
  readonly #store = inject(ExecutionStore);
  readonly #widgetState = inject(WidgetStateService);
  readonly #currentUser = injectCurrentUser();
  readonly #pageVisible = injectPageVisibility();
  readonly #fireTrialId = signal<string | null>(null);
  readonly #isSaving = signal(false);

  /**
   * Se activa una vez que se reciben los primeros datos de ejecución.
   * A partir de ese momento, `isLoading` permanece `false` para siempre,
   * garantizando que el grid no se destruya en ningún ciclo de polling.
   */
  readonly #initialLoadDone = signal(false);

  // eslint-disable-next-line no-unused-private-class-members
  readonly #initialLoadEffect = explicitEffect(
    [this.#store.isLoadingExecutionState, this.#store.isLoadingExecutionProgress],
    ([isLoadingState, isLoadingProgress]) => {
      if (!isLoadingState && !isLoadingProgress && !this.#initialLoadDone()) {
        this.#initialLoadDone.set(true);
      }
    },
  );

  readonly widgets = signal<Widget[]>(injectWidgets()).asReadonly();
  readonly hasUnsavedChanges = this.#widgetState.hasUnsavedChanges;
  readonly isSaving = this.#isSaving.asReadonly();
  /**
   * `true` solo durante la carga inicial (antes del primer dato de estado).
   * El polling periódico NO activa esta señal — `#initialLoadDone` actúa como
   * latch de un solo disparo, evitando que el grid se destruya en cada ciclo.
   */
  readonly isLoading = computed(() => !this.#initialLoadDone());
  readonly loadError = computed(() => this.#store.executionStateError() ?? this.#store.executionProgressError());

  readonly executionData = computed<ExecutionHeaderData>(() => {
    const trial = this.#store.fireTrialData();
    if (!trial) {
      return { code: '—', client: '—', project: '—', status: '—' };
    }

    return {
      code: trial.trialNumber ?? '—',
      client: trial.client?.name ? `Cliente: ${trial.client.name}` : '—',
      project: trial.description ?? '—',
      status: this.#mapStatusLabel(trial.status),
    };
  });

  readonly shotInfo = computed<ExecutionShotInfo>(() => {
    const progress = this.#store.executionProgress();
    const planningSeries = this.#store.planningSeries() ?? [];
    const activeSerieId = this.#store.activeSerieId();
    const activeShotId = this.#store.activeShotId();
    const activeSerie = planningSeries.find((serie) => serie.id === activeSerieId);
    const activeShot =
      activeSerie?.shots?.find((shot) => shot.id === activeShotId) ??
      planningSeries.flatMap((serie) => serie.shots ?? []).find((shot) => shot.id === activeShotId);
    const activeShotIndex = activeSerie?.shots?.findIndex((shot) => shot.id === activeShotId) ?? -1;
    const progressSeries = progress?.series ?? [];
    const totalShots = progressSeries.reduce((total, serie) => total + serie.shots.length, 0);
    const firedShots = progressSeries.reduce(
      (total, serie) => total + serie.shots.filter((shot) => shot.status === 'FIRED').length,
      0,
    );

    return {
      actual: {
        serie: activeSerie?.name?.trim() || '—',
        shot: activeShot ? `Disparo #${String(activeShot.globalNumber ?? activeShotIndex + 1).padStart(2, '0')}` : '—',
        percentage: String(totalShots > 0 ? Math.round((firedShots / totalShots) * 100) : 0),
      },
      all: progressSeries.map((serie, serieIndex) => ({
        serie: `Serie ${serieIndex + 1}`,
        shots: serie.shots.map((shot, shotIndex) => ({
          shot: `Disparo #${String(shotIndex + 1).padStart(2, '0')}`,
          timestamp: shot.updatedAt,
          status: this.#mapShotStatus(shot.status),
        })),
      })),
    };
  });

  // eslint-disable-next-line no-unused-private-class-members
  readonly #loadPreferencesEffect = explicitEffect([this.#store.preferencesByUser], ([preferences]) => {
    if (!preferences?.widgetsLayout) {
      return;
    }

    this.#restoreWidgetLayout(preferences.widgetsLayout);
  });

  // eslint-disable-next-line no-unused-private-class-members
  readonly #pollingEffect = explicitEffect(
    [this.#fireTrialId, this.#pageVisible],
    ([fireTrialId, pageVisible], onCleanup) => {
      if (!fireTrialId || !pageVisible) {
        return;
      }

      const intervalId = setInterval(() => this.#store.loadExecutionState(fireTrialId), EXECUTION_STATE_POLLING_MS);
      onCleanup(() => clearInterval(intervalId));
    },
  );

  initialize(fireTrialId: string): void {
    if (this.#fireTrialId() === fireTrialId) {
      return;
    }

    this.#fireTrialId.set(fireTrialId);
    this.#store.setFireTrialId(fireTrialId);
    this.#store.loadPreferencesByUser(fireTrialId, this.#currentUser.preferred_username);
  }

  persistPreferences(): void {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId || !this.#store.preferencesByUser()) {
      return;
    }

    this.#store.updatePreferencesByUser(
      fireTrialId,
      this.#currentUser.preferred_username,
      this.#widgetState.placedWidgets().map((widget) => widget.type),
    );
  }

  startExecution(): void {
    this.#withTrialId((fireTrialId) => this.#store.startExecution(fireTrialId));
  }

  resumeExecution(): void {
    this.#withTrialId((fireTrialId) => this.#store.resumeExecution(fireTrialId));
  }

  finishExecution(): void {
    this.#withTrialId((fireTrialId) => this.#store.finishExecution(fireTrialId));
  }

  async pauseExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }

    const result = await firstValueFrom(
      this.#dialog
        .open(PauseExecutionDialog, {
          width: '600px',
          data: { trialName: this.executionData().code, trialId: fireTrialId },
        })
        .afterClosed(),
    );

    if (!result || result.action === 'back') {
      return;
    }
  }

  async interruptExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }

    const result = await firstValueFrom(
      this.#dialog
        .open(InterruptExecutionDialog, {
          width: '600px',
          data: { trialName: this.executionData().code },
        })
        .afterClosed(),
    );

    if (!result || result.action === 'back') {
      return;
    }
    this.#store.interruptExecution(fireTrialId, result.reason);
  }

  async cancelExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }

    const result = await firstValueFrom(
      this.#dialog
        .open(CancelExecutionDialog, {
          width: '600px',
          data: { trialName: this.executionData().code },
        })
        .afterClosed(),
    );

    if (!result || result.action === 'back') {
      return;
    }
    this.#store.cancelExecution(fireTrialId, result.reason);
  }

  async openEquipmentSelector(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }

    const selector = this.#store.equipmentSelector();
    const result = await firstValueFrom(
      this.#dialog
        .open<EquipmentSelectorDialog, unknown, EquipmentSelectorDialogResult>(EquipmentSelectorDialog, {
          width: '900px',
          minWidth: '900px',
          maxHeight: '90vh',
          data: {
            fireTrialId,
            serieOptions: selector.serieOptions,
            disparoOptions: selector.disparoOptions,
            serieDisparoMap: selector.serieDisparoMap,
          },
        })
        .afterClosed(),
    );

    if (!result || result.action === 'back') {
      return;
    }
    this.#store.updateEquipmentSelections(result.equipments);
  }

  addWidget(widgetId: string): void {
    const widget = this.widgets().find((item) => item.id === widgetId);
    if (!widget) {
      return;
    }

    this.#widgetState.addWidget(
      widget.widgetId,
      widget.defaultWidth,
      undefined,
      widget.techProfile,
      widget.defaultHeight ?? 1,
    );
  }

  async saveAllChanges(): Promise<void> {
    const shouldSaveJltShotData = this.#widgetState
      .dirtyWidgets()
      .some((widgetState) => this.#findPlacedWidgetType(widgetState.widgetId) === WidgetId.JLT_SHOT_DATA);

    this.#isSaving.set(true);
    try {
      await this.#widgetState.saveAllDirtyForms();
      if (shouldSaveJltShotData) {
        this.#withTrialId((fireTrialId) => this.#store.saveJltShotData(fireTrialId));
      }
    } finally {
      this.#isSaving.set(false);
    }
  }

  #restoreWidgetLayout(layout: string[]): void {
    this.#widgetState.clearWidgets();
    for (const widgetId of layout) {
      const widget = this.widgets().find((item) => item.widgetId === widgetId);
      if (!widget) {
        continue;
      }

      try {
        this.#widgetState.addWidget(
          widget.widgetId,
          widget.defaultWidth,
          undefined,
          widget.techProfile,
          widget.defaultHeight ?? 1,
        );
      } catch {
        return;
      }
    }
  }

  #withTrialId(action: (fireTrialId: string) => void): void {
    const fireTrialId = this.#fireTrialId();
    if (fireTrialId) {
      action(fireTrialId);
    }
  }

  #findPlacedWidgetType(widgetInstanceId: string): WidgetId | null {
    return this.#widgetState.placedWidgets().find((widget) => widget.id === widgetInstanceId)?.type ?? null;
  }

  #mapShotStatus(status: string): string {
    switch (status) {
      case 'FIRED':
        return 'Ejecutada';
      case 'ACTIVE':
        return 'Analizando';
      default:
        return 'Planificada';
    }
  }

  #mapStatusLabel(status: string | undefined): string {
    const statusLabels: Record<string, string> = {
      PLANNED: 'Planificada',
      STARTED: 'Iniciada',
      IN_PROGRESS: 'En curso',
      INTERRUPTED: 'Interrumpida',
      EXECUTED: 'Ejecutada',
      FINALIZING: 'Finalizando',
      CLOSED: 'Cerrada',
      CANCELLED: 'Cancelada',
    };
    return status ? (statusLabels[status] ?? status) : '—';
  }
}
