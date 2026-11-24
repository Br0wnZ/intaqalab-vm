import { HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Role, injectCurrentUser, injectCurrentUserRole } from '@intaqalab/core';
import { PlanningTrialContextService } from '@intaqalab/data-access-planning';
import type { TrialStatus } from '@intaqalab/models';
import { PlanningPermissionsService } from '@intaqalab/planning';
import { explicitEffect, injectPageVisibility } from '@intaqalab/utils';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore } from '../../+state/execution.store';
import { PlanningModificationsService } from '../../data-access';
import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import { CancelExecutionDialog } from '../dialogs/cancel-execution-dialog';
import {
  ClientModificationsDialog,
  type ClientModificationsDialogData,
  type ClientModificationsDialogResult,
  PlanningModificationBlockedDialog,
  type PlanningModificationBlockedDialogResult,
} from '../dialogs/client-modifications-dialog';
import { EquipmentSelectorDialog } from '../dialogs/equipment-selector-dialog';
import { TAG_CONFIGS } from '../dialogs/equipment-selector-dialog.mapper';
import { InterruptExecutionDialog } from '../dialogs/interrupt-execution-dialog';
import {
  ModifyPlanningDialog,
  type ModifyPlanningDialogData,
  type ModifyPlanningDialogResult,
} from '../dialogs/modify-planning-dialog';
import { PauseExecutionDialog } from '../dialogs/pause-execution-dialog';
import { type EquipmentSelectorDialogResult, type TrialPlanningMeasuresResponse } from '../models';
import type { PlacedWidget, Widget, WidgetPreferenceId } from '../models/execution-grid.models';
import type { ExecutionHeaderData, ExecutionShotInfo } from '../models/execution-page.models';
import { WidgetId } from '../models/widget-id.enum';
import {
  collectPlannedMeasureIds,
  resolvePlannedEquipmentTags,
  resolveVisibleEquipmentTags,
} from '../utils/equipment-planning.utils';
import { injectWidgets } from '../utils/inject-widgets';
import { resolveWidgetsByMeasurements } from '../utils/widget-measures-filter';
import { WidgetGridFullError, WidgetStateService } from './widget-state.service';

const EXECUTION_STATE_POLLING_MS = 5_000;
const CLIENT_REVIEW_ROLES: ReadonlyArray<Role> = [Role.INTAQALAB_TRIAL_CONSULTANT, Role.INTAQALAB_VIEWER];

@Service({ autoProvided: false })
export class ExecutionPageFacade {
  readonly #dialog = inject(MatDialog);
  readonly #store = inject(ExecutionStore);
  readonly #equipmentPlanning = inject(EquipmentPlanningService);
  readonly #planningPermissions = inject(PlanningPermissionsService);
  readonly #planningModificationsService = inject(PlanningModificationsService);
  readonly #planningTrialContext = inject(PlanningTrialContextService, { optional: true });
  readonly #widgetState = inject(WidgetStateService);
  readonly #translate = inject(TranslateService);
  readonly #toastr = inject(ToastrService);
  readonly #currentUser = injectCurrentUser();
  readonly #userRoles = injectCurrentUserRole();
  readonly #pageVisible = injectPageVisibility();
  readonly #fireTrialId = signal<string | null>(null);
  readonly #isSaving = signal(false);
  readonly #hasModifications = signal(false);
  readonly #hasPendingModifications = signal(false);

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

