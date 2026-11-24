import { InjectionToken } from '@angular/core';

import type { PlanningRevision } from '../models/planning-revision.model';

/**
 * Revisión que envían las queries de `@intaqalab/data-access-planning`.
 *
 * Esta lib es la capa de lectura de planning de Execution (ADR-017), por lo que el valor
 * por defecto es `execution`. Un consumidor distinto puede sobrescribirlo con un provider.
 */
export const PLANNING_REVISION = new InjectionToken<PlanningRevision>('PLANNING_REVISION', {
  providedIn: 'root',
  factory: () => 'execution',
});

/** Params HTTP (`{ revision }`) para `httpResource`/`HttpClient`. Función pura, sin estado. */
export function planningRevisionParams(revision: PlanningRevision): { readonly revision: PlanningRevision } {
  return { revision };
}
