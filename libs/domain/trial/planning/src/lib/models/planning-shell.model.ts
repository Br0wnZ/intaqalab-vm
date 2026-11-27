import type { PlanningRevision } from '@intaqalab/data-access-planning';

export type PlanningShellMode = 'planning' | 'execution-modification';

/** Revisión (`?revision=`) que usan los GET de planning según el contexto desde el que se muestra el shell. */
export const PLANNING_REVISION_BY_SHELL_MODE: Readonly<Record<PlanningShellMode, PlanningRevision>> = {
  planning: 'baseline',
  'execution-modification': 'execution',
};

export type PlanningSection =
  'general-data' | 'series-and-shots' | 'shooting-conditions' | 'munitions' | 'armament' | 'measures';

export interface PlanningValueReference {
  id: string | number;
  name: string | Readonly<Record<string, string>>;
}

/** Display-only catalogs keyed by change field. IDs remain the form and API values. */
export type PlanningValueReferences = Readonly<Record<string, ReadonlyArray<PlanningValueReference>>>;

/** Complete before/after snapshots from a tab editor. Output reflects current form state, not input history. */
export interface PlanningFormSnapshotEvent {
  section: PlanningSection;
  baseline: unknown;
  current: unknown;
  valid?: boolean;
  valueReferences?: PlanningValueReferences;
}
