import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { SecurityCountdownRequest, SecurityCountdownResponse } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface SecurityCountdownParams {
  fireTrialId: FireTrial['id'];
}

@Injectable({
  providedIn: 'root',
})
export class SecurityCountdownService {
  readonly #http = inject(HttpClient);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getSecurityCountdownParams = signal<SecurityCountdownParams | null>(null);

  readonly securityCountdownResource = httpResource<SecurityCountdownResponse>(() => {
    const params = this.#getSecurityCountdownParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'security-countdown'),
      method: 'GET',
    };
  });

  getSecurityCountdownState(fireTrialId: FireTrial['id']): void {
    this.#getSecurityCountdownParams.set({ fireTrialId });
  }

  updateSecurityCountdown(
    fireTrialId: FireTrial['id'],
    body: SecurityCountdownRequest,
  ): Promise<SecurityCountdownResponse> {
    return firstValueFrom(
      this.#http.put<SecurityCountdownResponse>(
        executionTrialUrl(this.#executionUrl, fireTrialId, 'security-countdown'),
        body,
      ),
    );
  }
}
