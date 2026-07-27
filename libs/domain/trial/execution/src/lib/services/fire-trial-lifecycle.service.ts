import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { ChangeStatusRequest, FinishFireTrialResponse, FireTrial } from '@intaqalab/models';

interface FireTrialLifecycleParams {
  fireTrialId: FireTrial['id'];
  _t: number;
}

interface FireTrialChangeStatusParams extends FireTrialLifecycleParams {
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class FireTrialLifecycleService {
  readonly #fireTrialsUrl = injectFireTrialsEndpoint();

  // ── START FIRE TRIAL ───────────────────────────────────────────────────

  readonly #startParams = signal<FireTrialLifecycleParams | null>(null);

  readonly startResource = httpResource<void>(() => {
    const params = this.#startParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/start`,
      method: 'POST',
    };
  });

  startFireTrial(fireTrialId: FireTrial['id']): void {
    this.#startParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── FINISH FIRE TRIAL ──────────────────────────────────────────────────

  readonly #finishParams = signal<FireTrialLifecycleParams | null>(null);

  readonly finishResource = httpResource<FinishFireTrialResponse>(() => {
    const params = this.#finishParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/finish`,
      method: 'POST',
    };
  });

  finishFireTrial(fireTrialId: FireTrial['id']): void {
    this.#finishParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── CANCEL FIRE TRIAL ──────────────────────────────────────────────────

  readonly #cancelParams = signal<FireTrialChangeStatusParams | null>(null);

  readonly cancelResource = httpResource<void>(() => {
    const params = this.#cancelParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/cancel`,
      method: 'POST',
      body: { reason: params.reason } satisfies ChangeStatusRequest,
    };
  });

  cancelFireTrial(fireTrialId: FireTrial['id'], reason: string): void {
    this.#cancelParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── VOID FIRE TRIAL ────────────────────────────────────────────────────

  readonly #voidParams = signal<FireTrialChangeStatusParams | null>(null);

  readonly voidResource = httpResource<void>(() => {
    const params = this.#voidParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/void`,
      method: 'POST',
      body: { reason: params.reason } satisfies ChangeStatusRequest,
    };
  });

  voidFireTrial(fireTrialId: FireTrial['id'], reason: string): void {
    this.#voidParams.set({ fireTrialId, reason, _t: Date.now() });
  }

  // ── CLOSE FIRE TRIAL ───────────────────────────────────────────────────

  readonly #closeParams = signal<FireTrialLifecycleParams | null>(null);

  readonly closeResource = httpResource<void>(() => {
    const params = this.#closeParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/close`,
      method: 'POST',
    };
  });

  closeFireTrial(fireTrialId: FireTrial['id']): void {
    this.#closeParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── REOPEN FIRE TRIAL ──────────────────────────────────────────────────

  readonly #reopenParams = signal<FireTrialLifecycleParams | null>(null);

  readonly reopenResource = httpResource<void>(() => {
    const params = this.#reopenParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/reopen`,
      method: 'POST',
    };
  });

  reopenFireTrial(fireTrialId: FireTrial['id']): void {
    this.#reopenParams.set({ fireTrialId, _t: Date.now() });
  }

  // ── REACTIVATE FIRE TRIAL ──────────────────────────────────────────────

  readonly #reactivateParams = signal<FireTrialLifecycleParams | null>(null);

  readonly reactivateResource = httpResource<void>(() => {
    const params = this.#reactivateParams();
    if (!params) return undefined;
    return {
      url: `${this.#fireTrialsUrl}/${params.fireTrialId}/reactivate`,
      method: 'POST',
    };
  });

  reactivateFireTrial(fireTrialId: FireTrial['id']): void {
    this.#reactivateParams.set({ fireTrialId, _t: Date.now() });
  }
}
