import type { PlanningRevision } from '@intaqalab/data-access-planning';

export type PlanningShellMode = 'planning' | 'execution-modification';

/** Revisión (`?revision=`) que usan los GET de planning según el contexto desde el que se muestra el shell. */
export const PLANNING_REVISION_BY_SHELL_MODE: Readonly<Record<PlanningShellMode, PlanningRevision>> = {
  planning: 'baseline',
  'execution-modification': 'execution',
};

export type PlanningFieldChangeAction = 'Alta' | 'Baja' | 'Modificación';

export type PlanningSection =
  | 'general-data'
  | 'series-and-shots'
  | 'shooting-conditions'
  | 'munitions'
  | 'armament'
  | 'measures';

export interface PlanningFieldChangeEvent {
  section: PlanningSection;
  parameter: string;
  action: PlanningFieldChangeAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
}
