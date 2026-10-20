import { Injectable, signal } from '@angular/core';

/**
 * Contexto de la prueba de fuego activa para las queries de planning.
 * `centerId` es opcional: la plataforma actual resuelve el centro en la propia
 * URL base del planning endpoint (`injectPlanningEndpoint`); si se aporta, se
 * antepone el prefijo estándar `centers/{centerId}` del API OpenAPI.
 */
export type PlanningTrialContext = {
  centerId?: string | null;
  fireTrialId: string;
};

@Injectable({
  providedIn: 'root',
})
export class PlanningTrialContextService {
  readonly #context = signal<PlanningTrialContext | null>(null);

  /** Contexto activo; `null` hasta que se fija la prueba (evita el fetch inicial). */
  readonly context = this.#context.asReadonly();

  /** Fija la prueba activa; dispara (o re-dispara tras cambio de trial) todas las queries. */
  setTrial(context: PlanningTrialContext): void {
    this.#context.set(context);
  }

  /** Limpia el contexto; las queries vuelven al estado "sin fetch". */
  clear(): void {
    this.#context.set(null);
  }
}
