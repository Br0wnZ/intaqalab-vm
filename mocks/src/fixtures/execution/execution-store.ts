import { getFixture } from '../../utils';
import { getTrialById } from '../trials/trial-transitions-store';

type ExecutionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'INTERRUPTED'
  | 'CANCELED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'EXECUTED'
  | 'FINISHED'
  | 'ANALYZING'
  | 'CLOSED';

type CountdownAction = 'START' | 'PAUSE' | 'RESUME' | 'UPDATE_DURATION';

type ExecutionProfile = 'VELOCITIES' | 'PRESSURES' | 'VIDEO' | 'TRAJECTOGRAPHY' | 'MUNITIONS' | 'ARMAMENT';

interface SeriesReadinessItem {
  seriesId: string;
  isReady: boolean;
  observations?: string;
}

interface ProfileReadinessItem {
  profile: ExecutionProfile;
  seriesReadiness: SeriesReadinessItem[];
}

interface ProfilesReadinessState {
  profilesReadiness: ProfileReadinessItem[];
}

interface ProfileReadinessFlag {
  isReady: boolean;
  observations?: string | null;
}

interface JltReadinessItem {
  sanitaryServicesReady: boolean;
  securityReady: boolean;
  vesselReady: boolean;
  observations?: string | null;
}

interface TechnicalUnitsReadinessItem {
  velocities?: ProfileReadinessFlag;
  pressures?: ProfileReadinessFlag;
  video?: ProfileReadinessFlag;
  trajectography?: ProfileReadinessFlag;
  munitions?: ProfileReadinessFlag;
  armament?: ProfileReadinessFlag;
}

interface JltPreparationState {
  jltReadiness: JltReadinessItem;
  technicalUnitsReadiness: TechnicalUnitsReadinessItem;
  seriesIsReadyForExecution: boolean;
}

interface ExecutionState {
  status: ExecutionStatus;
  activeSeriesId: string | null;
  activeShotId: string | null;
  activeShootId?: string | null;
  updatedAt: string;
}

interface SecurityCountdownState {
  status: 'INACTIVE' | 'ACTIVE' | 'PAUSED';
  targetEndTime: string | null;
  remainingSeconds: number | null;
}

interface PlanningState {
  version: number;
  isApprovedByClient: boolean;
  updatedAt: string;
}

interface JltShotDataPayload {
  jet: string;
  pieceOperator: string;
  attackDistance: number | null;
  attackDistanceUnit?: string;
  recoilDistance: number | null;
  recoilDistanceUnit?: string;
  observations?: string | null;
}

interface JltShotDataResponse {
  jltData: JltShotDataPayload;
}

export interface ShotVelocityItem {
  radarDopplerId?: number | null;
  antennaId?: number | null;
  initialVelocity?: number | null;
  initialVelocityUnit?: string;
  softwareUncertainty?: number | null;
  softwareUncertaintyUnit?: string;
  cadence?: number | null;
  cadenceUnit?: string;
  velocityLoss?: number | null;
  velocityLossUnit?: string;
  observations?: string | null;
}

export interface ShotVelocitiesResponse {
  velocities: ShotVelocityItem[];
}

// ── SHOT PRESSURES tipos ───────────────────────────────────────────────────

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

export interface ShotPressuresResponse {
  pressuresData: ShotPressuresData;
}

const executionStateMap = new Map<string, ExecutionState>();
const countdownStateMap = new Map<string, SecurityCountdownState>();
const planningStateMap = new Map<string, PlanningState>();
const readinessStateMap = new Map<string, ProfilesReadinessState>();
const jltPreparationStateMap = new Map<string, JltPreparationState>();
const jltShotDataStateMap = new Map<string, Map<string, JltShotDataResponse>>();
const velocitiesStateMap = new Map<string, Map<string, ShotVelocitiesResponse>>();
const pressuresStateMap = new Map<string, Map<string, ShotPressuresResponse>>();
const armamentStateMap = new Map<string, Map<string, ShotArmamentResponse>>();
const munitionStateMap = new Map<string, Map<string, ShotMunitionResponse>>();
const manometerPressuresStateMap = new Map<string, Map<string, ShotManometerPressuresResponse>>();

