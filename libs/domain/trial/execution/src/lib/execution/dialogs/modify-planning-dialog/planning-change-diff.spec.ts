import type { PlanningFormSnapshotEvent } from '@intaqalab/planning';
import { describe, expect, it } from 'vitest';

import { toCreatePlanningChangesRequest } from '../../../data-access/planning-modifications/planning-changes.mapper';
import { diffPlanningFormSnapshot } from './planning-change-diff';

const context = { fireTrialId: 'trial-1' };

describe('diffPlanningFormSnapshot', () => {
  it('should retain entity IDs for comparison and persistence instead of sending display names', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'munitions',
      baseline: {
        series: [{ configurations: [{ id: 'configuration-1', denomination: { id: 'old-id', name: 'Old name' } }] }],
        persistedConfigurationIds: ['configuration-1'],
      },
      current: {
        series: [{ configurations: [{ id: 'configuration-1', denomination: { id: 'new-id', name: 'New name' } }] }],
      },
    };
    const changes = diffPlanningFormSnapshot(event, context);

    expect(changes).toEqual([expect.objectContaining({ previousValue: 'old-id', newValue: 'new-id' })]);
    expect(toCreatePlanningChangesRequest(changes)).toEqual({
      changes: [
        {
          resourceType: 'MUNITION',
          resourceId: 'configuration-1',
          field: 'denominationId',
          operation: 'UPDATE',
          oldValue: 'old-id',
          newValue: 'new-id',
        },
      ],
    });
  });

  it('should map general information changes to the trial resource identity', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'general-data',
      baseline: {
        model: { goal: 'Initial goal', requeriments: 'Initial requirements' },
        ratingCriteria: { v0c: { useful1Min: 3.456789 } },
        ratingCriteriaUnits: { speedUnit: 'M_S' },
      },
      current: {
        model: { goal: 'Updated goal', requeriments: 'Initial requirements' },
        ratingCriteria: { v0c: { useful1Min: 3.456789 } },
        ratingCriteriaUnits: { speedUnit: 'M_S' },
      },
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({
        section: 'general-data',
        resourceType: 'PLANNING_INFO',
        resourceId: 'trial-1',
        field: 'goal',
        previousValue: 'Initial goal',
        newValue: 'Updated goal',
        persistable: true,
      }),
    ]);
  });

  it('should detect conditions by shotId and assign global units to the trial resource', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'shooting-conditions',
      baseline: {
        series: [{ shots: [{ shotId: 'shot-1', elevation: 10, elevationUnit: 'DEGREES' }] }],
        units: { elevationUnit: 'DEGREES' },
        rawSeries: [{ shots: [{ shotId: 'shot-1', elevation: null }] }],
        rawUnits: { elevation: null },
      },
      current: {
        series: [{ shots: [{ shotId: 'shot-1', elevation: 12, elevationUnit: 'MILS' }] }],
        units: { elevationUnit: 'MILS' },
      },
    };

    const changes = diffPlanningFormSnapshot(event, context);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceType: 'SHOT_CONDITIONS',
          resourceId: 'shot-1',
          field: 'elevation',
          previousValue: null,
          newValue: 12,
          persistable: true,
        }),
        expect.objectContaining({
          resourceType: 'PLANNING_INFO',
          resourceId: 'trial-1',
          field: 'elevationUnit',
          previousValue: null,
          newValue: 'MILS',
          persistable: true,
        }),
      ]),
    );
  });

  it('should identify condition changes affecting an executed shot separately from unsupported contracts', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'shooting-conditions',
      baseline: { series: [{ shots: [{ shotId: 'shot-fired', elevation: 45 }] }] },
      current: { series: [{ shots: [{ shotId: 'shot-fired', elevation: 44 }] }] },
    };

    expect(diffPlanningFormSnapshot(event, { ...context, executedShotIds: ['shot-fired'] })).toEqual([
      expect.objectContaining({
        resourceType: 'SHOT_CONDITIONS',
        resourceId: 'shot-fired',
        field: 'elevation',
        persistable: false,
        localOnlyReason: 'EXECUTED_SHOT',
      }),
    ]);
  });

  it('should use the persisted configuration id for munition changes and keep new configurations local-only', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'munitions',
      baseline: {
        series: [
          {
            configurations: [
              { id: 'configuration-1', batch: 'OLD' },
              { id: 'local-configuration', batch: '' },
            ],
          },
        ],
        persistedConfigurationIds: ['configuration-1'],
        rawConfigurations: [{ id: 'configuration-1', batch: 'OLD' }],
      },
      current: {
        series: [
          {
            configurations: [
              { id: 'configuration-1', batch: 'NEW' },
              { id: 'local-configuration', batch: 'LOCAL' },
            ],
          },
        ],
        persistedConfigurationIds: ['configuration-1'],
      },
    };

    const changes = diffPlanningFormSnapshot(event, context);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceType: 'MUNITION',
          resourceId: 'configuration-1',
          field: 'batch',
          persistable: true,
        }),
        expect.objectContaining({
          resourceType: 'MUNITION',
          resourceId: 'local-configuration',
          field: 'batch',
          persistable: false,
        }),
      ]),
    );
  });

  it('should keep munition updates local-only when configuration affects an executed shot', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'munitions',
      baseline: {
        series: [
          {
            configurations: [{ id: 'configuration-1', batch: 'OLD', assignedShotIds: ['shot-fired', 'shot-planned'] }],
          },
        ],
        persistedConfigurationIds: ['configuration-1'],
        rawConfigurations: [{ id: 'configuration-1', batch: 'OLD', assignedShotIds: ['shot-fired', 'shot-planned'] }],
      },
      current: {
        series: [
          {
            configurations: [{ id: 'configuration-1', batch: 'NEW', assignedShotIds: ['shot-fired', 'shot-planned'] }],
          },
        ],
        persistedConfigurationIds: ['configuration-1'],
      },
    };

    expect(diffPlanningFormSnapshot(event, { ...context, executedShotIds: ['shot-fired'] })).toEqual([
      expect.objectContaining({
        resourceType: 'MUNITION',
        resourceId: 'configuration-1',
        field: 'batch',
        affectedShots: ['shot-fired', 'shot-planned'],
        persistable: false,
      }),
    ]);
  });

  it('should require armament.id and never substitute shotId as resourceId', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'armament',
      baseline: [{ shots: [{ shotId: 'shot-1', armament: { observations: 'Old' } }] }],
      current: [{ shots: [{ shotId: 'shot-1', armament: { observations: 'New' } }] }],
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({
        section: 'armament',
        resourceType: 'ARMAMENT',
        resourceId: null,
        field: 'observations',
        persistable: false,
        affectedShots: ['shot-1'],
      }),
    ]);
  });

  it('should report changed component values under the owning configuration resource id', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'munitions',
      baseline: {
        series: [{ configurations: [{ id: 'configuration-1', components: [{ id: 'component-1', batch: 'OLD' }] }] }],
        persistedConfigurationIds: ['configuration-1'],
        rawConfigurations: [{ id: 'configuration-1', components: [{ id: 'component-1', batch: 'OLD' }] }],
      },
      current: {
        series: [{ configurations: [{ id: 'configuration-1', components: [{ id: 'component-1', batch: 'NEW' }] }] }],
        persistedConfigurationIds: ['configuration-1'],
      },
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({
        resourceType: 'MUNITION_COMPONENT',
        resourceId: 'configuration-1',
        field: 'batch',
        previousValue: 'OLD',
        newValue: 'NEW',
        persistable: false,
      }),
    ]);
  });

  it('should use exact backend values as oldValue when editable models contain display defaults', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'munitions',
      baseline: {
        series: [{ configurations: [{ id: 'configuration-1', maxAllowedErrors: 0 }] }],
        persistedConfigurationIds: ['configuration-1'],
        rawConfigurations: [{ id: 'configuration-1', maxAllowedErrors: null }],
      },
      current: {
        series: [{ configurations: [{ id: 'configuration-1', maxAllowedErrors: 1 }] }],
        persistedConfigurationIds: ['configuration-1'],
      },
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({ field: 'maxAllowedErrors', previousValue: null, newValue: 1, persistable: true }),
    ]);
  });

  it('should use armament.id when the backend includes it', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'armament',
      baseline: [{ shots: [{ shotId: 'shot-1', armament: { id: 'armament-1', observations: 'Old' } }] }],
      current: [{ shots: [{ shotId: 'shot-1', armament: { id: 'armament-1', observations: 'New' } }] }],
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({ resourceId: 'armament-1', field: 'observations', persistable: true }),
    ]);
  });

  it('should deduplicate shared armament changes and block updates affecting executed shots', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'armament',
      baseline: [
        {
          shots: [
            { shotId: 'shot-fired', armament: { id: 'armament-1', observations: 'Old' } },
            { shotId: 'shot-planned', armament: { id: 'armament-1', observations: 'Old' } },
          ],
        },
      ],
      current: [
        {
          shots: [
            { shotId: 'shot-fired', armament: { id: 'armament-1', observations: 'New' } },
            { shotId: 'shot-planned', armament: { id: 'armament-1', observations: 'New' } },
          ],
        },
      ],
    };

    expect(diffPlanningFormSnapshot(event, { ...context, executedShotIds: ['shot-fired'] })).toEqual([
      expect.objectContaining({
        resourceType: 'ARMAMENT',
        resourceId: 'armament-1',
        field: 'observations',
        affectedShots: ['shot-fired', 'shot-planned'],
        persistable: false,
      }),
    ]);
  });

  it('should detect measure changes by measure id without assigning unsupported HTTP resource type', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'measures',
      baseline: { series: [{ id: 'series-1', topografia: [{ id: 'measure-1', minLimit: 1 }] }] },
      current: { series: [{ id: 'series-1', topografia: [{ id: 'measure-1', minLimit: 2 }] }] },
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({
        section: 'measures',
        resourceId: 'measure-1',
        field: 'minLimit',
        previousValue: 1,
        newValue: 2,
        resourceType: null,
        persistable: false,
      }),
    ]);
  });

  it('should detect series and shot form changes as local-only until their separate endpoint exists', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'series-and-shots',
      baseline: [{ id: 'series-1', name: 'Series 1', shots: [{ id: 'shot-1', observation: 'Old' }] }],
      current: [{ id: 'series-1', name: 'Series 1', shots: [{ id: 'shot-1', observation: 'New' }] }],
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([
      expect.objectContaining({
        section: 'series-and-shots',
        resourceId: 'shot-1',
        field: 'observation',
        previousValue: 'Old',
        newValue: 'New',
        persistable: false,
      }),
    ]);
  });

  it('should preserve exact numbers and return no changes when a field is reverted', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'shooting-conditions',
      baseline: [{ shots: [{ shotId: 'shot-1', projectileWeight: 3.456789 }] }],
      current: [{ shots: [{ shotId: 'shot-1', projectileWeight: 3.456789 }] }],
    };

    expect(diffPlanningFormSnapshot(event, context)).toEqual([]);
  });
});
