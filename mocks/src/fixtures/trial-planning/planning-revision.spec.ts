import type { Request } from 'express';
import { describe, expect, it } from 'vitest';

import { getFixture } from '../../utils';
import { getArmamentDispatcher, updateArmamentDispatcher } from '../armament/trial-armament-dispatcher';
import type { PlanningChange } from '../execution/planning-changes-store';
import { applyPlanningChanges, createPlanningChanges } from '../execution/planning-changes-store';
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
  it('should use the execution progress shot identities in the armament fixture', () => {
    const progress = getFixture<{
      series: { seriesId: string; shots: { shotId: string; status: string }[] }[];
    }>('fixtures/execution', 'execution-progress-fixture.json');
    const armament = getArmamentDispatcher(request({ revision: 'execution' }, 'armament-identity-regression'));
    const progressShots = new Set(progress.series.flatMap((series) => series.shots.map((shot) => shot.shotId)));
    const armamentShots = armament.series.flatMap((series) => series.shots.map((shot) => shot.shotId));
    const firedShots = progress.series.flatMap((series) =>
      series.shots.filter((shot) => shot.status === 'FIRED').map((shot) => shot.shotId),
    );

    expect(armamentShots.length).toBeGreaterThan(0);
    expect(armamentShots.every((shotId) => progressShots.has(shotId))).toBe(true);
    expect(firedShots.length).toBeGreaterThan(0);
    expect(firedShots.every((shotId) => armamentShots.includes(shotId))).toBe(true);
  });

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
  it('should project conditions by resourceId instead of display labels or shot metadata', () => {
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

    const projected = projectConditions(baseline, [change({ resourceId: 's1', shotId: 's2', affectedShots: ['D2'] })]);

    expect(projected.series[0]?.shots?.map((s) => s['elevation'])).toEqual([50, 45]);
    expect(baseline.series[0]?.shots[0]?.elevation).toBe(45);
  });

  it('should project planning-info unit changes onto the conditions units object', () => {
    const baseline = { units: { elevation: 'DEGREES' }, series: [] };
    const projected = projectConditions(baseline, [
      change({ resourceType: 'PLANNING_INFO', field: 'elevationUnit', newValue: 'MILS' }),
    ]);

    expect(projected.units.elevation).toBe('MILS');
  });

  it('should ignore fields that do not exist in the baseline resource', () => {
    const baseline = { series: [{ shots: [{ shotId: 's1', globalNumber: 1, elevation: 45 }] }] };
    expect(projectConditions(baseline, [change({ resourceId: 's1', field: 'unknownField' })])).toEqual(baseline);
  });

  it('should project planning info top-level fields', () => {
    const projected = projectPlanningInfo({ goal: 'old' }, [
      change({ resourceType: 'PLANNING_INFO', field: 'goal', newValue: 'new' }),
    ]);
    expect(projected.goal).toBe('new');
  });

  it('should project flattened planning-info paths into nested date-control and rating-criteria fields', () => {
    const baseline = {
      dateControl: { maxEmissionDates: 3, daysSignReport: 7 },
      ratingCriteria: { v0c: { useful1Min: 10 } },
      ratingCriteriaUnits: { speedUnit: 'M_S' },
    };
    const projected = projectPlanningInfo(baseline, [
      change({ resourceType: 'PLANNING_INFO', field: 'maxEmissionDates', newValue: '5' }),
      change({ resourceType: 'PLANNING_INFO', field: 'ratingCriteria.v0c.useful1Min', newValue: '12.5' }),
      change({ resourceType: 'PLANNING_INFO', field: 'speedUnit', newValue: 'KM_H' }),
    ]);

    expect(projected.dateControl.maxEmissionDates).toBe(5);
    expect(projected.ratingCriteria.v0c.useful1Min).toBe(12.5);
    expect(projected.ratingCriteriaUnits.speedUnit).toBe('KM_H');
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

  it('should never substitute shotId for armament resourceId', () => {
    const baseline = {
      series: [
        {
          shots: [
            { shotId: 's1', armament: { id: 'armament-1', observations: 'a' } },
            { shotId: 's2', armament: { id: 'armament-2', observations: 'a' } },
          ],
        },
      ],
    };
    const projected = projectArmament(baseline, [
      change({ resourceType: 'ARMAMENT', resourceId: 's2', shotId: 's2', field: 'observations', newValue: 'b' }),
    ]);
    expect(projected).toEqual(baseline);
  });

  it('should distinguish armament assignment IDs even when weapons and tubes are shared', () => {
    const baseline = {
      series: [
        {
          shots: [
            {
              shotId: 's1',
              armament: { id: 'armament-1', weaponExternalId: 101, tubeExternalId: 501, observations: 'a' },
            },
            {
              shotId: 's2',
              armament: { id: 'armament-2', weaponExternalId: 101, tubeExternalId: 501, observations: 'a' },
            },
          ],
        },
      ],
    };
    const projected = projectArmament(baseline, [
      change({
        resourceType: 'ARMAMENT',
        resourceId: 'armament-2',
        shotId: 's1',
        field: 'observations',
        newValue: 'b',
      }),
    ]);

    expect(projected.series[0]?.shots.map((shot) => shot.armament.observations)).toEqual(['a', 'b']);
    expect(baseline.series[0]?.shots.map((shot) => shot.armament.observations)).toEqual(['a', 'a']);
  });

  it('should project armament changes by armament resource id', () => {
    const baseline = {
      series: [{ shots: [{ shotId: 's1', armament: { id: 'armament-1', tubeLifePercentage: 75 } }] }],
    };
    const projected = projectArmament(baseline, [
      change({
        resourceType: 'ARMAMENT',
        resourceId: 'armament-1',
        shotId: null,
        field: 'lifeUsefulPercentage',
        newValue: '61.5',
      }),
    ]);

    expect(projected.series[0]?.shots[0]?.armament?.['tubeLifePercentage']).toBe(61.5);
  });

  it('should ignore non accepted changes via getAcceptedChanges filter', () => {
    const draft = change({ status: 'DRAFT' });
    expect([draft].filter((c) => c.status === 'ACCEPTED')).toEqual([]);
  });
});

