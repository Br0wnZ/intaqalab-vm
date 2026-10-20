import { httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { TrialMunitionsRawItem } from '../models/planning-munitions.model';
import { awaitResourceValue } from './await-resource';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query del GET `/fire-trials/{fireTrialId}/planning/munitions`
 * (configuraciones de munición, componentes y acondicionamiento agrupados por serie,
 * shape raw del backend: referencias hidratadas o id-planos).
 *
 * Disparo explícito mediante `load(fireTrialId)`; el contexto compartido no
 * auto-dispara esta familia para no generar peticiones no solicitadas.
 */
@Injectable({
  providedIn: 'root',
})
export class PlanningMunitionsService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #injector = inject(Injector);
  readonly #explicitTrialId = signal<string | null>(null);
  readonly #fetchMunitionsParams = signal<{ fireTrialId: string } | null>(null);

  readonly munitionsResource = httpResource<TrialMunitionsRawItem>(() => {
    const explicitTrialId = this.#explicitTrialId();
    if (!explicitTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { fireTrialId: explicitTrialId }, 'planning/munitions'),
      method: 'GET',
    };
  });

  readonly #fetchMunitionsResource = httpResource<TrialMunitionsRawItem>(() => {
    const params = this.#fetchMunitionsParams();
    if (!params) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { fireTrialId: params.fireTrialId }, 'planning/munitions'),
      method: 'GET',
    };
  });

  /** Activa la query para el trial indicado. */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /**
   * Fetch imperativo por trial (equivalente al flujo previo de `ExecutionService`):
   * resuelve la respuesta raw o lanza el error HTTP para que el llamador la gestione.
   */
  async fetchMunitions(fireTrialId: string): Promise<TrialMunitionsRawItem> {
    this.#fetchMunitionsParams.set({ fireTrialId });
    return awaitResourceValue(this.#fetchMunitionsResource, this.#injector);
  }

  /** Re-fetch manual con el trial vigente. */
  reload(): void {
    this.munitionsResource.reload();
  }
}
