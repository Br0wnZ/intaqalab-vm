import type { Signal } from '@angular/core';

/**
 * Clave de selección serie|disparo usada para detectar cambios de consulta.
 */
export function shotSelectionKey(serie: string | null, disparo: string | null): string {
  return `${serie ?? ''}|${disparo ?? ''}`;
}

/**
 * Guard contra condiciones de carrera en cargas GET asociadas a los
 * selectores de serie/disparo.
 *
 * Los selectores de consulta NO marcan el formulario como dirty/touched,
 * pero sí deben ser reactivos: cada cambio dispara un GET. Si el usuario
 * cambia de disparo mientras el GET anterior está en vuelo, su resultado
 * debe descartarse. Este guard encapsula ese patrón (requestVersion +
 * selectionKey) que antes estaba duplicado en cada widget.
 *
 * @example
 * ```ts
 * readonly #selectionKey = computed(() => shotSelectionKey(this.selectorSerie(), this.selectorDisparo()));
 * readonly #guard = createSelectionGuard(() => this.#selectionKey());
 *
 * async #loadSelectedShotData(): Promise<void> {
 *   const key = this.#selectionKey();
 *   const ticket = this.#guard.begin();
 *   const response = await this.#service.fetchShot(fireTrialId, serie, disparo);
 *   if (!ticket.isFresh(key)) return;
 *   this.applyRemoteShotData(response);
 * }
 * ```
 */
export function createSelectionGuard(currentKey: () => string) {
  let version = 0;

  return {
    /**
     * Invalida todas las peticiones anteriores y devuelve un "ticket" para
     * comprobar si la petición actual sigue siendo relevante.
     */
    begin(): { isFresh: (key: string) => boolean } {
      const requestVersion = ++version;
      return {
        isFresh: (key: string): boolean => requestVersion === version && currentKey() === key,
      };
    },
  };
}

export type SelectionGuard = ReturnType<typeof createSelectionGuard>;
export type SelectionTicket = ReturnType<SelectionGuard['begin']>;

/** Tipo auxiliar para declarar la clave como Signal<string>. */
export type SelectionKeySignal = Signal<string>;
