import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { PlanningFuseWorkingModesResponse } from '../models/fuse-working-modes.model';

@Injectable({
  providedIn: 'root',
})
export class PlanningFuseWorkingModesService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #loadRequested = signal(false);

  readonly fuseWorkingModesResource = httpResource<PlanningFuseWorkingModesResponse>(() => {
    if (!this.#loadRequested()) return undefined;

    return {
      url: `${this.#planningUrl}/fuse-working-modes`,
      params: { page: 1, pageSize: 10, active: true },
      method: 'GET',
    };
  });

  load(): void {
    this.#loadRequested.set(true);
  }
}