describe('armament identity in mock persistence', () => {
  it('should expose stable assignment UUIDs that differ from shot and catalog identities', () => {
    const baseline = getArmamentDispatcher(request({ revision: 'baseline' }, 'armament-resource-identities'));
    const shots = baseline.series.flatMap((series) => series.shots);
    const ids = shots.map((shot) => shot.armament?.id);

    expect(shots.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(shots.length);
    for (const shot of shots) {
      expect(shot.armament?.id).toMatch(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
      expect(shot.armament?.id).not.toBe(shot.shotId);
      expect(shot.armament?.id).not.toBe(String(shot.armament?.weaponExternalId));
      expect(shot.armament?.id).not.toBe(String(shot.armament?.tubeExternalId));
    }
  });

  it('should create and apply an armament change by assignment ID without mutating baseline', () => {
    const trialId = 'armament-create-apply-roundtrip';
    const baseline = structuredClone(getArmamentDispatcher(request({ revision: 'baseline' }, trialId)));
    const target = baseline.series[0]?.shots[1];
    if (!target?.armament) throw new Error('Expected persisted armament assignment');
    const created = createPlanningChanges(trialId, [
      {
        resourceType: 'ARMAMENT',
        resourceId: target.armament.id,
        field: 'observations',
        operation: 'UPDATE',
        oldValue: target.armament.observations ?? null,
        newValue: 'Updated through planning changes',
      },
    ]);
    const draft = created?.[0];
    if (!draft) throw new Error('Expected created armament change');
    expect(draft.resourceId).toBe(target.armament.id);
    expect(draft.shotId).toBeNull();
    applyPlanningChanges(trialId, [{ id: draft.id, requiresApproval: false, requestClient: false }]);

    const projected = getArmamentDispatcher(request({ revision: 'execution' }, trialId));
    const shots = projected.series.flatMap((series) => series.shots);
    expect(shots.find((shot) => shot.shotId === target.shotId)?.armament).toEqual({
      ...target.armament,
      observations: 'Updated through planning changes',
    });
    expect(shots.filter((shot) => shot.shotId !== target.shotId)).toEqual(
      baseline.series.flatMap((series) => series.shots).filter((shot) => shot.shotId !== target.shotId),
    );
    expect(getArmamentDispatcher(request({ revision: 'baseline' }, trialId))).toEqual(baseline);
  });

  it('should preserve armament identity when ordinary planning updates change its fields', () => {
    const trialId = 'armament-update-preserves-identity';
    const baseline = getArmamentDispatcher(request({ revision: 'baseline' }, trialId));
    const target = baseline.series[0]?.shots[0];
    if (!target?.armament) throw new Error('Expected armament assignment');
    const armamentId = target.armament.id;
    const update = request({}, trialId);
    update.body = { shots: [{ shotId: target.shotId, weaponExternalId: 909, observations: 'Updated fields' }] };

    const result = updateArmamentDispatcher(update);
    expect(result.series[0]?.shots[0]?.armament).toMatchObject({
      id: armamentId,
      weaponExternalId: 909,
      observations: 'Updated fields',
    });
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