  readonly #allWidgets = injectWidgets();
  readonly #showAllWidgets = signal(false);
  readonly showAllWidgets = this.#showAllWidgets.asReadonly();
  readonly isAdmin = computed(() => this.#userRoles().includes(Role.INTAQALAB_ADMIN));
  readonly isWidgetCatalogLoading = computed(() => this.#equipmentPlanning.isLoading());
  readonly widgets = computed<Widget[]>(() => {
    if (this.#equipmentPlanning.isLoading()) {
      return [];
    }

    const userRoles = this.#userRoles();
    const roleVisibleTags = resolveVisibleEquipmentTags(userRoles, TAG_CONFIGS);
    const visibleTagIds = new Set(roleVisibleTags.map((tag) => tag.id));

    if (this.isAdmin() && this.#showAllWidgets()) {
      return this.#allWidgets.filter((widget) => widget.requiredMeasurementTags.some((tag) => visibleTagIds.has(tag)));
    }

    const trialMeasures = this.#equipmentPlanning.trialMeasuresResource.value();
    if (!trialMeasures) {
      return [];
    }

    const plannedIds = collectPlannedMeasureIds(trialMeasures as TrialPlanningMeasuresResponse);
    const activeTags = resolvePlannedEquipmentTags(plannedIds, this.#equipmentPlanning.catalog());
    const activeVisibleTagIds = new Set(activeTags.filter((tag) => visibleTagIds.has(tag)));
    return resolveWidgetsByMeasurements(this.#allWidgets, activeVisibleTagIds);
  });
  readonly hasUnsavedChanges = this.#widgetState.hasUnsavedChanges;
  readonly isSaving = this.#isSaving.asReadonly();
  readonly placedWidgets = this.#widgetState.placedWidgets;
  /**
   * `true` solo durante la carga inicial (antes del primer dato de estado).
   * El polling periódico NO activa esta señal — `#initialLoadDone` actúa como
   * latch de un solo disparo, evitando que el grid se destruya en cada ciclo.
   */
  readonly isLoading = computed(() => !this.#initialLoadDone());
  //readonly loadError = computed(() => this.#store.executionStateError() ?? this.#store.executionProgressError());
  readonly loadError = computed(() => false);

  /**
   * `true` si el usuario tiene al menos un tag de equipamiento visible según sus roles (funcional 4.3).
   * Sin permisos sobre ningún tag, el botón "Seleccionar equipos" se deshabilita.
   */
  readonly canSelectEquipment = computed(() => resolveVisibleEquipmentTags(this.#userRoles(), TAG_CONFIGS).length > 0);
  readonly isClientReviewer = computed(() => this.#userRoles().some((role) => CLIENT_REVIEW_ROLES.includes(role)));
  readonly isTrialEngineer = computed(
    () => this.#userRoles().includes(Role.INTAQALAB_TRIAL_ENGINEER) || this.#userRoles().includes(Role.INTAQALAB_ADMIN),
  );
  readonly hasPendingModifications = this.#hasPendingModifications.asReadonly();
  readonly canModifyPlanning = computed(() => {
    const status = (this.#store.fireTrialData()?.status ?? this.#store.fireTrial()?.status) as TrialStatus | undefined;
    if (!status) {
      return false;
    }
    return this.#planningPermissions.canModifyPlanningDuringExecution(status);
  });
  readonly canViewModifications = computed(
    () => this.isClientReviewer() || (this.isTrialEngineer() && this.#hasModifications()),
  );

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
    const history = progressSeries.map((serie, serieIndex) => {
      const planningSerie =
        planningSeries.find((item) => item.id === serie.seriesId) ?? planningSeries[serieIndex] ?? null;

      return {
        serie: planningSerie?.name?.trim() || `Serie ${serieIndex + 1}`,
        shots: serie.shots.map((shot, shotIndex) => {
          const planningShot =
            planningSerie?.shots?.find((item) => item.id === shot.shotId) ?? planningSerie?.shots?.[shotIndex];

          return {
            shot: `Disparo ${planningShot?.globalNumber ?? shotIndex + 1}`,
            timestamp: shot.updatedAt,
            status:
              serie.seriesId === activeSerieId && shot.shotId === activeShotId
                ? this.#store.isExecutionStarted()
                  ? 'EN_CURSO'
                  : 'PENDIENTE'
                : this.#mapShotStatus(shot.status),
          };
        }),
      };
    });

    if (
      activeSerie &&
      activeShot &&
      !progressSeries.some(
        (serie) => serie.seriesId === activeSerieId && serie.shots.some((shot) => shot.shotId === activeShotId),
      )
    ) {
      const activeSerieHistory = history.find((_, index) => progressSeries[index]?.seriesId === activeSerieId);
      const activeShotIndex = activeSerie.shots?.findIndex((shot) => shot.id === activeShotId) ?? -1;
      const activeShotHistory = {
        shot: `Disparo ${activeShot.globalNumber ?? activeShotIndex + 1}`,
        timestamp: '',
        status: this.#store.isExecutionStarted() ? 'EN_CURSO' : 'PENDIENTE',
      };

      if (activeSerieHistory) {
        activeSerieHistory.shots.push(activeShotHistory);
      } else {
        history.push({
          serie: activeSerie.name?.trim() || '—',
          shots: [activeShotHistory],
        });
      }
    }

    return {
      actual: {
        serie: activeSerie?.name?.trim() || '—',
        shot: activeShot ? `Disparo ${activeShot.globalNumber ?? activeShotIndex + 1}` : '—',
        percentage: String(totalShots > 0 ? Math.round((firedShots / totalShots) * 100) : 0),
      },
      all: history,
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
    this.#equipmentPlanning.load(fireTrialId);
    void this.#syncModificationsStatus(fireTrialId);
  }

  toggleShowAllWidgets(): void {
    this.#showAllWidgets.update((showAll) => !showAll);
  }

  persistPreferences(): void {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId || !this.#store.preferencesByUser()) {
      return;
    }

    this.#store.updatePreferencesByUser(
      fireTrialId,
      this.#currentUser.preferred_username,
      this.#widgetState.placedWidgets().map((widget) => this.#toPreferenceId(widget)),
    );
  }

  async startExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }
    await this.#runTransition(() => this.#store.startExecution(fireTrialId));
  }

  async resumeExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }
    await this.#runTransition(() => this.#store.resumeExecution(fireTrialId));
  }

  async finishExecution(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }
    await this.#runTransition(() => this.#store.finishExecution(fireTrialId));
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
          data: { trialName: this.executionData().code },
        })
        .afterClosed(),
    );

    if (!result || result.action === 'back') {
      return;
    }
    await this.#runTransition(() => this.#store.pauseExecution(fireTrialId));
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

    if (!result || result.action !== 'interrupt') {
      return;
    }
    await this.#runTransition(() => this.#store.interruptExecution(fireTrialId, result.reason));
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
    await this.#runTransition(() => this.#store.cancelExecution(fireTrialId, result.reason));
  }

