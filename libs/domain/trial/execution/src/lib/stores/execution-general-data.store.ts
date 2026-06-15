import { computed, inject } from '@angular/core';
import type { TrialCreateModifyForm } from '@intaqalab/models';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { WidgetId } from '../execution/models';
import { ExecutionService } from '../services/execution.service';

interface ExecutionState {
  fireTrialId: string | null;
  fireTrial: TrialCreateModifyForm | null;
}

const initialState: ExecutionState = {
  fireTrialId: null,
  fireTrial: null,
};

export const ExecutionGeneralDataStore = signalStore(
  withState(initialState),

  withComputed((store, executionService = inject(ExecutionService)) => ({
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

    // Security Countdown Update
    isUpdatingSecurityCountdown: computed(() => executionService.updateSecurityCountdownResource.isLoading()),

    // Execution Transitions
    isStarting: computed(() => executionService.startResource.isLoading()),

    isPausing: computed(() => executionService.pauseResource.isLoading()),

    isInterrupting: computed(() => executionService.interruptResource.isLoading()),

    isResuming: computed(() => executionService.resumeResource.isLoading()),

    isCanceling: computed(() => executionService.cancelResource.isLoading()),

    isFinishing: computed(() => executionService.finishResource.isLoading()),

    finishResponse: computed(() => executionService.finishResource.value()),

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

  withMethods((store, executionService = inject(ExecutionService)) => ({
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

    approvePlanning(fireTrialId: string, body: Parameters<typeof executionService.approveExecutionPlanning>[1]): void {
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
  })),

  withHooks({
    onInit(store) {
      const fireTrialId = store.fireTrialId();
      if (fireTrialId) {
        store.loadExecutionState(fireTrialId);
        store.loadExecutionProgress(fireTrialId);
        store.loadSecurityCountdown(fireTrialId);
        store.loadPlanning(fireTrialId);
        store.loadPlanningState(fireTrialId);
      }
    },
  }),
);
