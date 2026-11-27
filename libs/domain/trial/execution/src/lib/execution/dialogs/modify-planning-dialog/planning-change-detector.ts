import type { PlanningFormSnapshotEvent, PlanningSection } from '@intaqalab/planning';

import type { PlanningDetectedChange } from '../../models/planning-changes.models';
import { diffPlanningFormSnapshot } from './planning-change-diff';

interface PlanningChangeContext {
  fireTrialId: string;
  executedShotIds?: ReadonlyArray<string>;
}

/** Keeps one stable baseline per tab and replaces each tab's current form diff as it changes. */
export class PlanningChangeDetector {
  readonly #sectionSnapshots = new Map<PlanningSection, PlanningFormSnapshotEvent>();
  readonly #detectedBySection = new Map<PlanningSection, PlanningDetectedChange[]>();

  replaceFormSnapshot(event: PlanningFormSnapshotEvent, context: PlanningChangeContext): PlanningDetectedChange[] {
    const previous = this.#sectionSnapshots.get(event.section);
    const stableEvent: PlanningFormSnapshotEvent = {
      section: event.section,
      baseline: previous?.baseline ?? structuredClone(event.baseline),
      current: structuredClone(event.current),
      valid: event.valid,
    };
    this.#sectionSnapshots.set(event.section, stableEvent);
    const changes = diffPlanningFormSnapshot(stableEvent, context);
    this.#detectedBySection.set(event.section, changes);
    return changes;
  }

  getDetectedChanges(): PlanningDetectedChange[] {
    return [...this.#detectedBySection.values()].flat().sort((left, right) => left.key.localeCompare(right.key));
  }

  rebaseFormSnapshots(): void {
    for (const [section, snapshot] of this.#sectionSnapshots) {
      this.#sectionSnapshots.set(section, {
        ...snapshot,
        baseline: structuredClone(snapshot.current),
      });
      this.#detectedBySection.set(section, []);
    }
  }
}
