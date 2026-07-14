import { computed, effect, inject } from '@angular/core';
import { TrialsDataService } from '@intaqalab/data-access';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { patchState, signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { WidgetId } from '../../execution/models';
import { ExecutionService } from '../../services/execution.service';

interface GeneralDataSlice {
  fireTrialId: string | null;
  fireTrial: TrialCreateModifyForm | null;
  activeSerieId: string | null;
  activeShotId: string | null;
}

const initialState: GeneralDataSlice = {
  fireTrialId: null,
  fireTrial: null,
  activeSerieId: 'funcionamiento-1',
  activeShotId: 'shot-3',
};

/** Mapea FireTrial (modelo API) al formato TrialCreateModifyForm del store. */
function mapFireTrialToForm(trial: FireTrial): TrialCreateModifyForm {
  return {
    code: trial.trialNumber,
    description: trial.description ?? '',
    client: trial.client?.id ?? '',
    clientReference: trial.clientReference ?? '',
    type: trial.fireTrialType?.id ?? '',
    status: trial.status as TrialStatus,
    associatedTrial: trial.associatedTrial?.id ?? '',
    associatedTrialView: trial.associatedTrial?.trialNumber ?? '',
    hasAssociatedTrial: !!trial.associatedTrial,
    linkedTrial: trial.linkedTrial?.id ?? '',
    linkedTrialView: trial.linkedTrial?.trialNumber ?? '',
    hasLinkedTrial: !!trial.linkedTrial,
    requestedDate: trial.requestedDate ?? '',
    observations: trial.observations ?? '',
  };
}

export function withGeneralData() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService), trialsService = inject(TrialsDataService)) => ({
      // Fire Trial raw (para display: trialNumber, client.name, etc.)
      fireTrialData: computed(() => trialsService.byIdResource.value()),

      isLoadingFireTrial: computed(() => trialsService.byIdResource.isLoading()),
      // Execution State
      executionState: computed(() => executionService.executionStateResource.value()),

      isLoadingExecutionState: computed(() => executionService.executionStateResource.isLoading()),

      executionStateError: computed(() => executionService.executionStateResource.error()),

      // Execution Progress
      executionProgress: computed(() => executionService.executionProgressResource.value()),

      isLoadingExecutionProgress: computed(() => executionService.executionProgressResource.isLoading()),

      executionProgressError: computed(() => executionService.executionProgressResource.error()),

      // Security Countdown State
      securityCountdown: computed(() => executionService.securityCountdownResource.value()),

      isLoadingSecurityCountdown: computed(() => executionService.securityCountdownResource.isLoading()),

      securityCountdownError: computed(() => executionService.securityCountdownResource.error()),

      isUpdatingSecurityCountdown: computed(() => executionService.updateSecurityCountdownResource.isLoading()),

      // Execution Transitions
      isStarting: computed(() => executionService.startResource.isLoading()),

      isPausing: computed(() => executionService.pauseResource.isLoading()),

      isInterrupting: computed(() => executionService.interruptResource.isLoading()),

      isResuming: computed(() => executionService.resumeResource.isLoading()),

      isCanceling: computed(() => executionService.cancelResource.isLoading()),

      isFinishing: computed(() => executionService.finishResource.isLoading()),

      finishResponse: computed(() => executionService.finishResource.value()),

      /**
       * Indica si la prueba está en un estado de solo lectura
       * (Ejecutada, Finalizando, Cerrada o Cancelada).
       * Cuando es `true`, todos los widgets de entrada deben ser no editables.
       */
      isTrialReadOnly: computed(() => {
        const status = store.fireTrial()?.status;
        const READONLY_STATUSES: TrialStatus[] = [
          TrialStatus.EXECUTED,
          TrialStatus.FINALIZING,
          TrialStatus.CLOSED,
          TrialStatus.CANCELLED,
        ];
        return status !== null && READONLY_STATUSES.includes(status as TrialStatus);
      }),

      // Execution transitions status
      pauseExecutionStatus: computed(() => executionService.pauseResource.status()),

      interruptExecutionStatus: computed(() => executionService.interruptResource.status()),

      resumingExecutionStatus: computed(() => executionService.resumeResource.status()),

      cancelingExecutionStatus: computed(() => executionService.cancelResource.status()),

      finishingExecutionStatus: computed(() => executionService.finishResource.status()),

      // Execution Planning
      planning: computed(() => executionService.planningResource.value()),

      isLoadingPlanning: computed(() => executionService.planningResource.isLoading()),

      planningError: computed(() => executionService.planningResource.error()),

      isUpdatingPlanning: computed(() => executionService.updatePlanningResource.isLoading()),

      planningState: computed(() => executionService.planningStateResource.value()),

      isLoadingPlanningState: computed(() => executionService.planningStateResource.isLoading()),

      isApprovingPlanning: computed(() => executionService.approvePlanningResource.isLoading()),

      // Widget Preferences
      preferencesByRole: computed(() => executionService.preferencesByRoleResource.value()),

      isLoadingPreferencesByRole: computed(() => executionService.preferencesByRoleResource.isLoading()),

      isUpdatingPreferencesByRole: computed(() => executionService.updatePreferencesByRoleResource.isLoading()),

      preferencesByUser: computed(() => executionService.preferencesByUserResource.value()),

      isLoadingPreferencesByUser: computed(() => executionService.preferencesByUserResource.isLoading()),

      isUpdatingPreferencesByUser: computed(() => executionService.updatePreferencesByUserResource.isLoading()),
    })),
    withMethods((store, executionService = inject(ExecutionService), trialsService = inject(TrialsDataService)) => ({
      setFireTrialData(fireTrialId: string, fireTrial: TrialCreateModifyForm): void {
        patchState(store, { fireTrialId, fireTrial });
        this.loadExecutionState(fireTrialId);
        this.loadExecutionProgress(fireTrialId);
        this.loadSecurityCountdown(fireTrialId);
        this.loadPlanning(fireTrialId);
        this.loadPlanningState(fireTrialId);
      },

      setFireTrialId(fireTrialId: string | null): void {
        patchState(store, { fireTrialId });
        if (fireTrialId) {
          trialsService.loadById(fireTrialId);
          this.loadExecutionState(fireTrialId);
          this.loadExecutionProgress(fireTrialId);
          this.loadSecurityCountdown(fireTrialId);
          this.loadPlanning(fireTrialId);
          this.loadPlanningState(fireTrialId);
        }
      },

      loadExecutionState(fireTrialId: string): void {
        executionService.getExecutionState(fireTrialId);
      },

      loadExecutionProgress(fireTrialId: string): void {
        executionService.getExecutionProgress(fireTrialId);
      },

      loadSecurityCountdown(fireTrialId: string): void {
        executionService.getSecurityCountdownState(fireTrialId);
      },

      updateSecurityCountdown(
        fireTrialId: string,
        body: Parameters<typeof executionService.updateSecurityCountdown>[1],
      ): void {
        executionService.updateSecurityCountdown(fireTrialId, body);
      },

      startExecution(fireTrialId: string): void {
        executionService.startExecution(fireTrialId);
      },

      pauseExecution(fireTrialId: string): void {
        executionService.pauseExecution(fireTrialId);
      },

      interruptExecution(fireTrialId: string, reason: string): void {
        executionService.interruptExecution(fireTrialId, reason);
      },

      resumeExecution(fireTrialId: string): void {
        executionService.resumeExecution(fireTrialId);
      },

      cancelExecution(fireTrialId: string, reason: string): void {
        executionService.cancelExecution(fireTrialId, reason);
      },

      finishExecution(fireTrialId: string): void {
        executionService.finishExecution(fireTrialId);
      },

      loadPlanning(fireTrialId: string): void {
        executionService.getExecutionPlanning(fireTrialId);
      },

      updatePlanning(fireTrialId: string, body: Parameters<typeof executionService.updateExecutionPlanning>[1]): void {
        executionService.updateExecutionPlanning(fireTrialId, body);
      },

      loadPlanningState(fireTrialId: string): void {
        executionService.getExecutionPlanningState(fireTrialId);
      },

      approvePlanning(
        fireTrialId: string,
        body: Parameters<typeof executionService.approveExecutionPlanning>[1],
      ): void {
        executionService.approveExecutionPlanning(fireTrialId, body);
      },

      loadPreferencesByRole(fireTrialId: string, roleName: string): void {
        executionService.getPreferencesByRole(fireTrialId, roleName);
      },

      updatePreferencesByRole(fireTrialId: string, roleName: string, widgetsLayout: WidgetId[]): void {
        executionService.updatePreferencesByRole(fireTrialId, roleName, widgetsLayout);
      },

      loadPreferencesByUser(fireTrialId: string, username: string): void {
        executionService.getPreferencesByUser(fireTrialId, username);
      },

      updatePreferencesByUser(fireTrialId: string, username: string, widgetsLayout: WidgetId[]): void {
        executionService.updatePreferencesByUser(fireTrialId, username, widgetsLayout);
      },

      setActiveSerie(serieId: string): void {
        patchState(store, { activeSerieId: serieId });
      },

      setActiveShot(shotId: string): void {
        patchState(store, { activeShotId: shotId });
      },
    })),
    withHooks({
      onInit(store) {
        const trialsService = inject(TrialsDataService);

        // Sincroniza FireTrial del resource → estado del store para isTrialReadOnly y planning compat
        effect(() => {
          const trial = trialsService.byIdResource.value();
          if (trial) {
            patchState(store, { fireTrial: mapFireTrialToForm(trial) });
          }
        });

        const fireTrialId = store.fireTrialId();
        if (fireTrialId) {
          trialsService.loadById(fireTrialId);
          store.loadExecutionState(fireTrialId);
          store.loadExecutionProgress(fireTrialId);
          store.loadSecurityCountdown(fireTrialId);
          store.loadPlanning(fireTrialId);
          store.loadPlanningState(fireTrialId);
        }
      },
    }),
  );
}
