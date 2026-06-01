import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

@Injectable({
  providedIn: 'root',
})
export class PlanningLifecycleService {
  readonly #validateParams = signal<{ fireTrialId: FireTrial['id'] } | null>(null);
  readonly #unlockParams = signal<{ fireTrialId: FireTrial['id'] } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly validateResource = httpResource<void>(() => {
    const params = this.#validateParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/validate`,
      method: 'POST',
      body: {},
    };
  });

  readonly unlockResource = httpResource<void>(() => {
    const params = this.#unlockParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/modify`,
      method: 'POST',
      body: {},
    };
  });

  validate(fireTrialId: FireTrial['id']): void {
    this.#validateParams.set({ fireTrialId });
  }

  unlock(fireTrialId: FireTrial['id']): void {
    this.#unlockParams.set({ fireTrialId });
  }

  resetValidate(): void {
    this.#validateParams.set(null);
  }

  resetUnlock(): void {
    this.#unlockParams.set(null);
  }
}
