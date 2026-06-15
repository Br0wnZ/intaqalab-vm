import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { WidgetId } from '../execution/models';

// ============= Types =============

export type ExecutionStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'INTERRUPTED'
  | 'PAUSED'
  | 'CANCELED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

export interface ExecutionStateResponse {
  status: ExecutionStatus;
  activeSeriesId: string | null;
  activeShootId: string | null;
  updatedAt: string;
}

export interface ExecutionSeriesProgress {
  seriesId: string;
  sequenceNumber: number;
  shots: ExecutionShotProgress[];
}

export interface ExecutionShotProgress {
  shotId: string;
  sequenceNumber: number;
  status: 'PENDING' | 'ACTIVE' | 'FIRED';
  updatedAt: string;
}

export interface ExecutionProgressResponse {
  series: ExecutionSeriesProgress[];
}

export type SecurityCountdownStatus = 'INACTIVE' | 'ACTIVE' | 'PAUSED';

export interface SecurityCountdownResponse {
  status: SecurityCountdownStatus;
  targetEndTime: string | null;
  remainingSeconds: number | null;
}

export type SecurityCountdownAction = 'START' | 'PAUSE' | 'RESUME' | 'UPDATE_DURATION';

export interface SecurityCountdownRequest {
  action: SecurityCountdownAction;
  durationSeconds?: number;
}

export interface TransitionWithReasonRequest {
  reason: string;
}

export interface ExecutionFinishResponse {
  finishedAt: string;
}

export interface PlanningSpecimen {
  specimenId: string;
  batch?: string;
}

export interface PlanningUser {
  id: string;
  name: string;
}

export interface DateControlParameters {
  maxEmissionDates: number;
  percentageTechnicalUnits: number;
  percentageEndTrial: number;
  daysSignReport: number;
  reportDeadlineDate: string;
}

export interface PlanningResponse {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUser: PlanningUser;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningRequest {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUserId: string;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningStateResponse {
  version: number;
  isApprovedByClient: boolean;
  updatedAt: string;
}

export interface PlanningApprovalRequest {
  approved: boolean;
  comments: string | null;
}

// ============= Params Signals =============

interface ExecutionParams {
  fireTrialId: FireTrial['id'];
  _t: number;
}

interface ExecutionWithReasonParams extends ExecutionParams {
  reason: string;
}

interface SecurityCountdownParams extends ExecutionParams {
  body: SecurityCountdownRequest;
}

interface ExecutionPlanningParams extends ExecutionParams {
  body: PlanningRequest | PlanningApprovalRequest;
}

export type ExecutionTechnicalProfile =
  | 'VELOCITIES'
  | 'PRESSURES'
  | 'VIDEO'
  | 'TRAJECTOGRAPHY'
  | 'MUNITIONS'
  | 'ARMAMENT';

export type ExecutionWidgetLayout = {
  widgetsLayout: string[];
};

export type SeriesReadinessItem = {
  seriesId: string;
  isReady: boolean;
  observations?: string;
};

export type ProfileReadinessItem = {
  profile: ExecutionTechnicalProfile;
  seriesReadiness: SeriesReadinessItem[];
};

export type ProfilesReadinessResponse = {
  profilesReadiness: ProfileReadinessItem[];
};

export type ProfileReadinessRequest = {
  seriesReadiness: SeriesReadinessItem[];
};

interface PreferencesParams extends ExecutionParams {
  roleName?: string;
  username?: string;
  widgetsLayout?: WidgetId[];
}

interface ReadinessProfileParams extends ExecutionParams {
  profile: ExecutionTechnicalProfile;
  body: ProfileReadinessRequest;
}

// ============= Service =============

@Injectable({
  providedIn: 'root',
})
export class ExecutionService {
  readonly #executionUrl = injectExecutionEndpoint();

  // ── EXECUTION STATE ENDPOINTS ───────────────────────────────────────────

  readonly #getExecutionStateParams = signal<ExecutionParams | null>(null);

  readonly executionStateResource = httpResource<ExecutionStateResponse>(() => {
    const params = this.#getExecutionStateParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/state`,
      method: 'GET',
    };
  });

  getExecutionState(fireTrialId: FireTrial['id']): void {
    this.#getExecutionStateParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION PROGRESS ───────────────────────────────────────────────────

  readonly #getExecutionProgressParams = signal<ExecutionParams | null>(null);

  readonly executionProgressResource = httpResource<ExecutionProgressResponse>(() => {
    const params = this.#getExecutionProgressParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/progress`,
      method: 'GET',
    };
  });

