import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectExecutionEndpoint, injectFireTrialsEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ExecutionFinishResponse, TransitionWithReasonRequest } from '../../../execution/models';
import { executionTrialUrl, fireTrialUrl } from '../shared/execution-endpoints';

@Injectable({
  providedIn: 'root',
})
export class ExecutionTransitionService {
  readonly #http = inject(HttpClient);
  readonly #executionUrl = injectExecutionEndpoint();
  readonly #fireTrialsUrl = injectFireTrialsEndpoint();

  startExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'start'), null));
  }

  pauseExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(executionTrialUrl(this.#executionUrl, fireTrialId, 'pause'), null));
  }

  interruptExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    const body = { reason } satisfies TransitionWithReasonRequest;
    return firstValueFrom(this.#http.post<void>(executionTrialUrl(this.#executionUrl, fireTrialId, 'interrupt'), body));
  }

  resumeExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(executionTrialUrl(this.#executionUrl, fireTrialId, 'resume'), null));
  }

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    const body = { reason } satisfies TransitionWithReasonRequest;
    return firstValueFrom(this.#http.post<void>(executionTrialUrl(this.#executionUrl, fireTrialId, 'cancel'), body));
  }

  finishExecution(fireTrialId: FireTrial['id']): Promise<ExecutionFinishResponse> {
    return firstValueFrom(
      this.#http.post<ExecutionFinishResponse>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'finish'), null),
    );
  }
}
