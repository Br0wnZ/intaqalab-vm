import { Injectable, signal } from '@angular/core';

const SHOW_DEBOUNCE_MS = 150;

@Injectable({ providedIn: 'root' })
export class LoaderService {
  readonly #activeRequests = signal(0);
  readonly #isLoading = signal(false);
  readonly isLoading = this.#isLoading.asReadonly();

  #showTimer: ReturnType<typeof setTimeout> | null = null;

  show(): void {
    this.#activeRequests.update((count) => count + 1);
    if (!this.#showTimer) {
      this.#showTimer = setTimeout(() => {
        this.#showTimer = null;
        if (this.#activeRequests() > 0) {
          this.#isLoading.set(true);
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
      this.#isLoading.set(false);
    }
  }

  reset(): void {
    if (this.#showTimer) {
      clearTimeout(this.#showTimer);
      this.#showTimer = null;
    }
    this.#activeRequests.set(0);
    this.#isLoading.set(false);
  }
}
