import { Injectable, inject } from '@angular/core';
import { PlanningMunitionsService } from '@intaqalab/data-access-planning';
import type { FireTrial } from '@intaqalab/models';

import { selectFuseMeasurement } from './planning-fuse.selectors';

@Injectable({
  providedIn: 'root',
})
export class PlanningFuseService {
  readonly #planningMunitionsService = inject(PlanningMunitionsService);

  async fetchPlanningFuseGraduation(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<number | null> {
    const response = await this.#planningMunitionsService.fetchMunitions(fireTrialId);
    return selectFuseMeasurement(response, seriesId, shotId);
  }
}