  getExecutionProgress(fireTrialId: FireTrial['id']): void {
    this.#getExecutionProgressParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── SECURITY COUNTDOWN STATE ────────────────────────────────────────────

  readonly #getSecurityCountdownParams = signal<ExecutionParams | null>(null);

  readonly securityCountdownResource = httpResource<SecurityCountdownResponse>(() => {
    const params = this.#getSecurityCountdownParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/security-countdown`,
      method: 'GET',
    };
  });

  getSecurityCountdownState(fireTrialId: FireTrial['id']): void {
    this.#getSecurityCountdownParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── SECURITY COUNTDOWN UPDATE ───────────────────────────────────────────

  readonly #updateSecurityCountdownParams = signal<SecurityCountdownParams | null>(null);

  readonly updateSecurityCountdownResource = httpResource<SecurityCountdownResponse>(() => {
    const params = this.#updateSecurityCountdownParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/security-countdown`,
      method: 'PUT',
      body: params.body,
    };
  });

  updateSecurityCountdown(fireTrialId: FireTrial['id'], body: SecurityCountdownRequest): void {
    this.#updateSecurityCountdownParams.set({ fireTrialId, body, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: START ─────────────────────────────────────────

  readonly #startParams = signal<ExecutionParams | null>(null);

  readonly startResource = httpResource<void>(() => {
    const params = this.#startParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/start`,
      method: 'POST',
    };
  });

  startExecution(fireTrialId: FireTrial['id']): void {
    this.#startParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: PAUSE ─────────────────────────────────────────

  readonly #pauseParams = signal<ExecutionParams | null>(null);

  readonly pauseResource = httpResource<void>(() => {
    const params = this.#pauseParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pause`,
      method: 'POST',
    };
  });

  pauseExecution(fireTrialId: FireTrial['id']): void {
    this.#pauseParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: INTERRUPT ────────────────────────────────────

  readonly #interruptParams = signal<ExecutionWithReasonParams | null>(null);

  readonly interruptResource = httpResource<void>(() => {
    const params = this.#interruptParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/interrupt`,
      method: 'POST',
      body: { reason: params.reason } satisfies TransitionWithReasonRequest,
    };
  });

  interruptExecution(fireTrialId: FireTrial['id'], reason: string): void {
    this.#interruptParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: RESUME ───────────────────────────────────────

  readonly #resumeParams = signal<ExecutionParams | null>(null);

  readonly resumeResource = httpResource<void>(() => {
    const params = this.#resumeParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/resume`,
      method: 'POST',
    };
  });

  resumeExecution(fireTrialId: FireTrial['id']): void {
    this.#resumeParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: CANCEL ───────────────────────────────────────

  readonly #cancelParams = signal<ExecutionWithReasonParams | null>(null);

  readonly cancelResource = httpResource<void>(() => {
    const params = this.#cancelParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/cancel`,
      method: 'POST',
      body: { reason: params.reason } satisfies TransitionWithReasonRequest,
    };
  });

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): void {
    this.#cancelParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── EXECUTION TRANSITIONS: FINISH ────────────────────────────────────────

  readonly #finishParams = signal<ExecutionParams | null>(null);

  readonly finishResource = httpResource<ExecutionFinishResponse>(() => {
    const params = this.#finishParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/finish`,
      method: 'POST',
    };
  });

  finishExecution(fireTrialId: FireTrial['id']): void {
    this.#finishParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION PLANNING: GET ─────────────────────────────────────────────

  readonly #getPlanningParams = signal<ExecutionParams | null>(null);

  readonly planningResource = httpResource<PlanningResponse>(() => {
    const params = this.#getPlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning`,
      method: 'GET',
    };
  });

  getExecutionPlanning(fireTrialId: FireTrial['id']): void {
    this.#getPlanningParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION PLANNING: UPDATE ──────────────────────────────────────────

  readonly #updatePlanningParams = signal<ExecutionPlanningParams | null>(null);

  readonly updatePlanningResource = httpResource<PlanningResponse>(() => {
    const params = this.#updatePlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning`,
      method: 'PUT',
      body: params.body as PlanningRequest,
    };
  });

  updateExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningRequest): void {
    this.#updatePlanningParams.set({ fireTrialId, body, _t: Date.now() });
  }

  // ── EXECUTION PLANNING: STATE ───────────────────────────────────────────

  readonly #getPlanningStateParams = signal<ExecutionParams | null>(null);

  readonly planningStateResource = httpResource<PlanningStateResponse>(() => {
    const params = this.#getPlanningStateParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning/state`,
      method: 'GET',
    };
  });

  getExecutionPlanningState(fireTrialId: FireTrial['id']): void {
    this.#getPlanningStateParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION PLANNING: APPROVE ─────────────────────────────────────────

  readonly #approvePlanningParams = signal<ExecutionPlanningParams | null>(null);

  readonly approvePlanningResource = httpResource<void>(() => {
    const params = this.#approvePlanningParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/planning/approve`,
      method: 'POST',
      body: params.body as PlanningApprovalRequest,
    };
  });

  approveExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningApprovalRequest): void {
    this.#approvePlanningParams.set({ fireTrialId, body, _t: Date.now() });
  }

  // ── WIDGET PREFERENCES: BY ROLE ─────────────────────────────────────────

  readonly #getPreferencesByRoleParams = signal<PreferencesParams | null>(null);

  readonly preferencesByRoleResource = httpResource<Record<string, unknown>>(() => {
    const params = this.#getPreferencesByRoleParams();
    if (!params || !params.roleName) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/roles/${params.roleName}`,
      method: 'GET',
    };
  });

  getPreferencesByRole(fireTrialId: FireTrial['id'], roleName: string): void {
    this.#getPreferencesByRoleParams.set({ fireTrialId, roleName, _t: Date.now() });
  }

  readonly #updatePreferencesByRoleParams = signal<PreferencesParams | null>(null);

  readonly updatePreferencesByRoleResource = httpResource<Record<string, unknown>>(() => {
    const params = this.#updatePreferencesByRoleParams();
    if (!params || !params.roleName) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/roles/${params.roleName}`,
      method: 'PUT',
      body: params.widgetsLayout,
    };
  });

  updatePreferencesByRole(fireTrialId: FireTrial['id'], roleName: string, widgetsLayout: WidgetId[]): void {
    this.#updatePreferencesByRoleParams.set({ fireTrialId, roleName, widgetsLayout, _t: Date.now() });
  }

  // ── WIDGET PREFERENCES: BY USER ─────────────────────────────────────────

  readonly #getPreferencesByUserParams = signal<PreferencesParams | null>(null);

  readonly preferencesByUserResource = httpResource<Record<string, unknown>>(() => {
    const params = this.#getPreferencesByUserParams();
    if (!params || !params.username) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/users/${params.username}`,
      method: 'GET',
    };
  });

  getPreferencesByUser(fireTrialId: FireTrial['id'], username: string): void {
    this.#getPreferencesByUserParams.set({ fireTrialId, username, _t: Date.now() });
  }

  readonly #updatePreferencesByUserParams = signal<PreferencesParams | null>(null);

  readonly updatePreferencesByUserResource = httpResource<Record<string, unknown>>(() => {
    const params = this.#updatePreferencesByUserParams();
    if (!params || !params.username) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/users/${params.username}`,
      method: 'PUT',
      body: params.widgetsLayout,
    };
  });

  updatePreferencesByUser(fireTrialId: FireTrial['id'], username: string, widgetsLayout: WidgetId[]): void {
    this.#updatePreferencesByUserParams.set({ fireTrialId, username, widgetsLayout, _t: Date.now() });
  }

  // ── EXECUTION READINESS: GET ALL ────────────────────────────────────────

  readonly #getReadinessParams = signal<ExecutionParams | null>(null);

  readonly profilesReadinessResource = httpResource<ProfilesReadinessResponse>(() => {
    const params = this.#getReadinessParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/readiness`,
      method: 'GET',
    };
  });

  getProfilesReadiness(fireTrialId: FireTrial['id']): void {
    this.#getReadinessParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EXECUTION READINESS: SET BY PROFILE ────────────────────────────────

  readonly #setReadinessProfileParams = signal<ReadinessProfileParams | null>(null);

  readonly setProfileReadinessResource = httpResource<ProfileReadinessItem>(() => {
    const params = this.#setReadinessProfileParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/readiness/profiles/${params.profile}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    body: ProfileReadinessRequest,
  ): void {
    this.#setReadinessProfileParams.set({ fireTrialId, profile, body, _t: Date.now() });
  }

  resetSetProfileReadiness(): void {
    this.#setReadinessProfileParams.set(null);
  }
}
