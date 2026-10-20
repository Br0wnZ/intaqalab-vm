import { httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import { PlanningTrialContextService } from '../context/trial-context.service';
import type { PlanningSeriesItem } from '../models/planning-series.model';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query del GET `/fire-trials/{fireTrialId}/planning/series`.
 * Se dispara automáticamente al fijar `PlanningTrialContextService`.
 */
@Injectable({
  providedIn: 'root',
})
export class PlanningSeriesService {
  readonly #trialContext = inject(PlanningTrialContextService);
  readonly #planningUrl = injectPlanningEndpoint();
  /** Trial fijado explícitamente por el llamador (prioridad sobre el contexto compartido). */
  readonly #explicitTrialId = signal<string | null>(null);

  readonly seriesResource = httpResource<PlanningSeriesItem[]>(() => {
    const explicitTrialId = this.#explicitTrialId();
    const context = this.#trialContext.context();
    const fireTrialId = explicitTrialId ?? context?.fireTrialId;
    if (!fireTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { centerId: context?.centerId, fireTrialId }, 'planning/series'),
      method: 'GET',
    };
  });

  /** Activa la query para el trial indicado (sin depender del contexto compartido). */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /** Re-fetch manual con el trial vigente (explícito o contexto compartido). */
  reload(): void {
    this.seriesResource.reload();
  }
}
