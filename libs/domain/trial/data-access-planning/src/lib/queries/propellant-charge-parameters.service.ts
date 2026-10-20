import { httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { PropellantChargeParametersResponse } from '../models/propellant-charge-parameters.model';
import { awaitResourceValue } from './await-resource';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query derivada del GET `/fire-trials/{fireTrialId}/planning/propelling-charge-parameters`
 * (Widget 9 — Información Tarado): una entrada por serie con zona de carga,
 * velocidad nominal, desviación máxima y peso de pólvora.
 */
@Injectable({
  providedIn: 'root',
})
export class PropellantChargeParametersService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #injector = inject(Injector);

  readonly #explicitTrialId = signal<string | null>(null);
  readonly #fetchParametersParams = signal<{ fireTrialId: string } | null>(null);

  readonly parametersResource = httpResource<PropellantChargeParametersResponse>(() => {
    const explicitTrialId = this.#explicitTrialId();
    if (!explicitTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(
        this.#planningUrl,
        { fireTrialId: explicitTrialId },
        'planning/propelling-charge-parameters',
      ),
      method: 'GET',
    };
  });

  readonly #fetchParametersResource = httpResource<PropellantChargeParametersResponse>(() => {
    const params = this.#fetchParametersParams();
    if (!params) return undefined;

    return {
      url: buildTrialResourceUrl(
        this.#planningUrl,
        { fireTrialId: params.fireTrialId },
        'planning/propelling-charge-parameters',
      ),
      method: 'GET',
    };
  });

  /** Activa la query para el trial indicado. */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /** Re-fetch manual con el trial vigente. */
  reload(): void {
    this.parametersResource.reload();
  }

  /**
   * Fetch imperativo por trial (equivalente al flujo previo de `ExecutionService`):
   * resuelve la respuesta o lanza el error HTTP para que el llamador la gestione.
   */
  async fetchParameters(fireTrialId: string): Promise<PropellantChargeParametersResponse> {
    this.#fetchParametersParams.set({ fireTrialId });
    return awaitResourceValue(this.#fetchParametersResource, this.#injector);
  }
}
