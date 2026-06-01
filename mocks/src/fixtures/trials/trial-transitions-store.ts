import { getFixture } from '../../utils';

type TrialStatus =
  | 'UNDER_REVIEW'
  | 'PLANNED'
  | 'PREPARED'
  | 'IN_PROGRESS'
  | 'INTERRUPTED'
  | 'STARTED'
  | 'EXECUTED'
  | 'ANALYZING'
  | 'FINALIZING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'VOIDED'
  | 'DELETED';

interface TrialOverride {
  status: TrialStatus;
  statusReason?: string;
}

const trialOverrideMap = new Map<string, TrialOverride>();

export function setTrialStatus(trialId: string, status: TrialStatus, reason?: string): void {
  trialOverrideMap.set(trialId, { status, ...(reason ? { statusReason: reason } : {}) });
}

export function applyTrialOverride<T extends { id: string; status: string; statusReason?: string }>(trial: T): T {
  const override = trialOverrideMap.get(trial.id);
  if (!override) return trial;
  return { ...trial, status: override.status, statusReason: override.statusReason ?? trial.statusReason };
}

export function getTrialById(id: string): Record<string, unknown> | null {
  const trials = getFixture('fixtures/trials', 'trials-fixture.json') as Array<Record<string, unknown>>;
  const trial = trials.find((t) => t['id'] === id);
  if (!trial) return null;
  return applyTrialOverride(trial as { id: string; status: string; statusReason?: string }) as Record<string, unknown>;
}
