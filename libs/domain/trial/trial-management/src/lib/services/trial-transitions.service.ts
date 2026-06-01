import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { TransitionWithReasonRequest, TrialTransitionAction } from '@intaqalab/models';

interface TrialTransitionParams {
  trialId: string;
  action: TrialTransitionAction;
  reason?: string;
  /** Timestamp para forzar re-ejecución al llamar varias veces con los mismo trialId */
  _t: number;
}

interface TrialDeleteParams {
  trialId: string;
  _t: number;
}

@Injectable({
  providedIn: 'root',
})
export class TrialTransitionsService {
  readonly #fireTrialsUrl = injectFireTrialsEndpoint();

  readonly #params = signal<TrialTransitionParams | null>(null);
  readonly #deleteParams = signal<TrialDeleteParams | null>(null);

  readonly actionResource = httpResource<void>(() => {
    const params = this.#params();
    if (!params) return undefined;

    return {
      url: `${this.#fireTrialsUrl}/${params.trialId}/${params.action}`,
      method: 'POST',
      body: params.reason !== undefined ? ({ reason: params.reason } satisfies TransitionWithReasonRequest) : undefined,
    };
  });

  readonly deleteResource = httpResource<void>(() => {
    const params = this.#deleteParams();
    if (!params) return undefined;

    return {
      url: `${this.#fireTrialsUrl}/${params.trialId}`,
      method: 'DELETE',
    };
  });

  /** Cancela la prueba de fuego. Requiere motivo. */
  cancel(trialId: string, reason: string): void {
    this.#params.set({ trialId, action: 'cancel', reason, _t: Date.now() });
  }

  /** Anula la prueba de fuego. Requiere motivo. */
  void(trialId: string, reason: string): void {
    this.#params.set({ trialId, action: 'void', reason, _t: Date.now() });
  }

  /** Cierra la prueba de fuego. */
  close(trialId: string): void {
    this.#params.set({ trialId, action: 'close', _t: Date.now() });
  }

  /** Reabre la prueba de fuego. */
  reopen(trialId: string): void {
    this.#params.set({ trialId, action: 'reopen', _t: Date.now() });
  }

  /** Reactiva la prueba de fuego. */
  reactivate(trialId: string): void {
    this.#params.set({ trialId, action: 'reactivate', _t: Date.now() });
  }

  /** Elimina la prueba de fuego. */
  delete(trialId: string): void {
    this.#deleteParams.set({ trialId, _t: Date.now() });
  }

  /** Resetea el estado del recurso de eliminación. */
  resetDelete(): void {
    this.#deleteParams.set(null);
  }

  /** Resetea el estado del recurso de transición de estado. */
  resetAction(): void {
    this.#params.set(null);
  }
}
