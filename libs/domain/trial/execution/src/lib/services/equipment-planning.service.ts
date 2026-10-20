import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import { PlanningMeasuresService } from '@intaqalab/data-access-planning';

import type { EquipmentMeasuresCatalogResponse, PlanningMagnitudeSelection } from '../execution/models';

@Injectable()
export class EquipmentPlanningService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #planningMeasuresService = inject(PlanningMeasuresService);
  readonly #trialId = signal<string | null>(null);

  /**
   * Medidas planificadas para el ensayo actual (GET /fire-trials/:id/planning/measures),
   * servidas por la capa compartida `@intaqalab/data-access-planning`.
   */
  readonly trialMeasuresResource = this.#planningMeasuresService.measuresResource;

  /**
   * Catálogo de medidas maestro (GET /measures?page=1&pageSize=100).
   */
  readonly catalogResource = httpResource<EquipmentMeasuresCatalogResponse>(() => {
    const trialId = this.#trialId();
    return trialId
      ? {
          url: `${this.#planningUrl}/measures`,
          method: 'GET',
          params: { page: 1, pageSize: 100 },
        }
      : undefined;
  });

  readonly catalog = computed<readonly PlanningMagnitudeSelection[]>(() => this.catalogResource.value()?.items ?? []);

  readonly isLoading = computed(() => this.trialMeasuresResource.isLoading() || this.catalogResource.isLoading());

  readonly error = computed(() => this.trialMeasuresResource.error() ?? this.catalogResource.error() ?? null);

  load(trialId: string): void {
    this.#trialId.set(trialId);
    this.#planningMeasuresService.load(trialId);
  }
}
