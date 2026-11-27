import { HttpClient, HttpContext } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { SKIP_ERROR_TOAST_STATUSES, injectFireTrialsEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { ExecutionFinishResponse, TransitionWithReasonRequest } from '../../../execution/models';
import { fireTrialUrl } from '../shared/execution-endpoints';

@Service()
export class ExecutionTransitionService {
  readonly #http = inject(HttpClient);
  readonly #fireTrialsUrl = injectFireTrialsEndpoint();

  startExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'start'), null));
  }

  pauseExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'pause'), null));
  }

  interruptExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    const body = { reason } satisfies TransitionWithReasonRequest;
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'interrupt'), body));
  }

  resumeExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'resume'), null));
  }

  cancelExecution(fireTrialId: FireTrial['id'], reason: string): Promise<void> {
    const body = { reason } satisfies TransitionWithReasonRequest;
    return firstValueFrom(this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'cancel'), body));
  }

  reactivateExecution(fireTrialId: FireTrial['id']): Promise<void> {
    return firstValueFrom(
      this.#http.post<void>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'reactivate'), null, {
        context: new HttpContext().set(SKIP_ERROR_TOAST_STATUSES, [403]),
      }),
    );
  }

  finishExecution(fireTrialId: FireTrial['id']): Promise<ExecutionFinishResponse> {
    return firstValueFrom(
      this.#http.post<ExecutionFinishResponse>(fireTrialUrl(this.#fireTrialsUrl, fireTrialId, 'finish'), null),
    );
  }
}