  async openModifyPlanning(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId || !this.canModifyPlanning()) {
      return;
    }

    const hasPending = await this.#syncModificationsStatus(fireTrialId);
    if (hasPending) {
      const blockedResult = await firstValueFrom(
        this.#dialog
          .open<PlanningModificationBlockedDialog, undefined, PlanningModificationBlockedDialogResult>(
            PlanningModificationBlockedDialog,
            {
              width: '520px',
            },
          )
          .afterClosed(),
      );
      if (blockedResult?.action === 'viewPending') {
        await this.openClientModifications();
      }
      return;
    }

    const result = await firstValueFrom(
      this.#dialog
        .open<ModifyPlanningDialog, ModifyPlanningDialogData, ModifyPlanningDialogResult>(ModifyPlanningDialog, {
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          panelClass: 'fullscreen-dialog',
          disableClose: true,
          data: {
            fireTrialId,
            centerId: this.#resolveCenterId(),
            fireTrial: this.#store.fireTrial(),
            executedShotIds: this.#resolveExecutedShotIds(),
          },
        })
        .afterClosed(),
    );

    if (!result) {
      return;
    }

    if (result.hasPendingChanges) {
      this.#hasPendingModifications.set(true);
      this.#hasModifications.set(true);
    }

    if (result.hasAcceptedChanges) {
      this.#hasModifications.set(true);
      this.#refreshTrialAndPlanningData(fireTrialId);
    }

