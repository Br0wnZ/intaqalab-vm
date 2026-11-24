/**
 * Revisiones disponibles en los GET de planning (`?revision=`).
 * - `baseline`: planning base sin cambios (valor por defecto del backend).
 * - `execution`: planning base + cambios `ACCEPTED` aplicados desde ejecución.
 */
export const PLANNING_REVISIONS = ['baseline', 'execution'] as const;

export type PlanningRevision = (typeof PLANNING_REVISIONS)[number];

export const DEFAULT_PLANNING_REVISION: PlanningRevision = 'baseline';

/** Nombre del query param que acepta el backend en los GET de planning. */
export const PLANNING_REVISION_PARAM = 'revision';

export function isPlanningRevision(value: unknown): value is PlanningRevision {
  return PLANNING_REVISIONS.some((revision) => revision === value);
}
