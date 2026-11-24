import type { Request } from 'express';
import { describe, expect, it } from 'vitest';

import type { PlanningChange } from '../execution/planning-changes-store';
import { getAcceptedChanges, resolveRevision } from './planning-revision';
import {
  projectArmament,
  projectConditions,
  projectMunitions,
  projectPlanningInfo,
} from './planning-revision-projectors';
import { conditionsDispatcher } from './shooting-conditions-dispatcher';

const SEEDED_TRIAL_ID = 'c6c5fbc6-5f6e-8a7b-2c5d-5e6f7a8b9c0d';

function request(query: Record<string, unknown>, fireTrialId = SEEDED_TRIAL_ID): Request {
  return { query, params: { fireTrialId } } as unknown as Request;
}

function change(overrides: Partial<PlanningChange>): PlanningChange {
  return {
    id: 'c1',
    resourceType: 'SHOT_CONDITIONS',
    resourceId: 'r1',
    seriesId: null,
    shotId: null,
    field: 'elevation',
    operation: 'UPDATE',
    oldValue: '45',
    newValue: '50',
    affectedShots: ['D1'],
    status: 'ACCEPTED',
    requiresApproval: false,
    requestClient: false,
    createdBy: 'u',
    createdAt: '2026-01-01T00:00:00.000Z',
    decidedBy: null,
    decidedAt: null,
    ...overrides,
  };
}

describe('resolveRevision', () => {
  it('should default to baseline when the param is missing', () => {
    expect(resolveRevision(request({}))).toBe('baseline');
  });

  it('should return execution when revision=execution', () => {
    expect(resolveRevision(request({ revision: 'execution' }))).toBe('execution');
  });

  it('should fall back to baseline for unsupported values', () => {
    expect(resolveRevision(request({ revision: 'other' }))).toBe('baseline');
    expect(resolveRevision(request({ revision: ['execution', 'baseline'] }))).toBe('execution');
  });
});

describe('getAcceptedChanges', () => {
  it('should return only ACCEPTED changes of the requested resource types', () => {
    const changes = getAcceptedChanges(SEEDED_TRIAL_ID, 'SHOT_CONDITIONS');
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.every((c) => c.status === 'ACCEPTED' && c.resourceType === 'SHOT_CONDITIONS')).toBe(true);
  });

  it('should return no changes for trials without changes', () => {
    expect(getAcceptedChanges('unknown-trial', 'SHOT_CONDITIONS')).toEqual([]);
  });
});

describe('projectors', () => {
  it('should project accepted conditions by shot label without mutating the baseline', () => {
    const baseline = {
      series: [
        {
          shots: [
            { shotId: 's1', globalNumber: 1, elevation: 45 },
            { shotId: 's2', globalNumber: 2, elevation: 45 },
          ],
        },
      ],
    };

    const projected = projectConditions(baseline, [change({})]);

    expect(projected.series[0]?.shots?.map((s) => s['elevation'])).toEqual([50, 45]);
    expect(baseline.series[0]?.shots[0]?.elevation).toBe(45);
  });

  it('should ignore fields that do not exist in the baseline resource', () => {
    const baseline = { series: [{ shots: [{ shotId: 's1', globalNumber: 1, elevation: 45 }] }] };
    expect(projectConditions(baseline, [change({ field: 'unknownField' })])).toEqual(baseline);
  });

  it('should project planning info top-level fields', () => {
    const projected = projectPlanningInfo({ goal: 'old' }, [
      change({ resourceType: 'PLANNING_INFO', field: 'goal', newValue: 'new' }),
    ]);
    expect(projected.goal).toBe('new');
  });

  it('should project munition configuration and component changes by resource id', () => {
    const baseline = {
      series: [{ configurations: [{ id: 'm1', batch: 'A', components: [{ id: 'c1', batch: 'X' }] }] }],
    };
    const projected = projectMunitions(baseline, [
      change({ resourceType: 'MUNITION', resourceId: 'm1', field: 'batch', newValue: 'B' }),
      change({ resourceType: 'MUNITION_COMPONENT', resourceId: 'c1', field: 'batch', newValue: 'Y' }),
    ]);
    expect(projected.series[0]?.configurations?.[0]?.batch).toBe('B');
    expect(projected.series[0]?.configurations?.[0]?.components?.[0]?.['batch']).toBe('Y');
  });

  it('should project armament changes only for the matching shot id', () => {
    const baseline = {
      series: [
        {
          shots: [
            { shotId: 's1', armament: { observations: 'a' } },
            { shotId: 's2', armament: { observations: 'a' } },
          ],
        },
      ],
    };
    const projected = projectArmament(baseline, [
      change({ resourceType: 'ARMAMENT', shotId: 's2', field: 'observations', newValue: 'b' }),
    ]);
    expect(projected.series[0]?.shots?.map((s) => s.armament?.['observations'])).toEqual(['a', 'b']);
  });

  it('should ignore non accepted changes via getAcceptedChanges filter', () => {
    const draft = change({ status: 'DRAFT' });
    expect([draft].filter((c) => c.status === 'ACCEPTED')).toEqual([]);
  });
});

describe('conditionsDispatcher', () => {
  it('should return the baseline fixture by default', () => {
    const baseline = conditionsDispatcher(request({}));
    const explicit = conditionsDispatcher(request({ revision: 'baseline' }));
    expect(baseline).toEqual(explicit);
  });

  it('should return execution data that differs from baseline for revision=execution', () => {
    const baseline = conditionsDispatcher(request({ revision: 'baseline' }));
    const execution = conditionsDispatcher(request({ revision: 'execution' }));
    expect(execution).not.toEqual(baseline);
  });

  it('should project seeded accepted changes in the execution revision', () => {
    const execution = conditionsDispatcher(request({ revision: 'execution' })) as {
      series: Array<{ shots: Array<{ globalNumber: number; elevation: number }> }>;
    };
    const shot1 = execution.series.flatMap((s) => s.shots).find((s) => s.globalNumber === 1);
    expect(shot1?.elevation).toBe(47);
  });
});
