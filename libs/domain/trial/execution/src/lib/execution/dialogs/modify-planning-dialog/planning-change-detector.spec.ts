import type { PlanningFormSnapshotEvent } from '@intaqalab/planning';
import { describe, expect, it } from 'vitest';

import { PlanningChangeDetector } from './planning-change-detector';

const context = { fireTrialId: 'trial-1' };

function generalEvent(goal: string): PlanningFormSnapshotEvent {
  return {
    section: 'general-data',
    baseline: { model: { goal: 'Initial' } },
    current: { model: { goal } },
    valid: true,
  };
}

describe('PlanningChangeDetector', () => {
  it('should preserve a cloned baseline and replace a section diff on consecutive form changes', () => {
    const detector = new PlanningChangeDetector();
    const initial = generalEvent('First edit');

    detector.replaceFormSnapshot(initial, context);
    initial.current = { model: { goal: 'mutated outside detector' } };
    detector.replaceFormSnapshot(generalEvent('Second edit'), context);

    expect(detector.getDetectedChanges()).toEqual([
      expect.objectContaining({ previousValue: 'Initial', newValue: 'Second edit', resourceId: 'trial-1' }),
    ]);
  });

  it('should remove a change when the form value returns to its original baseline', () => {
    const detector = new PlanningChangeDetector();
    detector.replaceFormSnapshot(generalEvent('Changed'), context);
    detector.replaceFormSnapshot(generalEvent('Initial'), context);

    expect(detector.getDetectedChanges()).toEqual([]);
  });

  it('should keep changes from other tabs when a single section snapshot is replaced', () => {
    const detector = new PlanningChangeDetector();
    detector.replaceFormSnapshot(generalEvent('Changed'), context);
    detector.replaceFormSnapshot(
      {
        section: 'shooting-conditions',
        baseline: [{ shots: [{ shotId: 'shot-1', elevation: 10 }] }],
        current: [{ shots: [{ shotId: 'shot-1', elevation: 12 }] }],
      },
      context,
    );

    expect(detector.getDetectedChanges()).toHaveLength(2);
    expect(detector.getDetectedChanges().map((change) => change.section)).toEqual([
      'general-data',
      'shooting-conditions',
    ]);
  });

  it('should rebase all current form snapshots after accepted changes', () => {
    const detector = new PlanningChangeDetector();
    detector.replaceFormSnapshot(generalEvent('Accepted'), context);
    detector.rebaseFormSnapshots();
    detector.replaceFormSnapshot(generalEvent('Next edit'), context);

    expect(detector.getDetectedChanges()).toEqual([
      expect.objectContaining({ previousValue: 'Accepted', newValue: 'Next edit' }),
    ]);
  });
});
