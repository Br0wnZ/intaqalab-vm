import { httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import { PlanningTrialContextService } from '../context/trial-context.service';
import type { PlanningTargetConditionsResponse } from '../models/planning-target-conditions.model';
import { buildTrialResourceUrl } from './trial-resource-url';

/** Query del GET `/fire-trials/{fireTrialId}/planning/target-conditions` para widget 26. */
@Injectable({ providedIn: 'root' })
export class PlanningTargetConditionsService {
  readonly #trialContext = inject(PlanningTrialContextService);
  readonly #planningUrl = injectPlanningEndpoint();

  readonly targetConditionsResource = httpResource<PlanningTargetConditionsResponse>(() => {
    const context = this.#trialContext.context();
    if (!context?.fireTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(
        this.#planningUrl,
        { centerId: context.centerId, fireTrialId: context.fireTrialId },
        'planning/target-conditions',
      ),
      method: 'GET',
    };
  });
}
