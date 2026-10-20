import { httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import { PlanningTrialContextService } from '../context/trial-context.service';
import type { TrialMeasuresResponse } from '../models/planning-measures.model';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query del GET `/fire-trials/{fireTrialId}/planning/measures`
 * (medidas planificadas por serie y familia funcional).
 *
 * Disparo explícito mediante `load(fireTrialId)`; el contexto compartido no
 * auto-dispara esta familia para no generar peticiones no solicitadas.
 */
@Injectable({
  providedIn: 'root',
})
export class PlanningMeasuresService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #explicitTrialId = signal<string | null>(null);

  readonly measuresResource = httpResource<TrialMeasuresResponse>(() => {
    const explicitTrialId = this.#explicitTrialId();
    if (!explicitTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { fireTrialId: explicitTrialId }, 'planning/measures'),
      method: 'GET',
    };
  });

  /** Activa la query para el trial indicado. */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /** Re-fetch manual con el trial vigente. */
  reload(): void {
    this.measuresResource.reload();
  }
}
