import { httpResource } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import { PlanningMeasuresService, PlanningTrialContextService } from '@intaqalab/data-access-planning';

import type { EquipmentMeasuresCatalogResponse, PlanningMagnitudeSelection } from '../execution/models';

@Injectable({
  providedIn: 'root',
})
export class EquipmentPlanningService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #planningMeasuresService = inject(PlanningMeasuresService);
  readonly #planningTrialContext = inject(PlanningTrialContextService, { optional: true });
  readonly #trialId = signal<string | null>(null);

  /**
   * Medidas planificadas para el ensayo actual (GET /fire-trials/:id/planning/measures),
   * servidas por la capa compartida `@intaqalab/data-access-planning`.
   */
  readonly trialMeasuresResource = this.#planningMeasuresService.measuresResource;

  /**
   * Catálogo de medidas maestro (GET /measures?page=1&pageSize=100).
   * Carga incondicionalmente al instanciar el servicio.
   */
  readonly catalogResource = httpResource<EquipmentMeasuresCatalogResponse | readonly PlanningMagnitudeSelection[]>(
    () => ({
      url: `${this.#planningUrl}/measures`,
      method: 'GET',
      params: { page: 1, pageSize: 100 },
    }),
  );

  readonly catalog = computed<readonly PlanningMagnitudeSelection[]>(() => {
    const val = this.catalogResource.value();
    if (Array.isArray(val)) return val as readonly PlanningMagnitudeSelection[];
    return (val as EquipmentMeasuresCatalogResponse)?.items ?? [];
  });

  readonly isLoading = computed(() => this.trialMeasuresResource.isLoading() || this.catalogResource.isLoading());

  readonly error = computed(() => this.trialMeasuresResource.error() ?? this.catalogResource.error() ?? null);

  constructor() {
    effect(() => {
      const contextTrialId = this.#planningTrialContext?.context()?.fireTrialId;
      if (contextTrialId && !this.#trialId()) {
        this.load(contextTrialId);
      }
    });
  }

  load(trialId: string): void {
    this.#trialId.set(trialId);
    this.#planningMeasuresService.load(trialId);
  }
}
