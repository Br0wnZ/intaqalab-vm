import { httpResource } from '@angular/common/http';
import type { Signal } from '@angular/core';
import { Injectable, Injector, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { injectExecutionEndpoint, injectPlanningEndpoint } from '@intaqalab/config';
import type { AngleUnitEnum, CadenceUnitEnum, DistanceUnitEnum, FireTrial, SpeedUnitEnum } from '@intaqalab/models';
import { filter, firstValueFrom, take } from 'rxjs';

import type {
  EquipmentMagnitudeTagEnum,
  EquipmentMeasureMagnitude,
  EquipmentSelectionApiList,
  EquipmentTypeEnum,
  ShotAcousticLevelRequest,
  ShotAcousticLevelResponse,
  ShotJltMaoRequest,
  ShotJltMaoResponse,
  ShotManometerPressuresRequest,
  ShotManometerPressuresResponse,
  ShotMaoTopographyRequest,
  ShotMaoTopographyResponse,
  ShotMunitionRequest,
  ShotMunitionResponse,
  ShotTopographyRequest,
  ShotTopographyResponse,
  ShotTrajectographyRequest,
  ShotTrajectographyResponse,
  WidgetId,
} from '../execution/models';
import { FireTrialLifecycleService } from './fire-trial-lifecycle.service';

// ============= Types =============

export type ExecutionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'CANCELED'
  // Legacy statuses still present in some mock/UI flows.
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

export interface ExecutionStateResponse {
  status: ExecutionStatus;
  activeSeriesId: string | null;
  activeShotId: string | null;
  // Backward compatibility with legacy payloads still sending this field.
  activeShootId?: string | null;
  updatedAt: string;
}

export interface ExecutionSeriesProgress {
  seriesId: string;
  shots: ExecutionShotProgress[];
}

export interface ExecutionShotProgress {
  shotId: string;
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
  comments?: string | null;
}

export interface PlanningSeriesItem {
  id: string;
  name: string;
  shotQuantity?: number;
  executionOrder?: number;
  observations?: string;
  shots?: PlanningSeriesShotItem[];
}

export interface PlanningSeriesShotItem {
  id: string;
  globalNumber?: number;
  observation?: string | null;
}

export interface PlanningConditionsResponse {
  units?: {
    orientation?: AngleUnitEnum | null;
  };
  series: PlanningConditionsSeries[];
}

export interface PlanningConditionsSeries {
  seriesId: string;
  shots: PlanningConditionsShot[];
}

export interface PlanningConditionsShot {
  shotId: string;
  orientation?: number | null;
  orientationUnit?: AngleUnitEnum | null;
}

export interface JltShotDataPayload {
  jet: string;
  pieceOperator: string;
  attackDistance: number | null;
  attackDistanceUnit?: DistanceUnitEnum;
  recoilDistance: number | null;
  recoilDistanceUnit?: DistanceUnitEnum;
  observations?: string | null;
}

export type JltShotDataRequest = JltShotDataPayload;

export type JltShotDataResponse = JltShotDataPayload | { jltData: JltShotDataPayload };

export interface ShotVelocityItem {
  radarDopplerId?: number | null;
  antennaId?: number | null;
  initialVelocity?: number | null;
  initialVelocityUnit?: SpeedUnitEnum;
  softwareUncertainty?: number | null;
  softwareUncertaintyUnit?: SpeedUnitEnum;
  cadence?: number | null;
  cadenceUnit?: CadenceUnitEnum;
  velocityLoss?: number | null;
  velocityLossUnit?: SpeedUnitEnum;
  observations?: string | null;
}

export type ShotVelocitiesRequest = ShotVelocityItem[];

export interface ShotVelocitiesResponse {
  velocities: ShotVelocityItem[];
}

// ============= Params Signals =============

interface ExecutionParams {
  fireTrialId: FireTrial['id'];
  _t: number;
}

interface ShotVelocitiesParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotVelocitiesUpdateParams extends ShotVelocitiesParams {
  body: ShotVelocitiesRequest;
}

interface ShotMunitionParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotMunitionUpdateParams extends ShotMunitionParams {
  body: ShotMunitionRequest;
}

interface ShotManometerPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotManometerPressuresUpdateParams extends ShotManometerPressuresParams {
  body: ShotManometerPressuresRequest;
}

interface ShotJltMaoParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotJltMaoUpdateParams extends ShotJltMaoParams {
  body: ShotJltMaoRequest;
}

interface ShotMaoTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotMaoTopographyUpdateParams extends ShotMaoTopographyParams {
  body: ShotMaoTopographyRequest;
}

interface ShotTopographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotTopographyUpdateParams extends ShotTopographyParams {
  body: ShotTopographyRequest;
}

interface ShotTrajectographyParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotTrajectographyUpdateParams extends ShotTrajectographyParams {
  body: ShotTrajectographyRequest;
}

interface ShotAcousticLevelParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotAcousticLevelUpdateParams extends ShotAcousticLevelParams {
  body: ShotAcousticLevelRequest;
}

// ── SHOT PRESSURES interfaces ────────────────────────────────────────────────

export interface ShotPressuresData {
  piezoelectricSensorId?: number | null;
  amplifierId?: number | null;
  dataAcquisitionSystemId?: number | null;
  closingMaxPressure?: number | null;
  closingMaxPressureUnit?: string;
  halfMaxPressure?: number | null;
  halfMaxPressureUnit?: string;
  shellMaxPressure?: number | null;
  shellMaxPressureUnit?: string;
  observations?: string | null;
}

export type ShotPressuresRequest = ShotPressuresData;

export interface ShotPressuresResponse {
  pressuresData: ShotPressuresData;
}

export interface ArmamentEquipmentItem {
  id: number | string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
}

export interface PlanningShotArmament {
  weaponExternalId?: number;
  tubeExternalId?: number;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
}

export interface PlanningArmamentResponse {
  series: Array<{
    seriesId: string;
    shots: Array<{ shotId: string; armament?: PlanningShotArmament }>;
  }>;
}

export interface ShotArmamentRequest {
  weaponId: number | null;
  tubeId: number | null;
  observations: string | null;
}

export interface ArmamentBulkConfigurationRequest {
  assignedSeriesIds: string[];
  weaponId?: number | null;
  tubeId?: number | null;
  observations?: string | null;
}

export interface ShotArmamentResponse {
  armamentData?: {
    weapon?: ArmamentEquipmentItem | null;
    tube?: ArmamentEquipmentItem | null;
    observations?: string | null;
  };
}

interface ShotPressuresParams {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
  _t: number;
}

interface ShotPressuresUpdateParams extends ShotPressuresParams {
  body: ShotPressuresRequest;
}

interface ShotArmamentUpdateParams extends ShotPressuresParams {
  body: ShotArmamentRequest;
}

interface ArmamentBulkConfigurationParams extends ExecutionParams {
  body: ArmamentBulkConfigurationRequest;
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

export type SeriesReadinessRequest = {
  isReady: boolean;
  observations?: string;
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

export type JltReadinessRequest = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vessel: boolean;
  observations?: string | null;
};

export type JltReadinessItem = {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
};

export type ProfileReadinessFlag = {
  isReady: boolean;
  observations?: string | null;
};

export type TechnicalUnitsReadinessItem = {
  velocities?: ProfileReadinessFlag;
  pressures?: ProfileReadinessFlag;
  video?: ProfileReadinessFlag;
  trajectography?: ProfileReadinessFlag;
  munitions?: ProfileReadinessFlag;
  armament?: ProfileReadinessFlag;
};

export type JltPreparationData = {
  jltReadiness?: JltReadinessItem;
  technicalUnitsReadiness?: TechnicalUnitsReadinessItem;
  seriesIsReadyForExecution: boolean;
};

export type JltPreparationResponse = JltPreparationData | { series: Array<JltPreparationData & { seriesId: string }> };

export type EquipmentSelectorCategory = {
  id: string;
  label: string;
  maxSelection: number;
  equipmentType?: string;
};

export type EquipmentSelectorItem = {
  id: string;
  label: string;
  categoryId?: string;
  equipmentType?: string;
};

export type EquipmentSelectorSelection = {
  equipmentDenominationId: number;
  categoryId: EquipmentTypeEnum;
  magnitude?: EquipmentMeasureMagnitude | null;
  channel?: number | null;
  seriesIds?: string[];
  shotIds?: string[];
  shootIds?: string[];
};

export type EquipmentSelectorMagnitudeGroup = {
  measurementGroup: EquipmentMagnitudeTagEnum | string;
  selections: EquipmentSelectorSelection[];
};

export type EquipmentSelectorResponse = EquipmentSelectionApiList;

export type EquipmentSelectorUpdateRequest = EquipmentSelectionApiList;

export type EquipmentSelectorUpdateResponse = void;

interface PreferencesParams extends ExecutionParams {
  roleName?: string;
  username?: string;
  widgetsLayout?: WidgetId[];
}

interface ReadinessProfileParams extends ExecutionParams {
  profile: ExecutionTechnicalProfile;
  body: ProfileReadinessRequest;
}

interface EquipmentSelectorUpdateParams extends ExecutionParams {
  body: EquipmentSelectorUpdateRequest;
}

interface JltShotDataParams extends ExecutionParams {
  seriesId: string;
  shotId: string;
}

interface JltShotDataUpdateParams extends JltShotDataParams {
  body: JltShotDataRequest;
}

interface JltPreparationParams extends ExecutionParams {
  seriesId: string;
}

interface JltReadinessParams extends JltPreparationParams {
  body: JltReadinessRequest;
}

interface SelectShotParams extends ExecutionParams {
  shotId: string;
}

interface SeriesReadinessOneParams {
  fireTrialId: FireTrial['id'];
  profile: ExecutionTechnicalProfile;
  seriesId: string;
  body: SeriesReadinessRequest;
  _t: number;
}

interface EquipmentByCategoryParams {
  categoryId: string;
  _t: number;
}

interface LoadEquipmentByTypeParams {
  itemType: 'WEAPON' | 'TUBE';
  _t: number;
}

// ============= Service =============

@Injectable({
  providedIn: 'root',
})
export class ExecutionService {
  readonly #lifecycleService = inject(FireTrialLifecycleService);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();
  readonly #planningUrl = injectPlanningEndpoint();
  #lastReadinessSaveStatus = 'idle';
  #lastHandledReadinessSaveRequestId: number | null = null;

  // ── PLANNING SERIES ──────────────────────────────────────────────────────

  readonly #getPlanningSeriesParams = signal<ExecutionParams | null>(null);

  readonly planningSeriesResource = httpResource<PlanningSeriesItem[]>(() => {
    const params = this.#getPlanningSeriesParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/series`,
      method: 'GET',
    };
  });

  getPlanningSeries(fireTrialId: FireTrial['id']): void {
    this.#getPlanningSeriesParams.set({ fireTrialId, _t: Date.now() });
  }

  readonly #getPlanningConditionsParams = signal<ExecutionParams | null>(null);

  readonly planningConditionsResource = httpResource<PlanningConditionsResponse>(() => {
    const params = this.#getPlanningConditionsParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/conditions`,
      method: 'GET',
    };
  });

  getPlanningConditions(fireTrialId: FireTrial['id']): void {
    this.#getPlanningConditionsParams.set({ fireTrialId, _t: Date.now() });
  }

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

  readonly startResource = this.#lifecycleService.startResource;

  startExecution(fireTrialId: FireTrial['id']): void {
    this.#lifecycleService.startFireTrial(fireTrialId);
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

  readonly cancelResource = this.#lifecycleService.cancelResource;

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): void {
    this.#lifecycleService.cancelFireTrial(fireTrialId, reason);
  }

  // ── EXECUTION TRANSITIONS: FINISH ────────────────────────────────────────

  readonly finishResource = this.#lifecycleService.finishResource;

  finishExecution(fireTrialId: FireTrial['id']): void {
    this.#lifecycleService.finishFireTrial(fireTrialId);
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

  readonly preferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
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

  readonly updatePreferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByRoleParams();
    if (!params || !params.roleName || !params.widgetsLayout) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/roles/${params.roleName}`,
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
    };
  });

  updatePreferencesByRole(fireTrialId: FireTrial['id'], roleName: string, widgetsLayout: WidgetId[]): void {
    this.#updatePreferencesByRoleParams.set({ fireTrialId, roleName, widgetsLayout, _t: Date.now() });
  }

  // ── WIDGET PREFERENCES: BY USER ─────────────────────────────────────────

  readonly #getPreferencesByUserParams = signal<PreferencesParams | null>(null);

  readonly preferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
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

  readonly updatePreferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByUserParams();
    if (!params || !params.username || !params.widgetsLayout) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/preferences/users/${params.username}`,
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
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

  // ── EXECUTION READINESS: SET BY PROFILE & SERIES ────────────────────────

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

  readonly #setSeriesReadinessOneParams = signal<SeriesReadinessOneParams | null>(null);

  readonly #setSeriesReadinessOneResource = httpResource<SeriesReadinessItem>(() => {
    const p = this.#setSeriesReadinessOneParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/readiness/profiles/${p.profile}/series/${p.seriesId}`,
      method: 'PUT',
      body: p.body,
    };
  });

  /**
   * Registra el readiness de un perfil para una serie individual en la API.
   */
  async setSeriesProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    seriesId: string,
    body: SeriesReadinessRequest,
  ): Promise<SeriesReadinessItem> {
    this.#setSeriesReadinessOneParams.set({ fireTrialId, profile, seriesId, body, _t: Date.now() });
    await this.#awaitResource(this.#setSeriesReadinessOneResource);
    return this.#setSeriesReadinessOneResource.value()!;
  }

  /**
   * Registra el readiness de un perfil ejecutando una llamada individual por cada serie de forma secuencial.
   */
  async setProfileReadiness(
    fireTrialId: FireTrial['id'],
    profile: ExecutionTechnicalProfile,
    bodyOrItems: ProfileReadinessRequest | SeriesReadinessItem[],
  ): Promise<SeriesReadinessItem[]> {
    const items = Array.isArray(bodyOrItems) ? bodyOrItems : bodyOrItems.seriesReadiness;
    // Disparar legacy trigger resource también por compatibilidad
    this.#setReadinessProfileParams.set({
      fireTrialId,
      profile,
      body: Array.isArray(bodyOrItems) ? { seriesReadiness: bodyOrItems } : bodyOrItems,
      _t: Date.now(),
    });
    const results: SeriesReadinessItem[] = [];
    for (const item of items) {
      const result = await this.setSeriesProfileReadiness(fireTrialId, profile, item.seriesId, {
        isReady: item.isReady,
        observations: item.observations,
      });
      results.push(result);
    }
    return results;
  }

  resetSetProfileReadiness(): void {
    this.#setReadinessProfileParams.set(null);
  }

  // ── EXECUTION READINESS: WIDGET 2 JLT PREPARATION ─────────────────────

  readonly #getJltPreparationParams = signal<JltPreparationParams | null>(null);

  readonly jltPreparationResource = httpResource<JltPreparationResponse>(() => {
    const params = this.#getJltPreparationParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation`,
      method: 'GET',
      params: {
        seriesId: params.seriesId,
      },
    };
  });

  getJltPreparation(fireTrialId: FireTrial['id'], seriesId: string): void {
    this.#getJltPreparationParams.set({ fireTrialId, seriesId, _t: Date.now() });
  }

  readonly #setJltReadinessParams = signal<JltReadinessParams | null>(null);

  readonly setJltReadinessResource = httpResource<JltReadinessItem>(() => {
    const params = this.#setJltReadinessParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/series/${params.seriesId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setJltReadiness(fireTrialId: FireTrial['id'], seriesId: string, body: JltReadinessRequest): void {
    this.#setJltReadinessParams.set({ fireTrialId, seriesId, body, _t: Date.now() });
  }

  readonly #selectShotParams = signal<SelectShotParams | null>(null);

  readonly selectShotResource = httpResource<void>(() => {
    const params = this.#selectShotParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/shots/${params.shotId}/active`,
      method: 'POST',
    };
  });

  selectShot(fireTrialId: FireTrial['id'], shotId: string): void {
    this.#selectShotParams.set({ fireTrialId, shotId, _t: Date.now() });
  }

  readonly #fireShotParams = signal<ExecutionParams | null>(null);

  readonly fireShotResource = httpResource<void>(() => {
    const params = this.#fireShotParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-preparation/fire`,
      method: 'POST',
    };
  });

  fireShot(fireTrialId: FireTrial['id']): void {
    this.#fireShotParams.set({ fireTrialId, _t: Date.now() });
  }

  // Tras cada PUT exitoso, recargar el GET para resincronizar store y widgets.
  // eslint-disable-next-line no-unused-private-class-members
  readonly #reloadProfilesReadinessAfterSave = effect(
    () => {
      const params = this.#setReadinessProfileParams();
      const status = this.setProfileReadinessResource.status();
      const shouldReload =
        !!params &&
        status === 'resolved' &&
        this.#lastHandledReadinessSaveRequestId !== params._t &&
        this.#lastReadinessSaveStatus !== 'resolved';

      this.#lastReadinessSaveStatus = status;

      if (!shouldReload) {
        return;
      }

      this.#lastHandledReadinessSaveRequestId = params._t;
      this.getProfilesReadiness(params.fireTrialId);
    },
    { allowSignalWrites: true },
  );

  // ── EQUIPMENT SELECTOR: GET ─────────────────────────────────────────────

  readonly #getEquipmentSelectorParams = signal<ExecutionParams | null>(null);

  readonly equipmentSelectorResource = httpResource<EquipmentSelectorResponse>(() => {
    const params = this.#getEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/equipment-selection`,
      method: 'GET',
    };
  });

  getEquipmentSelector(fireTrialId: FireTrial['id']): void {
    this.#getEquipmentSelectorParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── EQUIPMENT ITEMS BY CATEGORY ──────────────────────────────────────────

  readonly #loadByCategoryParams = signal<EquipmentByCategoryParams | null>(null);

  readonly #loadByCategoryResource = httpResource<{
    totalElements: number;
    items: Array<{ denominationId: number; denominationName: string; tag: string }>;
  }>(() => {
    const p = this.#loadByCategoryParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/equipment/items`,
      method: 'GET',
      params: { categoryId: p.categoryId },
    };
  });

  /**
   * Carga items de equipo para múltiples categorías de forma secuencial desde /equipment/items?categoryId=X.
   * Devuelve un map categoryId → opciones de select { id: denominationId, label }
   */
  async loadEquipmentItemsByCategories(
    categories: EquipmentTypeEnum[],
  ): Promise<Record<string, Array<{ id: string; label: string }>>> {
    const results: Array<readonly [string, Array<{ id: string; label: string }>]> = [];
    for (const cat of categories) {
      this.#loadByCategoryParams.set({ categoryId: cat, _t: Date.now() });
      await this.#awaitResource(this.#loadByCategoryResource);
      const response = this.#loadByCategoryResource.value()!;
      results.push([
        cat,
        response.items.map((item) => ({
          id: String(item.denominationId),
          label: `${item.denominationName} / ${item.tag}`,
        })),
      ] as const);
    }
    return Object.fromEntries(results);
  }

  // ── EQUIPMENT SELECTOR: PUT ─────────────────────────────────────────────

  readonly #updateEquipmentSelectorParams = signal<EquipmentSelectorUpdateParams | null>(null);

  readonly updateEquipmentSelectorResource = httpResource<EquipmentSelectorUpdateResponse>(() => {
    const params = this.#updateEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/equipment-selection`,
      method: 'PUT',
      body: params.body,
    };
  });

  updateEquipmentSelector(fireTrialId: FireTrial['id'], body: EquipmentSelectorUpdateRequest): void {
    this.#updateEquipmentSelectorParams.set({ fireTrialId, body, _t: Date.now() });
  }

  // ── JLT SHOT DATA: GET ───────────────────────────────────────────────────

  readonly #getJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly jltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#getJltShotDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-shot-data/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getJltShotDataParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchJltShotDataParams = signal<JltShotDataParams | null>(null);

  readonly #fetchJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const p = this.#fetchJltShotDataParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/jlt-shot-data/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<JltShotDataResponse> {
    this.#fetchJltShotDataParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchJltShotDataResource);
    return this.#fetchJltShotDataResource.value()!;
  }

  // ── JLT SHOT DATA: PUT ───────────────────────────────────────────────────

  readonly #updateJltShotDataParams = signal<JltShotDataUpdateParams | null>(null);

  readonly updateJltShotDataResource = httpResource<JltShotDataResponse>(() => {
    const params = this.#updateJltShotDataParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-shot-data/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setJltShotData(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: JltShotDataRequest): void {
    this.#updateJltShotDataParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  // ── SHOT VELOCITIES: GET ─────────────────────────────────────────────────

  readonly #getShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly shotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#getShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/velocities/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotVelocities(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotVelocitiesParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotVelocitiesParams = signal<ShotVelocitiesParams | null>(null);

  readonly #fetchShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const p = this.#fetchShotVelocitiesParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/velocities/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotVelocities(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotVelocitiesResponse> {
    this.#fetchShotVelocitiesParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotVelocitiesResource);
    return this.#fetchShotVelocitiesResource.value()!;
  }

  // ── SHOT VELOCITIES: PUT ─────────────────────────────────────────────────

  readonly #updateShotVelocitiesParams = signal<ShotVelocitiesUpdateParams | null>(null);

  readonly updateShotVelocitiesResource = httpResource<ShotVelocitiesResponse>(() => {
    const params = this.#updateShotVelocitiesParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/velocities/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotVelocity(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotVelocitiesRequest): void {
    this.#updateShotVelocitiesParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  // ── SHOT PRESSURES: GET ──────────────────────────────────────────────────────

  readonly #getShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly shotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#getShotPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotPressuresParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotPressuresParams = signal<ShotPressuresParams | null>(null);

  readonly #fetchShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const p = this.#fetchShotPressuresParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/pressures/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotPressuresResponse> {
    this.#fetchShotPressuresParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotPressuresResource);
    return this.#fetchShotPressuresResource.value()!;
  }

  // ── SHOT PRESSURES: PUT ──────────────────────────────────────────────────────

  readonly #updateShotPressuresParams = signal<ShotPressuresUpdateParams | null>(null);

  readonly updateShotPressuresResource = httpResource<ShotPressuresResponse>(() => {
    const params = this.#updateShotPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotPressure(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotPressuresRequest): void {
    this.#updateShotPressuresParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  // ── SHOT ARMAMENT ───────────────────────────────────────────────────────────

  readonly #loadArmamentItemsParams = signal<LoadEquipmentByTypeParams | null>(null);

  readonly #loadArmamentItemsResource = httpResource<{ items: ArmamentEquipmentItem[] }>(() => {
    const p = this.#loadArmamentItemsParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/equipment/items`,
      method: 'GET',
      params: { itemType: p.itemType },
    };
  });

  async loadArmamentEquipmentItems(itemType: 'WEAPON' | 'TUBE'): Promise<ArmamentEquipmentItem[]> {
    this.#loadArmamentItemsParams.set({ itemType, _t: Date.now() });
    await this.#awaitResource(this.#loadArmamentItemsResource);
    return this.#loadArmamentItemsResource.value()!.items;
  }

  readonly #fetchPlanningArmamentParams = signal<ExecutionParams | null>(null);

  readonly #fetchPlanningArmamentResource = httpResource<PlanningArmamentResponse>(() => {
    const p = this.#fetchPlanningArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${p.fireTrialId}/planning/armament`,
      method: 'GET',
    };
  });

  async fetchPlanningArmament(fireTrialId: FireTrial['id']): Promise<PlanningArmamentResponse> {
    this.#fetchPlanningArmamentParams.set({ fireTrialId, _t: Date.now() });
    await this.#awaitResource(this.#fetchPlanningArmamentResource);
    return this.#fetchPlanningArmamentResource.value()!;
  }

  readonly #fetchShotArmamentParams = signal<ShotPressuresParams | null>(null);

  readonly #fetchShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const p = this.#fetchShotArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/armament/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotArmament(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotArmamentResponse> {
    this.#fetchShotArmamentParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotArmamentResource);
    return this.#fetchShotArmamentResource.value()!;
  }

  readonly #updateShotArmamentParams = signal<ShotArmamentUpdateParams | null>(null);

  readonly updateShotArmamentResource = httpResource<ShotArmamentResponse>(() => {
    const params = this.#updateShotArmamentParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/armament/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotArmament(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotArmamentRequest): void {
    this.#updateShotArmamentParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  // ── ARMAMENT BULK CONFIGURATION ──────────────────────────────────────────

  readonly #applyArmamentBulkConfigurationParams = signal<ArmamentBulkConfigurationParams | null>(null);

  readonly applyArmamentBulkConfigurationResource = httpResource<void>(() => {
    const params = this.#applyArmamentBulkConfigurationParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/armament/bulk-configuration`,
      method: 'POST',
      body: params.body,
    };
  });

  applyArmamentBulkConfiguration(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): void {
    this.#applyArmamentBulkConfigurationParams.set({ fireTrialId, body, _t: Date.now() });
  }

  readonly #bulkConfigureArmamentParams = signal<ArmamentBulkConfigurationParams | null>(null);

  readonly #bulkConfigureArmamentResource = httpResource<void>(() => {
    const p = this.#bulkConfigureArmamentParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/armament/bulk-configuration`,
      method: 'POST',
      body: p.body,
    };
  });

  async bulkConfigureArmament(fireTrialId: FireTrial['id'], body: ArmamentBulkConfigurationRequest): Promise<void> {
    this.#bulkConfigureArmamentParams.set({ fireTrialId, body, _t: Date.now() });
    await this.#awaitResource(this.#bulkConfigureArmamentResource);
  }

  // ── SHOT MUNITIONS: GET (Widget 20) ──────────────────────────────────────────

  readonly #getShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly shotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#getShotMunitionParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/munitions/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMunitionParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotMunitionParams = signal<ShotMunitionParams | null>(null);

  readonly #fetchShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const p = this.#fetchShotMunitionParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/munitions/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMunitionResponse> {
    this.#fetchShotMunitionParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotMunitionResource);
    return this.#fetchShotMunitionResource.value()!;
  }

  // ── SHOT MUNITIONS: PUT (Widget 20) ──────────────────────────────────────────

  readonly #updateShotMunitionParams = signal<ShotMunitionUpdateParams | null>(null);

  readonly updateShotMunitionResource = httpResource<ShotMunitionResponse>(() => {
    const params = this.#updateShotMunitionParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/munitions/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMunition(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotMunitionRequest): void {
    this.#updateShotMunitionParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotMunition(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMunitionRequest,
  ): Promise<ShotMunitionResponse> {
    this.#updateShotMunitionParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotMunitionResource);
    return this.updateShotMunitionResource.value()!;
  }

  // ── SHOT MANOMETER PRESSURES: GET (Widget 21) ────────────────────────────────

  readonly #getShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly shotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#getShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/manometer-pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });

  getShotManometerPressures(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotManometerPressuresParams = signal<ShotManometerPressuresParams | null>(null);

  readonly #fetchShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const p = this.#fetchShotManometerPressuresParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/manometer-pressures/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotManometerPressuresResponse> {
    this.#fetchShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotManometerPressuresResource);
    return this.#fetchShotManometerPressuresResource.value()!;
  }

  // ── SHOT MANOMETER PRESSURES: PUT (Widget 21) ────────────────────────────────

  readonly #updateShotManometerPressuresParams = signal<ShotManometerPressuresUpdateParams | null>(null);

  readonly updateShotManometerPressuresResource = httpResource<ShotManometerPressuresResponse>(() => {
    const params = this.#updateShotManometerPressuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/manometer-pressures/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): void {
    this.#updateShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotManometerPressures(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotManometerPressuresRequest,
  ): Promise<ShotManometerPressuresResponse> {
    this.#updateShotManometerPressuresParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotManometerPressuresResource);
    return this.updateShotManometerPressuresResource.value()!;
  }

  // ── SHOT JLT MAO: GET ────────────────────────────────

  readonly #getShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly shotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#getShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-mao/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotJltMaoResource = this.shotJltMaoResource;

  getShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotJltMaoParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotJltMaoParams = signal<ShotJltMaoParams | null>(null);

  readonly #fetchShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const p = this.#fetchShotJltMaoParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/jlt-mao/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): Promise<ShotJltMaoResponse> {
    this.#fetchShotJltMaoParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotJltMaoResource);
    return this.#fetchShotJltMaoResource.value()!;
  }

  // ── SHOT JLT MAO: PUT ────────────────────────────────

  readonly #updateShotJltMaoParams = signal<ShotJltMaoUpdateParams | null>(null);

  readonly updateShotJltMaoResource = httpResource<ShotJltMaoResponse>(() => {
    const params = this.#updateShotJltMaoParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/jlt-mao/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotJltMao(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotJltMaoRequest): void {
    this.#updateShotJltMaoParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotJltMao(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotJltMaoRequest,
  ): Promise<ShotJltMaoResponse> {
    this.#updateShotJltMaoParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotJltMaoResource);
    return this.updateShotJltMaoResource.value()!;
  }

  // ── SHOT MAO TOPOGRAPHY: GET ────────────────────────────────

  readonly #getShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly shotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#getShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/mao-topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotMaoTopographyResource = this.shotMaoTopographyResource;

  getShotMaoTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotMaoTopographyParams = signal<ShotMaoTopographyParams | null>(null);

  readonly #fetchShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const p = this.#fetchShotMaoTopographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/mao-topography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotMaoTopographyResponse> {
    this.#fetchShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotMaoTopographyResource);
    return this.#fetchShotMaoTopographyResource.value()!;
  }

  // ── SHOT MAO TOPOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotMaoTopographyParams = signal<ShotMaoTopographyUpdateParams | null>(null);

  readonly updateShotMaoTopographyResource = httpResource<ShotMaoTopographyResponse>(() => {
    const params = this.#updateShotMaoTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/mao-topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): void {
    this.#updateShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotMaoTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotMaoTopographyRequest,
  ): Promise<ShotMaoTopographyResponse> {
    this.#updateShotMaoTopographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotMaoTopographyResource);
    return this.updateShotMaoTopographyResource.value()!;
  }

  // ── SHOT TOPOGRAPHY: GET ────────────────────────────────

  readonly #getShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly shotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#getShotTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotTopographyResource = this.shotTopographyResource;

  getShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTopographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotTopographyParams = signal<ShotTopographyParams | null>(null);

  readonly #fetchShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const p = this.#fetchShotTopographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/topography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTopographyResponse> {
    this.#fetchShotTopographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotTopographyResource);
    return this.#fetchShotTopographyResource.value()!;
  }

  // ── SHOT TOPOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotTopographyParams = signal<ShotTopographyUpdateParams | null>(null);

  readonly updateShotTopographyResource = httpResource<ShotTopographyResponse>(() => {
    const params = this.#updateShotTopographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/topography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTopography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string, body: ShotTopographyRequest): void {
    this.#updateShotTopographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotTopography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTopographyRequest,
  ): Promise<ShotTopographyResponse> {
    this.#updateShotTopographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotTopographyResource);
    return this.updateShotTopographyResource.value()!;
  }

  // ── SHOT TRAJECTOGRAPHY: GET ────────────────────────────────

  readonly #getShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly shotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#getShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/trajectography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotTrajectographyResource = this.shotTrajectographyResource;

  getShotTrajectography(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotTrajectographyParams = signal<ShotTrajectographyParams | null>(null);

  readonly #fetchShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const p = this.#fetchShotTrajectographyParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/trajectography/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotTrajectographyResponse> {
    this.#fetchShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotTrajectographyResource);
    return this.#fetchShotTrajectographyResource.value()!;
  }

  // ── SHOT TRAJECTOGRAPHY: PUT ────────────────────────────────

  readonly #updateShotTrajectographyParams = signal<ShotTrajectographyUpdateParams | null>(null);

  readonly updateShotTrajectographyResource = httpResource<ShotTrajectographyResponse>(() => {
    const params = this.#updateShotTrajectographyParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/trajectography/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): void {
    this.#updateShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotTrajectography(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotTrajectographyRequest,
  ): Promise<ShotTrajectographyResponse> {
    this.#updateShotTrajectographyParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotTrajectographyResource);
    return this.updateShotTrajectographyResource.value()!;
  }

  // ── SHOT ACOUSTIC LEVEL: GET ────────────────────────────────

  readonly #getShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly shotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#getShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/acoustic-level/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'GET',
    };
  });
  readonly shotShotAcousticLevelResource = this.shotAcousticLevelResource;

  getShotAcousticLevel(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  }

  readonly #fetchShotAcousticLevelParams = signal<ShotAcousticLevelParams | null>(null);

  readonly #fetchShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const p = this.#fetchShotAcousticLevelParams();
    if (!p) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/acoustic-level/series/${p.seriesId}/shots/${p.shotId}`,
      method: 'GET',
    };
  });

  async fetchShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<ShotAcousticLevelResponse> {
    this.#fetchShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
    await this.#awaitResource(this.#fetchShotAcousticLevelResource);
    return this.#fetchShotAcousticLevelResource.value()!;
  }

  // ── SHOT ACOUSTIC LEVEL: PUT ────────────────────────────────

  readonly #updateShotAcousticLevelParams = signal<ShotAcousticLevelUpdateParams | null>(null);

  readonly updateShotAcousticLevelResource = httpResource<ShotAcousticLevelResponse>(() => {
    const params = this.#updateShotAcousticLevelParams();
    if (!params) return undefined;
    return {
      url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/acoustic-level/series/${params.seriesId}/shots/${params.shotId}`,
      method: 'PUT',
      body: params.body,
    };
  });

  setShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): void {
    this.#updateShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  }

  async updateShotAcousticLevel(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: ShotAcousticLevelRequest,
  ): Promise<ShotAcousticLevelResponse> {
    this.#updateShotAcousticLevelParams.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
    await this.#awaitResource(this.updateShotAcousticLevelResource);
    return this.updateShotAcousticLevelResource.value()!;
  }
  /**
   * Espera a que un httpResource complete su carga actual.
   * Detecta la transición de carga y lanza si hay error.
   */
  async #awaitResource(resource: { isLoading: Signal<boolean>; error: Signal<unknown> }): Promise<void> {
    await firstValueFrom(
      toObservable(resource.isLoading, { injector: this.#injector }).pipe(
        filter((_, index) => index > 0 || resource.isLoading()),
        filter((loading) => !loading),
        take(1),
      ),
    );
    if (resource.error()) {
      throw resource.error();
    }
  }
}
