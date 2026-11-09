import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  ExecutionProgressResponse,
  ExecutionStateResponse,
  ShotMeasurementsResponse,
} from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface ExecutionStateParams {
  fireTrialId: FireTrial['id'];
}

@Injectable({
  providedIn: 'root',
})
export class ExecutionStateService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getExecutionStateParams = signal<ExecutionStateParams | null>(null);

  readonly executionStateResource = httpResource<ExecutionStateResponse>(() => {
    const params = this.#getExecutionStateParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'state'),
      method: 'GET',
    };
  });

  getExecutionState(fireTrialId: FireTrial['id']): void {
    this.#getExecutionStateParams.set({ fireTrialId });
  }

  readonly #getExecutionProgressParams = signal<ExecutionStateParams | null>(null);

  readonly executionProgressResource = httpResource<ExecutionProgressResponse>(() => {
    const params = this.#getExecutionProgressParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'progress'),
      method: 'GET',
    };
  });

  getExecutionProgress(fireTrialId: FireTrial['id']): void {
    this.#getExecutionProgressParams.set({ fireTrialId });
  }

  readonly #getShotMeasurementsParams = signal<ExecutionStateParams | null>(null);

  readonly shotMeasurementsResource = httpResource<ShotMeasurementsResponse>(() => {
    const params = this.#getShotMeasurementsParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'shot-measurements'),
      method: 'GET',
    };
  });

  getShotMeasurements(fireTrialId: FireTrial['id']): void {
    this.#getShotMeasurementsParams.set({ fireTrialId });
  }
}
