import { Injectable, signal } from '@angular/core';

const SHOW_DEBOUNCE_MS = 150;

/** Servicio que rastrea peticiones HTTP mutantes activas (PUT/POST/DELETE) */
@Injectable({ providedIn: 'root' })
export class MutationLoaderService {
  readonly #activeRequests = signal(0);
  readonly #isMutating = signal(false);

  readonly isMutating = this.#isMutating.asReadonly();

  #showTimer: ReturnType<typeof setTimeout> | null = null;

  show(): void {
    this.#activeRequests.update((count) => count + 1);
    if (!this.#showTimer) {
      this.#showTimer = setTimeout(() => {
        this.#showTimer = null;
        if (this.#activeRequests() > 0) {
          this.#isMutating.set(true);
        }
      }, SHOW_DEBOUNCE_MS);
    }
  }

  hide(): void {
    this.#activeRequests.update((count) => Math.max(0, count - 1));
    if (this.#activeRequests() === 0) {
      if (this.#showTimer) {
        clearTimeout(this.#showTimer);
        this.#showTimer = null;
      }
      this.#isMutating.set(false);
    }
  }

  reset(): void {
    if (this.#showTimer) {
      clearTimeout(this.#showTimer);
      this.#showTimer = null;
    }
    this.#activeRequests.set(0);
    this.#isMutating.set(false);
  }
}
