import { computed, effect, inject, untracked } from '@angular/core';
import { TrialsDataService } from '@intaqalab/data-access';
import { PlanningConditionsService, PlanningSeriesService } from '@intaqalab/data-access-planning';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { WidgetPreferenceId } from '../../execution/models';
import { WidgetId } from '../../execution/models';
import { ExecutionService } from '../../services/execution.service';
import { resolveTrialExecutionCapabilities } from '../policies/trial-execution-policy';

export const DEFAULT_AUTONOMOUS_WIDGETS: readonly WidgetId[] = [WidgetId.SEGUIMIENTO];

interface GeneralDataSlice {
  fireTrialId: string | null;
  fireTrial: TrialCreateModifyForm | null;
  activeSerieId: string | null;
  activeShotId: string | null;
  autonomousWidgets: Set<WidgetId>;
}

const initialState: GeneralDataSlice = {
  fireTrialId: null,
  fireTrial: null,
  activeSerieId: null,
  activeShotId: null,
  autonomousWidgets: new Set<WidgetId>(DEFAULT_AUTONOMOUS_WIDGETS),
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
    withComputed(
      (
        store,
        executionService = inject(ExecutionService),
        trialsService = inject(TrialsDataService),
        seriesService = inject(PlanningSeriesService),
        conditionsService = inject(PlanningConditionsService),
      ) => ({
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

        /**
         * Indica si la prueba está en un estado de solo lectura
         * (Ejecutada, Finalizando, Cerrada o Cancelada).
         * Cuando es `true`, todos los widgets de entrada deben ser no editables.
         */
        /** Capacidades de edición derivadas del estado de la prueba y de la ejecución activa. */
        executionCapabilities: computed(() =>
          resolveTrialExecutionCapabilities(store.fireTrial()?.status, {
            executionActive: !!store.activeSerieId() && !!store.activeShotId(),
          }),
        ),

        isTrialReadOnly: computed(
          () =>
            resolveTrialExecutionCapabilities(store.fireTrial()?.status, {
              executionActive: !!store.activeSerieId() && !!store.activeShotId(),
            }).isReadOnly,
        ),

        /**
         * Indica si la ejecución del ensayo ha sido iniciada.
         * Devuelve `false` si el ensayo está en estado PLANNED, PREPARED o UNDER_REVIEW,
         * o si el estado de ejecución reportado por la API es 'PLANNED'.
         */
        isExecutionStarted: computed(() => {
          const execState = safeResourceValue(executionService.executionStateResource);
          if (execState?.status) {
            return execState.status !== 'PLANNED';
          }
          const trialStatus = store.fireTrial()?.status ?? safeResourceValue(trialsService.byIdResource)?.status;
          if (trialStatus) {
            const notStartedStatuses: TrialStatus[] = [
              TrialStatus.PLANNED,
              TrialStatus.PREPARED,
              TrialStatus.UNDER_REVIEW,
            ];
            return !notStartedStatuses.includes(trialStatus as TrialStatus);
          }
          return true;
        }),

        // Execution Planning
        isUpdatingPlanning: computed(() => executionService.updatePlanningResource.isLoading()),

        isApprovingPlanning: computed(() => executionService.approvePlanningResource.isLoading()),

        // Planning Series (capa data-access de planning)
        planningSeries: computed(() => safeResourceValue(seriesService.seriesResource)),

        isLoadingPlanningSeries: computed(() => seriesService.seriesResource.isLoading()),

        planningConditions: computed(() => safeResourceValue(conditionsService.conditionsResource)),

        isLoadingPlanningConditions: computed(() => conditionsService.conditionsResource.isLoading()),

        // Widget Preferences
        preferencesByRole: computed(() => safeResourceValue(executionService.preferencesByRoleResource)),

        isLoadingPreferencesByRole: computed(() => executionService.preferencesByRoleResource.isLoading()),

        isUpdatingPreferencesByRole: computed(() => executionService.updatePreferencesByRoleResource.isLoading()),

        preferencesByUser: computed(() => safeResourceValue(executionService.preferencesByUserResource)),

        isLoadingPreferencesByUser: computed(() => executionService.preferencesByUserResource.isLoading()),

        isUpdatingPreferencesByUser: computed(() => executionService.updatePreferencesByUserResource.isLoading()),
      }),
    ),
    withMethods(
      (
        store,
        executionService = inject(ExecutionService),
        trialsService = inject(TrialsDataService),
        seriesService = inject(PlanningSeriesService),
        conditionsService = inject(PlanningConditionsService),
      ) => ({
        setFireTrialData(fireTrialId: string, fireTrial: TrialCreateModifyForm): void {
          patchState(store, { fireTrialId, fireTrial });
          this.loadExecutionState(fireTrialId);
          this.loadExecutionProgress(fireTrialId);
          executionService.getProfilesReadiness(fireTrialId);
          this.loadPlanningSeries(fireTrialId);
          this.loadPlanningConditions(fireTrialId);
        },

        setFireTrialId(fireTrialId: string | null): void {
          patchState(store, { fireTrialId });
          if (fireTrialId) {
            trialsService.loadById(fireTrialId);
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            executionService.getProfilesReadiness(fireTrialId);
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
        ): Promise<void> {
          return executionService.updateSecurityCountdown(fireTrialId, body).then(() => {
            executionService.getSecurityCountdownState(fireTrialId);
          });
        },

        startExecution(fireTrialId: string): Promise<void> {
          return executionService.startExecution(fireTrialId).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        pauseExecution(fireTrialId: string): Promise<void> {
          return executionService.pauseExecution(fireTrialId).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        interruptExecution(fireTrialId: string, reason: string): Promise<void> {
          return executionService.interruptExecution(fireTrialId, reason).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        resumeExecution(fireTrialId: string): Promise<void> {
          return executionService.resumeExecution(fireTrialId).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        cancelExecution(fireTrialId: string, reason: string): Promise<void> {
          return executionService.cancelExecution(fireTrialId, reason).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        finishExecution(fireTrialId: string): Promise<void> {
          return executionService.finishExecution(fireTrialId).then(() => {
            this.loadExecutionState(fireTrialId);
            this.loadExecutionProgress(fireTrialId);
            trialsService.loadById(fireTrialId);
          });
        },

        updatePlanning(
          fireTrialId: string,
          body: Parameters<typeof executionService.updateExecutionPlanning>[1],
        ): void {
          executionService.updateExecutionPlanning(fireTrialId, body);
        },

        approvePlanning(
          fireTrialId: string,
          body: Parameters<typeof executionService.approveExecutionPlanning>[1],
        ): void {
          executionService.approveExecutionPlanning(fireTrialId, body);
        },

        loadPlanningSeries(fireTrialId: string): void {
          seriesService.load(fireTrialId);
        },

        loadPlanningConditions(fireTrialId: string): void {
          conditionsService.load(fireTrialId);
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

        updatePreferencesByUser(fireTrialId: string, username: string, widgetsLayout: WidgetPreferenceId[]): void {
          executionService.updatePreferencesByUser(fireTrialId, username, widgetsLayout);
        },

        registerAutonomousWidget(widgetId: WidgetId): void {
          const current = store.autonomousWidgets();
          if (current.has(widgetId)) {
            return;
          }
          const next = new Set(current);
          next.add(widgetId);
          patchState(store, { autonomousWidgets: next });
        },

        unregisterAutonomousWidget(widgetId: WidgetId): void {
          const current = store.autonomousWidgets();
          if (!current.has(widgetId)) {
            return;
          }
          const next = new Set(current);
          next.delete(widgetId);
          patchState(store, { autonomousWidgets: next });
        },

        isWidgetAutonomous(widgetId: WidgetId): boolean {
          return store.autonomousWidgets().has(widgetId);
        },
      }),
    ),
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
            if (!untracked(() => store.isWidgetAutonomous(WidgetId.SEGUIMIENTO))) {
              executionService.getShotMeasurements(trialId);
            }
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

        const fireTrialId = store.fireTrialId();
        if (fireTrialId) {
          trialsService.loadById(fireTrialId);
          store.loadExecutionState(fireTrialId);
          store.loadExecutionProgress(fireTrialId);
          executionService.getProfilesReadiness(fireTrialId);
          store.loadPlanningSeries(fireTrialId);
          store.loadPlanningConditions(fireTrialId);
        }
      },
    }),
  );
}
