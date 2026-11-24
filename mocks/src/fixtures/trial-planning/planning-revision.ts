import type { Request } from 'express';

import type { PlanningChange, PlanningChangeResourceType } from '../execution/planning-changes-store';
import { getPlanningChanges } from '../execution/planning-changes-store';

/** Revisiones admitidas por los GET de planning (`?revision=`). Espejo de `PlanningRevision` del frontend. */
export type PlanningRevision = 'baseline' | 'execution';

export const DEFAULT_PLANNING_REVISION: PlanningRevision = 'baseline';

/**
 * Resuelve la revisión pedida. Sin param, o con un valor no soportado, cae a `baseline`
 * (contrato: "si no se envía tag, por defecto es baseline").
 */
export function resolveRevision(req: Pick<Request, 'query'>): PlanningRevision {
  const raw = req.query['revision'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'execution' ? 'execution' : DEFAULT_PLANNING_REVISION;
}

/** Cambios `ACCEPTED` (únicos que se proyectan en `revision=execution`) de un recurso del trial. */
export function getAcceptedChanges(
  fireTrialId: string,
  ...resourceTypes: readonly PlanningChangeResourceType[]
): PlanningChange[] {
  return getPlanningChanges(fireTrialId).filter(
    (change) => change.status === 'ACCEPTED' && resourceTypes.includes(change.resourceType),
  );
}