function defaultExecutionState(): ExecutionState {
  return getFixture<ExecutionState>('fixtures/execution', 'execution-state-fixture.json');
}

function defaultCountdownState(): SecurityCountdownState {
  return getFixture<SecurityCountdownState>('fixtures/execution', 'execution-security-countdown-fixture.json');
}

function defaultPlanningState(): PlanningState {
  return getFixture<PlanningState>('fixtures/execution', 'execution-planning-state-fixture.json');
}

function defaultReadinessState(): ProfilesReadinessState {
  return getFixture<ProfilesReadinessState>('fixtures/execution', 'execution-readiness-fixture.json');
}

function defaultJltPreparationState(): JltPreparationState {
  return getFixture<JltPreparationState>('fixtures/execution', 'execution-jlt-preparation-fixture.json');
}

function defaultJltShotDataState(): JltShotDataResponse {
  return getFixture<JltShotDataResponse>('fixtures/execution', 'execution-jlt-shot-data-fixture.json');
}

function cloneJltShotDataState(state: JltShotDataResponse): JltShotDataResponse {
  return structuredClone(state);
}

function getShotProgress(seriesId: string, shotId: string): { status: string } | null {
  const progress = getFixture<{
    series: Array<{ seriesId: string; shots: Array<{ shotId: string; status: string }> }>;
  }>('fixtures/execution', 'execution-progress-fixture.json');

  const series = progress?.series?.find((item) => item.seriesId === seriesId);
  const foundShot = series?.shots?.find((shot) => shot.shotId === shotId);
  if (foundShot) {
    return foundShot;
  }

  return { status: 'ACTIVE' };
}

function getOrCreateJltShotDataMap(fireTrialId: string): Map<string, JltShotDataResponse> {
  let state = jltShotDataStateMap.get(fireTrialId);

  if (!state) {
    state = new Map<string, JltShotDataResponse>();
    jltShotDataStateMap.set(fireTrialId, state);
  }

  return state;
}

function getExecutionProgressFixture(): {
  series: Array<{ seriesId: string; shots: Array<{ shotId: string; status: string; updatedAt: string }> }>;
} {
  return getFixture('fixtures/execution', 'execution-progress-fixture.json');
}

function resolveExecutionStatusForTrial(fireTrialId: string): ExecutionStatus {
  const trial = getTrialById(fireTrialId) as { status?: string } | null;

  switch (trial?.status) {
    case 'PLANNED':
    case 'PREPARED':
    case 'UNDER_REVIEW':
      return 'PLANNED';
    case 'STARTED':
      return 'STARTED';
    case 'IN_PROGRESS':
      return 'ACTIVE';
    case 'INTERRUPTED':
      return 'INTERRUPTED';
    case 'EXECUTED':
      return 'EXECUTED';
    case 'FINALIZING':
      return 'FINISHED';
    case 'CLOSED':
      return 'CLOSED';
    case 'CANCELLED':
      return 'CANCELED';
    case 'ANALYZING':
      return 'ANALYZING';
    default:
      return defaultExecutionState().status;
  }
}

function resolveActiveShotState(): Pick<ExecutionState, 'activeSeriesId' | 'activeShotId'> {
  const progress = getExecutionProgressFixture();

  for (const series of progress.series) {
    const activeShot = series.shots.find((shot) => shot.status === 'ACTIVE');
    if (activeShot) {
      return {
        activeSeriesId: series.seriesId,
        activeShotId: activeShot.shotId,
      };
    }
  }

  for (const series of progress.series) {
    const pendingShot = series.shots.find((shot) => shot.status === 'PENDING');
    if (pendingShot) {
      return {
        activeSeriesId: series.seriesId,
        activeShotId: pendingShot.shotId,
      };
    }
  }

  const lastSeries = progress.series[progress.series.length - 1] ?? null;
  const lastShot = lastSeries?.shots[lastSeries.shots.length - 1] ?? null;

  return {
    activeSeriesId: lastSeries?.seriesId ?? null,
    activeShotId: lastShot?.shotId ?? null,
  };
}

