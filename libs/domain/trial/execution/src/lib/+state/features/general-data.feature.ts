import { computed, effect, inject } from '@angular/core';
import { TrialsDataService } from '@intaqalab/data-access';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { safeResourceValue } from '@intaqalab/utils';
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
  activeSerieId: null,
  activeShotId: null,
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
      fireTrialData: computed(() => safeResourceValue(trialsService.byIdResource)),

      isLoadingFireTrial: computed(() => trialsService.byIdResource.isLoading()),
      // Execution State
      // Comparador por updatedAt: aunque httpResource siempre devuelve un objeto
      // nuevo, el computed solo propaga el cambio cuando updatedAt difiere,
      // evitando re-renders en widgets que lean este computed durante el polling.
      executionState: computed(() => safeResourceValue(executionService.executionStateResource), {
        equal: (a, b) => (a?.updatedAt ?? null) === (b?.updatedAt ?? null),
      }),

      isLoadingExecutionState: computed(() => executionService.executionStateResource.isLoading()),

      executionStateError: computed(() => executionService.executionStateResource.error()),

      // Execution Progress
      executionProgress: computed(() => safeResourceValue(executionService.executionProgressResource)),

      isLoadingExecutionProgress: computed(() => executionService.executionProgressResource.isLoading()),

      executionProgressError: computed(() => executionService.executionProgressResource.error()),

      // Security Countdown State
      securityCountdown: computed(() => safeResourceValue(executionService.securityCountdownResource)),

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

      finishResponse: computed(() => safeResourceValue(executionService.finishResource)),

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
      planning: computed(() => safeResourceValue(executionService.planningResource)),

      isLoadingPlanning: computed(() => executionService.planningResource.isLoading()),

      planningError: computed(() => executionService.planningResource.error()),

      isUpdatingPlanning: computed(() => executionService.updatePlanningResource.isLoading()),

      planningState: computed(() => safeResourceValue(executionService.planningStateResource)),

      isLoadingPlanningState: computed(() => executionService.planningStateResource.isLoading()),

      isApprovingPlanning: computed(() => executionService.approvePlanningResource.isLoading()),

      // Planning Series
      planningSeries: computed(() => safeResourceValue(executionService.planningSeriesResource)),

      isLoadingPlanningSeries: computed(() => executionService.planningSeriesResource.isLoading()),

      planningConditions: computed(() => safeResourceValue(executionService.planningConditionsResource)),

      isLoadingPlanningConditions: computed(() => executionService.planningConditionsResource.isLoading()),

      // Widget Preferences
      preferencesByRole: computed(() => safeResourceValue(executionService.preferencesByRoleResource)),

      isLoadingPreferencesByRole: computed(() => executionService.preferencesByRoleResource.isLoading()),

      isUpdatingPreferencesByRole: computed(() => executionService.updatePreferencesByRoleResource.isLoading()),

      preferencesByUser: computed(() => safeResourceValue(executionService.preferencesByUserResource)),

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
        this.loadProfilesReadiness(fireTrialId);
        this.loadPlanningSeries(fireTrialId);
        this.loadPlanningConditions(fireTrialId);
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
          this.loadProfilesReadiness(fireTrialId);
          this.loadPlanningSeries(fireTrialId);
          this.loadPlanningConditions(fireTrialId);
        }
      },

      loadExecutionState(fireTrialId: string): void {
        executionService.getExecutionState(fireTrialId);
      },

      /**
       * Actualización optimista de la selección activa de serie/disparo.
       * Permite que el header reaccione de inmediato (sin esperar POST + GET).
       * El GET /state confirmará o corregirá el valor en el siguiente ciclo.
       */
      setOptimisticActiveShot(serieId: string | null, shotId: string | null): void {
        patchState(store, { activeSerieId: serieId, activeShotId: shotId });
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

      loadProfilesReadiness(fireTrialId: string): void {
        executionService.getProfilesReadiness(fireTrialId);
      },

      loadPlanningSeries(fireTrialId: string): void {
        if (typeof executionService?.getPlanningSeries === 'function') {
          executionService.getPlanningSeries(fireTrialId);
        }
      },

      loadPlanningConditions(fireTrialId: string): void {
        if (typeof executionService?.getPlanningConditions === 'function') {
          executionService.getPlanningConditions(fireTrialId);
        }
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
    })),
    withHooks({
      onInit(store) {
        const trialsService = inject(TrialsDataService);
        const executionService = inject(ExecutionService);

        // Sincroniza FireTrial del resource → estado del store para isTrialReadOnly y planning compat
        effect(() => {
          const trial = safeResourceValue(trialsService.byIdResource);
          if (trial) {
            patchState(store, { fireTrial: mapFireTrialToForm(trial) });
          }
        });

        // Sincroniza selección activa de serie/disparo desde estado de ejecución API.
        // Guard de updatedAt: solo aplica patchState si el servidor devuelve un
        // estado más reciente, evitando re-renders del grid en cada ciclo de polling.
        let lastProcessedUpdatedAt: string | null = null;
        effect(() => {
          const state = safeResourceValue(executionService.executionStateResource);
          if (!state) {
            return;
          }

          // Sin cambio en updatedAt → los datos son idénticos, no re-renderizar.
          if (state.updatedAt === lastProcessedUpdatedAt) {
            return;
          }
          lastProcessedUpdatedAt = state.updatedAt;

          const trialId = store.fireTrialId();
          if (trialId) {
            store.loadExecutionProgress(trialId);
          }

          const activeShotId = state.activeShotId ?? state.activeShootId ?? null;
          if (!state.activeSeriesId || !activeShotId) {
            return;
          }

          patchState(store, {
            activeSerieId: state.activeSeriesId,
            activeShotId,
          });
        });

        // Refresca estado tras cada transición de ciclo de vida de la prueba
        const lifecycleResources = [
          executionService.startResource,
          executionService.pauseResource,
          executionService.resumeResource,
          executionService.interruptResource,
          executionService.cancelResource,
          executionService.finishResource,
        ];
        for (const resource of lifecycleResources) {
          effect(() => {
            if (typeof resource?.status === 'function' && resource.status() === 'resolved') {
              const trialId = store.fireTrialId();
              if (trialId) {
                store.loadExecutionState(trialId);
                store.loadExecutionProgress(trialId);
                trialsService.loadById(trialId);
              }
            }
          });
        }

        const fireTrialId = store.fireTrialId();
        if (fireTrialId) {
          trialsService.loadById(fireTrialId);
          store.loadExecutionState(fireTrialId);
          store.loadExecutionProgress(fireTrialId);
          store.loadSecurityCountdown(fireTrialId);
          store.loadPlanning(fireTrialId);
          store.loadPlanningState(fireTrialId);
          store.loadProfilesReadiness(fireTrialId);
          store.loadPlanningSeries(fireTrialId);
          store.loadPlanningConditions(fireTrialId);
        }
      },
    }),
  );
}
