import { httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import { PlanningTrialContextService } from '../context/trial-context.service';
import type { PlanningConditionsResponse } from '../models/planning-conditions.model';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query del GET `/fire-trials/{fireTrialId}/planning/conditions`
 * (condiciones físicas de todos los disparos, agrupadas por serie).
 */
@Injectable({
  providedIn: 'root',
})
export class PlanningConditionsService {
  readonly #trialContext = inject(PlanningTrialContextService);
  readonly #planningUrl = injectPlanningEndpoint();
  /** Trial fijado explícitamente por el llamador (prioridad sobre el contexto compartido). */
  readonly #explicitTrialId = signal<string | null>(null);

  readonly conditionsResource = httpResource<PlanningConditionsResponse>(() => {
    const explicitTrialId = this.#explicitTrialId();
    const context = this.#trialContext.context();
    const fireTrialId = explicitTrialId ?? context?.fireTrialId;
    if (!fireTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(
        this.#planningUrl,
        { centerId: context?.centerId, fireTrialId },
        'planning/conditions',
      ),
      method: 'GET',
    };
  });

  /** Activa la query para el trial indicado (sin depender del contexto compartido). */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /** Re-fetch manual con el trial vigente (explícito o contexto compartido). */
  reload(): void {
    this.conditionsResource.reload();
  }
}