export function getExecutionState(fireTrialId: string): ExecutionState {
  if (!executionStateMap.has(fireTrialId)) {
    const initial = {
      ...defaultExecutionState(),
      ...resolveActiveShotState(),
      status: resolveExecutionStatusForTrial(fireTrialId),
    };
    executionStateMap.set(fireTrialId, {
      ...initial,
      activeShootId: initial.activeShotId,
    });
  }

  const persisted = executionStateMap.get(fireTrialId);
  const state = persisted
    ? { ...persisted, status: resolveExecutionStatusForTrial(fireTrialId) }
    : {
        ...defaultExecutionState(),
        ...resolveActiveShotState(),
        status: resolveExecutionStatusForTrial(fireTrialId),
      };

  executionStateMap.set(fireTrialId, state);

  return {
    ...state,
    activeShootId: state.activeShotId,
  };
}

export function setExecutionStatus(fireTrialId: string, status: ExecutionStatus): ExecutionState {
  const current = getExecutionState(fireTrialId);
  const updated: ExecutionState = { ...current, status, updatedAt: new Date().toISOString() };
  executionStateMap.set(fireTrialId, updated);
  return updated;
}

export function getCountdownState(fireTrialId: string): SecurityCountdownState {
  if (!countdownStateMap.has(fireTrialId)) {
    countdownStateMap.set(fireTrialId, { ...defaultCountdownState() });
  }
  return countdownStateMap.get(fireTrialId) ?? defaultCountdownState();
}

export function updateCountdownState(
  fireTrialId: string,
  action: CountdownAction,
  durationSeconds?: number,
): SecurityCountdownState {
  const now = new Date();
  let state = getCountdownState(fireTrialId);

  switch (action) {
    case 'START': {
      const secs = durationSeconds ?? 30;
      state = {
        status: 'ACTIVE',
        targetEndTime: new Date(now.getTime() + secs * 1000).toISOString(),
        remainingSeconds: secs,
      };
      break;
    }
    case 'PAUSE':
      state = { ...state, status: 'PAUSED' };
      break;
    case 'RESUME':
      state = { ...state, status: 'ACTIVE' };
      break;
    case 'UPDATE_DURATION': {
      const secs = durationSeconds ?? 30;
      state = {
        ...state,
        targetEndTime: new Date(now.getTime() + secs * 1000).toISOString(),
        remainingSeconds: secs,
      };
      break;
    }
  }

  countdownStateMap.set(fireTrialId, state);
  return state;
}

export function getPlanningState(fireTrialId: string): PlanningState {
  if (!planningStateMap.has(fireTrialId)) {
    planningStateMap.set(fireTrialId, { ...defaultPlanningState() });
  }
  return planningStateMap.get(fireTrialId) ?? defaultPlanningState();
}