    if (result.saved) {
      void this.#syncModificationsStatus(fireTrialId);
    }
  }

  async openClientModifications(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId) {
      return;
    }

    const result = await firstValueFrom(
      this.#dialog
        .open<ClientModificationsDialog, ClientModificationsDialogData, ClientModificationsDialogResult>(
          ClientModificationsDialog,
          {
            width: '960px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: {
              fireTrialId,
              centerId: this.#resolveCenterId(),
              allowReview: this.isClientReviewer(),
            },
          },
        )
        .afterClosed(),
    );

    if (!result) {
      return;
    }

    if (result.hasDecisions) {
      void this.#syncModificationsStatus(fireTrialId);
    }

    if (result.hasAcceptedChanges) {
      this.#refreshTrialAndPlanningData(fireTrialId);
    }
  }

  #runTransition(transition: () => Promise<void>): Promise<void> {
    return transition().catch(() => undefined);
  }

  async openEquipmentSelector(): Promise<void> {
    const fireTrialId = this.#fireTrialId();
    if (!fireTrialId || !this.canSelectEquipment()) {
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

  addWidget(widgetId: string): boolean {
    const widget = this.widgets().find((item) => item.id === widgetId);
    if (!widget) {
      return false;
    }

    try {
      this.#widgetState.addWidget(
        widget.widgetId,
        widget.defaultWidth,
        undefined,
        widget.techProfile,
        widget.defaultHeight ?? 1,
      );
      return true;
    } catch (error) {
      if (!(error instanceof WidgetGridFullError)) {
        throw error;
      }

      this.#toastr.warning(
        this.#translate.instant('TRIAL_EXECUTION.WIDGET_NO_SPACE_MESSAGE'),
        this.#translate.instant('TRIAL_EXECUTION.WIDGET_NO_SPACE_TITLE'),
        { timeOut: 5000, progressBar: true, closeButton: true },
      );
      return false;
    }
  }

  async saveAllChanges(): Promise<void> {
    this.#isSaving.set(true);
    try {
      await this.#widgetState.saveAllDirtyForms();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.#toastr.warning(this.#translate.instant('TRIAL_EXECUTION.ERRORS.SHOT_SAVE_CONFLICT'), undefined, {
          timeOut: 5000,
          progressBar: true,
          closeButton: true,
        });
        return;
      }
      throw error;
    } finally {
      this.#isSaving.set(false);
    }
  }

  #resolveCenterId(): string | undefined {
    return this.#planningTrialContext?.context()?.centerId ?? undefined;
  }

  #resolveExecutedShotIds(): string[] {
    const progress = this.#store.executionProgress();
    return (progress?.series ?? []).flatMap((serie) =>
      serie.shots.filter((shot) => shot.status === 'FIRED').map((shot) => shot.shotId),
    );
  }

  async #syncModificationsStatus(fireTrialId: string): Promise<boolean> {
    try {
      const modifications = await this.#planningModificationsService.fetchModifications(
        fireTrialId,
        this.#resolveCenterId(),
      );
      const hasPending = modifications.some((mod) => mod.status === 'PENDIENTE');
      this.#hasModifications.set(modifications.length > 0);
      this.#hasPendingModifications.set(hasPending);
      return hasPending;
    } catch {
      return this.#hasPendingModifications();
    }
  }

  #refreshTrialAndPlanningData(fireTrialId: string): void {
    this.#store.setFireTrialId(fireTrialId);
    this.#equipmentPlanning.load(fireTrialId);
  }

  #restoreWidgetLayout(layout: WidgetPreferenceId[]): void {
    this.#widgetState.clearWidgets();
    for (const widgetId of layout) {
      const widget =
        this.#allWidgets.find((item) => item.id === widgetId) ??
        this.#allWidgets.find((item) => item.widgetId === widgetId);
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

  #toPreferenceId(placedWidget: PlacedWidget): WidgetPreferenceId {
    if (placedWidget.type !== WidgetId.EXECUTION_PREP_TECH || !placedWidget.techProfile) {
      return placedWidget.type;
    }

    return `prep-tech-${placedWidget.techProfile}`;
  }

  #mapShotStatus(status: string): string {
    switch (status) {
      case 'FIRED':
        return 'EJECUTADA';
      case 'ACTIVE':
        return 'EN_CURSO';
      case 'PENDING':
      default:
        return 'PENDIENTE';
    }
  }

  #mapStatusLabel(status: string | undefined): string {
    const statusLabels: Record<string, string> = {
      PLANNED: 'Planificada',
      STARTED: 'Iniciada',
      IN_PROGRESS: 'En curso',
      PAUSED: 'Pausada',
      INTERRUPTED: 'Interrumpida',
      EXECUTED: 'Ejecutada',
      FINALIZING: 'Finalizando',
      CLOSED: 'Cerrada',
      CANCELLED: 'Cancelada',
    };
    return status ? (statusLabels[status] ?? status) : '—';
  }
}
