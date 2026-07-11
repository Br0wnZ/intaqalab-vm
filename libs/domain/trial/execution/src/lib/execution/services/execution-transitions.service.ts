/**
 * @deprecated Use ExecutionService and ExecutionStore from @intaqalab/execution domain instead.
 *
 * This service is kept for backwards compatibility but will be removed in a future version.
 *
 * Migration guide:
 * - Replace ExecutionTransitionsService with ExecutionService from libs/domain/trial/execution
 * - Use ExecutionStore for state management (single source of truth)
 * - The new service uses injectExecutionEndpoint() which properly handles the API URL structure
 */
import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectApiUrl } from '@intaqalab/config';
import type { ExecutionFinishResponse, TransitionWithReasonRequest } from '@intaqalab/models';

interface ExecutionTransitionParams {
  fireTrialId: string;
  /** Timestamp para forzar re-ejecución al llamar varias veces con los mismos IDs */
  _t: number;
}

interface ExecutionTransitionWithReasonParams extends ExecutionTransitionParams {
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutionTransitionsService {
  readonly #apiUrl = injectApiUrl();

  #executionUrl(fireTrialId: string, action: string): string {
    return `${this.#apiUrl}/fire-trials/${fireTrialId}/execution/${action}`;
  }

  // ── START ────────────────────────────────────────────────────────────
  readonly #startParams = signal<ExecutionTransitionParams | null>(null);

  readonly startResource = httpResource<void>(() => {
    const params = this.#startParams();
    if (!params) return undefined;
    return { url: this.#executionUrl(params.fireTrialId, 'start'), method: 'POST' };
  });

  start(fireTrialId: string): void {
    this.#startParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── PAUSE ────────────────────────────────────────────────────────────
  readonly #pauseParams = signal<ExecutionTransitionParams | null>(null);

  readonly pauseResource = httpResource<void>(() => {
    const params = this.#pauseParams();
    if (!params) return undefined;
    return { url: this.#executionUrl(params.fireTrialId, 'pause'), method: 'POST' };
  });

  pause(fireTrialId: string): void {
    this.#pauseParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── INTERRUPT ────────────────────────────────────────────────────────
  readonly #interruptParams = signal<ExecutionTransitionWithReasonParams | null>(null);

  readonly interruptResource = httpResource<void>(() => {
    const params = this.#interruptParams();
    if (!params) return undefined;
    return {
      url: this.#executionUrl(params.fireTrialId, 'interrupt'),
      method: 'POST',
      body: { reason: params.reason } satisfies TransitionWithReasonRequest,
    };
  });

  interrupt(fireTrialId: string, reason: string): void {
    this.#interruptParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── RESUME ───────────────────────────────────────────────────────────
  readonly #resumeParams = signal<ExecutionTransitionParams | null>(null);

  readonly resumeResource = httpResource<void>(() => {
    const params = this.#resumeParams();
    if (!params) return undefined;
    return { url: this.#executionUrl(params.fireTrialId, 'resume'), method: 'POST' };
  });

  resume(fireTrialId: string): void {
    this.#resumeParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── CANCEL ───────────────────────────────────────────────────────────
  readonly #cancelParams = signal<ExecutionTransitionWithReasonParams | null>(null);

  readonly cancelResource = httpResource<void>(() => {
    const p = this.#cancelParams();
    if (!p) return undefined;
    return {
      url: this.#executionUrl(p.fireTrialId, 'cancel'),
      method: 'POST',
      body: { reason: p.reason } satisfies TransitionWithReasonRequest,
    };
  });

  cancel(fireTrialId: string, reason: string): void {
    this.#cancelParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── FINISH ───────────────────────────────────────────────────────────
  readonly #finishParams = signal<ExecutionTransitionParams | null>(null);

  readonly finishResource = httpResource<ExecutionFinishResponse>(() => {
    const p = this.#finishParams();
    if (!p) return undefined;
    return { url: this.#executionUrl(p.fireTrialId, 'finish'), method: 'POST' };
  });

  finish(fireTrialId: string): void {
    this.#finishParams.set({ fireTrialId, _t: Date.now() });
  }
}
