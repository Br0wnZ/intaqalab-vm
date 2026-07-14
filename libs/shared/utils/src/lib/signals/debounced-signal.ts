import type { Injector, Signal } from '@angular/core';
import { assertInInjectionContext, effect, signal, untracked } from '@angular/core';

export interface DebouncedSignalOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Derives a read-only signal that mirrors `source` after `debounceMs` of silence
 * (inspired by ngxtension's `debounceSignal` — implemented without RxJS).
 *
 * Each change on `source` restarts the timer; only the last value within the
 * window lands on the returned signal. Pending timers are cleared automatically
 * when the owning injector is destroyed.
 *
 * Typical use: free-text search inputs feeding the Signal Trigger Pattern,
 * so `httpResource` does not refetch on every keystroke.
 *
 * @example
 * readonly searchTerm = signal('');
 * readonly debouncedTerm = debouncedSignal(this.searchTerm, 300);
 * readonly results = httpResource(() => `/api/catalog?q=${this.debouncedTerm()}`);
 */
export function debouncedSignal<T>(source: Signal<T>, debounceMs = 300, options?: DebouncedSignalOptions): Signal<T> {
  if (!options?.injector) {
    assertInInjectionContext(debouncedSignal);
  }

  const output = signal(untracked(source));

  effect(
    (onCleanup) => {
      const value = source();
      const timeoutId = setTimeout(() => output.set(value), debounceMs);
      onCleanup(() => clearTimeout(timeoutId));
    },
    { injector: options?.injector },
  );

  return output.asReadonly();
}
