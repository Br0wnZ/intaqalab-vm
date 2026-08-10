import { getFixture } from '../../utils';

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

const executionStateMap = new Map<string, ExecutionState>();
const countdownStateMap = new Map<string, SecurityCountdownState>();
const planningStateMap = new Map<string, PlanningState>();
const readinessStateMap = new Map<string, ProfilesReadinessState>();

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

export function getExecutionState(fireTrialId: string): ExecutionState {
  if (!executionStateMap.has(fireTrialId)) {
    const initial = { ...defaultExecutionState() };
    executionStateMap.set(fireTrialId, {
      ...initial,
      activeShootId: initial.activeShotId,
    });
  }
  const state = executionStateMap.get(fireTrialId) ?? defaultExecutionState();
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