export function approvePlanning(fireTrialId: string, approved: boolean): void {
  const current = getPlanningState(fireTrialId);
  planningStateMap.set(fireTrialId, {
    ...current,
    isApprovedByClient: approved,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function bumpPlanningVersion(fireTrialId: string): void {
  const current = getPlanningState(fireTrialId);
  planningStateMap.set(fireTrialId, {
    ...current,
    isApprovedByClient: false,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  });
}

export function getReadiness(fireTrialId: string): ProfilesReadinessState {
  if (!readinessStateMap.has(fireTrialId)) {
    readinessStateMap.set(fireTrialId, JSON.parse(JSON.stringify(defaultReadinessState())));
  }
  return readinessStateMap.get(fireTrialId) ?? defaultReadinessState();
}

export function setSeriesProfileReadiness(
  fireTrialId: string,
  profile: ExecutionProfile,
  seriesId: string,
  isReady: boolean,
  observations?: string,
): SeriesReadinessItem {
  const state = getReadiness(fireTrialId);
  let profileItem = state.profilesReadiness.find((p) => p.profile === profile);
  if (!profileItem) {
    profileItem = { profile, seriesReadiness: [] };
    state.profilesReadiness.push(profileItem);
  }
  const sIdx = profileItem.seriesReadiness.findIndex((s) => s.seriesId === seriesId);
  const updatedSeriesItem: SeriesReadinessItem = { seriesId, isReady, observations };
  if (sIdx >= 0) {
    profileItem.seriesReadiness[sIdx] = updatedSeriesItem;
  } else {
    profileItem.seriesReadiness.push(updatedSeriesItem);
  }
  readinessStateMap.set(fireTrialId, state);
  return updatedSeriesItem;
}

export function setProfileReadiness(
  fireTrialId: string,
  profile: ExecutionProfile,
  seriesReadiness: SeriesReadinessItem[],
): ProfileReadinessItem {
  const state = getReadiness(fireTrialId);
  const idx = state.profilesReadiness.findIndex((p) => p.profile === profile);
  const updated: ProfileReadinessItem = { profile, seriesReadiness };
  if (idx >= 0) {
    state.profilesReadiness[idx] = updated;
  } else {
    state.profilesReadiness.push(updated);
  }
  readinessStateMap.set(fireTrialId, state);
  return updated;
}

export function getJltPreparation(fireTrialId: string, _seriesId: string): JltPreparationState {
  if (!jltPreparationStateMap.has(fireTrialId)) {
    jltPreparationStateMap.set(fireTrialId, structuredClone(defaultJltPreparationState()));
  }
  const state = jltPreparationStateMap.get(fireTrialId) ?? defaultJltPreparationState();
  return structuredClone(state);
}

export function setJltReadiness(
  fireTrialId: string,
  sanitaryServicesReady: boolean,
  securityReady: boolean,
  vessel: boolean,
  observations?: string | null,
): JltReadinessItem {
  const current = getJltPreparation(fireTrialId, '');
  const updated: JltPreparationState = {
    ...current,
    jltReadiness: {
      sanitaryServicesReady,
      securityReady,
      vesselReady: vessel,
      observations: observations ?? null,
    },
  };

  const allTechnicalReady = Object.values(updated.technicalUnitsReadiness).every((flag) => !!flag?.isReady);
  updated.seriesIsReadyForExecution =
    updated.jltReadiness.sanitaryServicesReady &&
    updated.jltReadiness.securityReady &&
    updated.jltReadiness.vesselReady &&
    allTechnicalReady;

  jltPreparationStateMap.set(fireTrialId, updated);
  return updated.jltReadiness;
}

export function selectActiveShot(fireTrialId: string, shotId: string): void {
  const current = getExecutionState(fireTrialId);
  executionStateMap.set(fireTrialId, {
    ...current,
    activeShotId: shotId,
    activeShootId: shotId,
    updatedAt: new Date().toISOString(),
  });
}

export function registerFireShot(fireTrialId: string): void {
  const current = getExecutionState(fireTrialId);
  executionStateMap.set(fireTrialId, {
    ...current,
    updatedAt: new Date().toISOString(),
  });
}

export function getJltShotData(fireTrialId: string, seriesId: string, shotId: string): JltShotDataResponse {
  const state = getOrCreateJltShotDataMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = cloneJltShotDataState(defaultJltShotDataState());
    state.set(key, initial);
    return cloneJltShotDataState(initial);
  }

  return cloneJltShotDataState(current);
}

export function setJltShotData(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: JltShotDataPayload,
): JltShotDataResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const state = getOrCreateJltShotDataMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const updated = cloneJltShotDataState({
    jltData: {
      jet: payload.jet,
      pieceOperator: payload.pieceOperator,
      attackDistance: payload.attackDistance,
      attackDistanceUnit: payload.attackDistanceUnit,
      recoilDistance: payload.recoilDistance,
      recoilDistanceUnit: payload.recoilDistanceUnit,
      observations: payload.observations ?? null,
    },
  });

  state.set(key, updated);
  return cloneJltShotDataState(updated);
}

function defaultVelocitiesState(): ShotVelocitiesResponse {
  return getFixture<ShotVelocitiesResponse>('fixtures/execution', 'execution-velocities-fixture.json');
}

function cloneVelocitiesState(state: ShotVelocitiesResponse): ShotVelocitiesResponse {
  return structuredClone(state);
}

function getOrCreateVelocitiesMap(fireTrialId: string): Map<string, ShotVelocitiesResponse> {
  let state = velocitiesStateMap.get(fireTrialId);
  if (!state) {
    state = new Map<string, ShotVelocitiesResponse>();
    velocitiesStateMap.set(fireTrialId, state);
  }
  return state;
}

export function getShotVelocities(fireTrialId: string, seriesId: string, shotId: string): ShotVelocitiesResponse {
  const state = getOrCreateVelocitiesMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = cloneVelocitiesState(defaultVelocitiesState());
    state.set(key, initial);
    return cloneVelocitiesState(initial);
  }

  return cloneVelocitiesState(current);
}

