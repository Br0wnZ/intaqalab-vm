import { httpResource } from '@angular/common/http';
import { Injector, inject, signal, Service } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { TrialArmamentResponse } from '../models/planning-armament.model';
import { awaitResourceValue } from './await-resource';
import { PLANNING_REVISION, planningRevisionParams } from '../revision/planning-revision';
import { buildTrialResourceUrl } from './trial-resource-url';

/**
 * Query del GET `/fire-trials/{fireTrialId}/planning/armament`
 * (armamento y tubos asignados a cada disparo, agrupados por serie).
 *
 * Disparo explícito mediante `load(fireTrialId)`; el contexto compartido no
 * auto-dispara esta familia para no generar peticiones no solicitadas.
 */
@Service()
export class PlanningArmamentService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #revision = inject(PLANNING_REVISION);
  readonly #injector = inject(Injector);
  readonly #explicitTrialId = signal<string | null>(null);
  readonly #fetchArmamentParams = signal<{ fireTrialId: string } | null>(null);

  readonly armamentResource = httpResource<TrialArmamentResponse>(() => {
    const explicitTrialId = this.#explicitTrialId();
    if (!explicitTrialId) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { fireTrialId: explicitTrialId }, 'planning/armament'),
      method: 'GET',
      params: planningRevisionParams(this.#revision),
    };
  });

  readonly #fetchArmamentResource = httpResource<TrialArmamentResponse>(() => {
    const params = this.#fetchArmamentParams();
    if (!params) return undefined;

    return {
      url: buildTrialResourceUrl(this.#planningUrl, { fireTrialId: params.fireTrialId }, 'planning/armament'),
      method: 'GET',
      params: planningRevisionParams(this.#revision),
    };
  });

  /** Activa la query para el trial indicado. */
  load(fireTrialId: string): void {
    this.#explicitTrialId.set(fireTrialId);
  }

  /**
   * Fetch imperativo por trial (equivalente al flujo previo de `ExecutionService`):
   * resuelve la respuesta o lanza el error HTTP para que el llamador la gestione.
   */
  async fetchArmament(fireTrialId: string): Promise<TrialArmamentResponse> {
    this.#fetchArmamentParams.set({ fireTrialId });
    return awaitResourceValue(this.#fetchArmamentResource, this.#injector);
  }

  /** Re-fetch manual con el trial vigente. */
  reload(): void {
    this.armamentResource.reload();
  }
}
