import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { PlanningApprovalRequest, PlanningRequest, PlanningResponse } from '../../../../execution/models';
import { executionTrialUrl } from '../../shared/execution-endpoints';

interface UpdatePlanningParams {
  fireTrialId: FireTrial['id'];
  body: PlanningRequest;
}

interface ApprovePlanningParams {
  fireTrialId: FireTrial['id'];
  body: PlanningApprovalRequest;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutionPlanningService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #updatePlanningParams = signal<UpdatePlanningParams | null>(null);

  readonly updatePlanningResource = httpResource<PlanningResponse>(() => {
    const params = this.#updatePlanningParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'planning'),
      method: 'PUT',
      body: params.body,
    };
  });

  updateExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningRequest): void {
    this.#updatePlanningParams.set({ fireTrialId, body });
  }

  readonly #approvePlanningParams = signal<ApprovePlanningParams | null>(null);

  readonly approvePlanningResource = httpResource<void>(() => {
    const params = this.#approvePlanningParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'planning', 'approve'),
      method: 'POST',
      body: params.body,
    };
  });

  approveExecutionPlanning(fireTrialId: FireTrial['id'], body: PlanningApprovalRequest): void {
    this.#approvePlanningParams.set({ fireTrialId, body });
  }
}