export function setShotVelocity(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: ShotVelocityItem[] | ShotVelocitiesResponse,
): ShotVelocitiesResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const velocities: ShotVelocityItem[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.velocities)
      ? payload.velocities
      : [];

  const state = getOrCreateVelocitiesMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const updated: ShotVelocitiesResponse = {
    velocities: velocities.map((v) => ({
      radarDopplerId: v.radarDopplerId ?? null,
      antennaId: v.antennaId ?? null,
      initialVelocity: v.initialVelocity ?? null,
      initialVelocityUnit: v.initialVelocityUnit ?? 'M_S',
      softwareUncertainty: v.softwareUncertainty ?? null,
      softwareUncertaintyUnit: v.softwareUncertaintyUnit ?? 'M_S',
      cadence: v.cadence ?? null,
      cadenceUnit: v.cadenceUnit ?? 'SPM',
      velocityLoss: v.velocityLoss ?? null,
      velocityLossUnit: v.velocityLossUnit ?? 'M_S',
      observations: v.observations ?? null,
    })),
  };

  state.set(key, updated);
  return cloneVelocitiesState(updated);
}

// ==========================================
// DATA ENTRY - WIDGET 5 PRESSURES
// ==========================================

function defaultPressuresState(): ShotPressuresResponse {
  return getFixture<ShotPressuresResponse>('fixtures/execution', 'execution-pressures-fixture.json');
}

function clonePressuresState(state: ShotPressuresResponse): ShotPressuresResponse {
  return structuredClone(state);
}

function getOrCreatePressuresMap(fireTrialId: string): Map<string, ShotPressuresResponse> {
  let state = pressuresStateMap.get(fireTrialId);
  if (!state) {
    state = new Map<string, ShotPressuresResponse>();
    pressuresStateMap.set(fireTrialId, state);
  }
  return state;
}

export function getShotPressures(fireTrialId: string, seriesId: string, shotId: string): ShotPressuresResponse {
  const state = getOrCreatePressuresMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = clonePressuresState(defaultPressuresState());
    state.set(key, initial);
    return clonePressuresState(initial);
  }

  return clonePressuresState(current);
}

export function setShotPressure(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: ShotPressuresData,
): ShotPressuresResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const state = getOrCreatePressuresMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const updated: ShotPressuresResponse = {
    pressuresData: {
      piezoelectricSensorId: payload.piezoelectricSensorId ?? null,
      amplifierId: payload.amplifierId ?? null,
      dataAcquisitionSystemId: payload.dataAcquisitionSystemId ?? null,
      closingMaxPressure: payload.closingMaxPressure ?? null,
      closingMaxPressureUnit: payload.closingMaxPressureUnit ?? 'BAR',
      halfMaxPressure: payload.halfMaxPressure ?? null,
      halfMaxPressureUnit: payload.halfMaxPressureUnit ?? 'BAR',
      shellMaxPressure: payload.shellMaxPressure ?? null,
      shellMaxPressureUnit: payload.shellMaxPressureUnit ?? 'BAR',
      observations: payload.observations ?? null,
    },
  };

  state.set(key, updated);
  return clonePressuresState(updated);
}

// ── SHOT ARMAMENT tipos y store ───────────────────────────────────────────

export interface ArmamentEquipmentItem {
  id?: number;
  tag?: string;
  serialNumber?: string;
  denominationId?: number;
  denominationName?: string;
  modelName?: string;
}

export interface ShotArmamentData {
  weapon?: ArmamentEquipmentItem | null;
  tube?: ArmamentEquipmentItem | null;
  observations?: string | null;
}

export interface ShotArmamentResponse {
  armamentData?: ShotArmamentData;
}

export interface ArmamentBulkConfigurationRequest {
  assignedSeriesIds: string[];
  weaponId?: number | null;
  tubeId?: number | null;
  observations?: string | null;
}

function defaultArmamentState(): ShotArmamentResponse {
  return getFixture<ShotArmamentResponse>('fixtures/execution', 'execution-armament-fixture.json');
}

function cloneArmamentState(state: ShotArmamentResponse): ShotArmamentResponse {
  return structuredClone(state);
}

function getOrCreateArmamentMap(fireTrialId: string): Map<string, ShotArmamentResponse> {
  let state = armamentStateMap.get(fireTrialId);
  if (!state) {
    state = new Map<string, ShotArmamentResponse>();
    armamentStateMap.set(fireTrialId, state);
  }
  return state;
}

export function getShotArmament(fireTrialId: string, seriesId: string, shotId: string): ShotArmamentResponse {
  const state = getOrCreateArmamentMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = cloneArmamentState(defaultArmamentState());
    state.set(key, initial);
    return cloneArmamentState(initial);
  }

  return cloneArmamentState(current);
}

export function setShotArmament(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: { weaponId?: number | null; tubeId?: number | null; observations?: string | null },
): ShotArmamentResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const state = getOrCreateArmamentMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key) ?? defaultArmamentState();

  const weapon: ArmamentEquipmentItem | null = payload.weaponId
    ? {
        id: payload.weaponId,
        tag: `IT-000${payload.weaponId}`,
        serialNumber: `SN-W-${payload.weaponId}`,
        denominationId: payload.weaponId,
        denominationName: `ARMA ${payload.weaponId}`,
        modelName: 'M1',
      }
    : null;

  const tube: ArmamentEquipmentItem | null = payload.tubeId
    ? {
        id: payload.tubeId,
        tag: `IT-000${payload.tubeId}`,
        serialNumber: `SN-T-${payload.tubeId}`,
        denominationId: payload.tubeId,
        denominationName: `TUBO ${payload.tubeId}`,
        modelName: 'M1',
      }
    : null;

  const updated: ShotArmamentResponse = {
    armamentData: {
      weapon: payload.weaponId !== undefined ? weapon : (current.armamentData?.weapon ?? null),
      tube: payload.tubeId !== undefined ? tube : (current.armamentData?.tube ?? null),
      observations:
        payload.observations !== undefined ? payload.observations : (current.armamentData?.observations ?? null),
    },
  };

  state.set(key, updated);
  return cloneArmamentState(updated);
}

export function applyArmamentBulkConfiguration(fireTrialId: string, payload: ArmamentBulkConfigurationRequest): void {
  const progress = getExecutionProgressFixture();
  const state = getOrCreateArmamentMap(fireTrialId);

  const weapon: ArmamentEquipmentItem | null = payload.weaponId
    ? {
        id: payload.weaponId,
        tag: `IT-000${payload.weaponId}`,
        serialNumber: `SN-W-${payload.weaponId}`,
        denominationId: payload.weaponId,
        denominationName: `ARMA ${payload.weaponId}`,
        modelName: 'M1',
      }
    : null;

  const tube: ArmamentEquipmentItem | null = payload.tubeId
    ? {
        id: payload.tubeId,
        tag: `IT-000${payload.tubeId}`,
        serialNumber: `SN-T-${payload.tubeId}`,
        denominationId: payload.tubeId,
        denominationName: `TUBO ${payload.tubeId}`,
        modelName: 'M1',
      }
    : null;

  for (const series of progress.series) {
    if (payload.assignedSeriesIds.includes(series.seriesId)) {
      for (const shot of series.shots) {
        if (shot.status !== 'FIRED') {
          const key = `${series.seriesId}|${shot.shotId}`;
          const current = state.get(key) ?? defaultArmamentState();
          const updated: ShotArmamentResponse = {
            armamentData: {
              weapon: payload.weaponId !== undefined ? weapon : (current.armamentData?.weapon ?? null),
              tube: payload.tubeId !== undefined ? tube : (current.armamentData?.tube ?? null),
              observations:
                payload.observations !== undefined
                  ? payload.observations
                  : (current.armamentData?.observations ?? null),
            },
          };
          state.set(key, updated);
        }
      }
    }
  }
}

// ── SHOT MUNITION tipos y store (Widget 20) ────────────────────────────────

export interface ShotMunitionIdentificationData {
  denominationId?: string | null;
  batch?: string | null;
  clientNumber?: string | null;
  fuseWorkingModeId?: string | null;
  fuseGraduation?: number | null;
  fuseGraduationUnit?: string | null;
  loadingZone?: string | null;
  modules?: number | null;
  observations?: string | null;
}

export interface ShotMunitionWeightData {
  balanceId?: number | null;
  weight?: number | null;
  weightUnit?: string | null;
  weightAdded?: number | null;
  weightAddedUnit?: string | null;
  weightRemoved?: number | null;
  weightRemovedUnit?: string | null;
  weighingDateTime?: string | null;
  weighingRange?: string | null;
  observations?: string | null;
}

export interface ShotMunitionConditioningData {
  climaticChamberId?: number | null;
  chamberEntryDateTime?: string | null;
  chamberExitDateTime?: string | null;
  temperature?: number | null;
  temperatureUnit?: string | null;
  programmedTemperature?: number | null;
  programmedTemperatureUnit?: string | null;
  chamberTime?: string | null;
  observations?: string | null;
}

export interface ShotMunitionComponent {
  componentId: string;
  identificationData?: ShotMunitionIdentificationData | null;
  weightData?: ShotMunitionWeightData | null;
  conditioningData?: ShotMunitionConditioningData | null;
}

export interface ShotMunitionResponse {
  munitionData: ShotMunitionComponent[];
}

export interface ShotMunitionRequest {
  components: ShotMunitionComponent[];
}

function defaultMunitionState(): ShotMunitionResponse {
  return getFixture<ShotMunitionResponse>('fixtures/execution', 'execution-munition-fixture.json');
}

function cloneMunitionState(state: ShotMunitionResponse): ShotMunitionResponse {
  return structuredClone(state);
}

function getOrCreateMunitionMap(fireTrialId: string): Map<string, ShotMunitionResponse> {
  let state = munitionStateMap.get(fireTrialId);
  if (!state) {
    state = new Map<string, ShotMunitionResponse>();
    munitionStateMap.set(fireTrialId, state);
  }
  return state;
}

export function getShotMunition(fireTrialId: string, seriesId: string, shotId: string): ShotMunitionResponse {
  const state = getOrCreateMunitionMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = cloneMunitionState(defaultMunitionState());
    state.set(key, initial);
    return cloneMunitionState(initial);
  }

  return cloneMunitionState(current);
}

export function setShotMunition(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: ShotMunitionRequest,
): ShotMunitionResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED' && shotProgress.status !== 'PENDING') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const state = getOrCreateMunitionMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;

  const updated: ShotMunitionResponse = {
    munitionData: (payload.components || []).map((comp) => ({
      componentId: comp.componentId,
      identificationData: comp.identificationData ?? null,
      weightData: comp.weightData
        ? {
            ...comp.weightData,
            weighingRange: comp.weightData.weighingRange ?? '300,00-500,00g',
          }
        : null,
      conditioningData: comp.conditioningData
        ? {
            ...comp.conditioningData,
            temperature: comp.conditioningData.temperature ?? 20,
            temperatureUnit: comp.conditioningData.temperatureUnit ?? 'CELSIUS',
            programmedTemperature: comp.conditioningData.programmedTemperature ?? 21,
            programmedTemperatureUnit: comp.conditioningData.programmedTemperatureUnit ?? 'CELSIUS',
            chamberTime: comp.conditioningData.chamberTime ?? '02:30:00',
          }
        : null,
    })),
  };

  state.set(key, updated);
  return cloneMunitionState(updated);
}

// ── SHOT MANOMETER PRESSURES tipos y store (Widget 21) ───────────────────────

export interface ShotManometerPressures {
  pressureGaugeId?: string | null;
  crusherId?: string | null;
  probeId?: string | null;
  h1?: number | null;
  h1Unit?: string | null;
  h2?: number | null;
  h2Unit?: string | null;
  h3?: number | null;
  h3Unit?: string | null;
  h4?: number | null;
  h4Unit?: string | null;
  h5?: number | null;
  h5Unit?: string | null;
  observations?: string | null;
}

export interface ShotManometerPressuresResponse {
  manometerPressuresData?: ShotManometerPressures | null;
}

export type ShotManometerPressuresRequest = ShotManometerPressures;

function defaultManometerPressuresState(): ShotManometerPressuresResponse {
  return getFixture<ShotManometerPressuresResponse>('fixtures/execution', 'execution-manometer-pressures-fixture.json');
}

function cloneManometerPressuresState(state: ShotManometerPressuresResponse): ShotManometerPressuresResponse {
  return structuredClone(state);
}

function getOrCreateManometerPressuresMap(fireTrialId: string): Map<string, ShotManometerPressuresResponse> {
  let state = manometerPressuresStateMap.get(fireTrialId);
  if (!state) {
    state = new Map<string, ShotManometerPressuresResponse>();
    manometerPressuresStateMap.set(fireTrialId, state);
  }
  return state;
}

export function getShotManometerPressures(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
): ShotManometerPressuresResponse {
  const state = getOrCreateManometerPressuresMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;
  const current = state.get(key);

  if (!current) {
    const initial = cloneManometerPressuresState(defaultManometerPressuresState());
    state.set(key, initial);
    return cloneManometerPressuresState(initial);
  }

  return cloneManometerPressuresState(current);
}

export function setShotManometerPressures(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  payload: ShotManometerPressuresRequest,
): ShotManometerPressuresResponse {
  const shotProgress = getShotProgress(seriesId, shotId);
  if (!shotProgress) {
    throw new Error('SHOT_NOT_FOUND');
  }

  if (shotProgress.status !== 'ACTIVE' && shotProgress.status !== 'FIRED' && shotProgress.status !== 'PENDING') {
    throw new Error('SHOT_NOT_EDITABLE');
  }

  const state = getOrCreateManometerPressuresMap(fireTrialId);
  const key = `${seriesId}|${shotId}`;

  const updated: ShotManometerPressuresResponse = {
    manometerPressuresData: {
      pressureGaugeId: payload.pressureGaugeId ?? null,
      crusherId: payload.crusherId ?? null,
      probeId: payload.probeId ?? null,
      h1: payload.h1 ?? null,
      h1Unit: payload.h1Unit ?? 'UM',
      h2: payload.h2 ?? null,
      h2Unit: payload.h2Unit ?? 'UM',
      h3: payload.h3 ?? null,
      h3Unit: payload.h3Unit ?? 'UM',
      h4: payload.h4 ?? null,
      h4Unit: payload.h4Unit ?? 'UM',
      h5: payload.h5 ?? null,
      h5Unit: payload.h5Unit ?? 'UM',
      observations: payload.observations ?? null,
    },
  };

  state.set(key, updated);
  return cloneManometerPressuresState(updated);
}
