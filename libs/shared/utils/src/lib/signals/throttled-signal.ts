import type { Injector, Signal } from '@angular/core';
import { assertInInjectionContext, effect, signal, untracked } from '@angular/core';

export interface ThrottledSignalOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Derives a read-only signal that mirrors `source` at most once per
 * `intervalMs` (leading + trailing: the first change propagates immediately,
 * the last change within the window lands when it closes).
 *
 * Complement to `debouncedSignal`: use throttle when you need *periodic*
 * updates while the source keeps changing (progress indicators, live gauges),
 * and debounce when you only care about the value after the changes stop
 * (search inputs).
 *
 * @example
 * // Chart re-renders at most every 500 ms while telemetry streams in:
 * readonly pressure = this.store.livePressure;
 * readonly chartPressure = throttledSignal(this.pressure, 500);
 */
export function throttledSignal<T>(source: Signal<T>, intervalMs = 300, options?: ThrottledSignalOptions): Signal<T> {
  if (!options?.injector) {
    assertInInjectionContext(throttledSignal);
  }

  const output = signal(untracked(source));
  let lastEmitAt = Number.NEGATIVE_INFINITY;

  effect(
    (onCleanup) => {
      const value = source();
      const elapsed = Date.now() - lastEmitAt;

      if (elapsed >= intervalMs) {
        lastEmitAt = Date.now();
        output.set(value);
        return;
      }

      // Window still open: schedule the trailing emission with the latest value.
      const timeoutId = setTimeout(() => {
        lastEmitAt = Date.now();
        output.set(value);
      }, intervalMs - elapsed);
      onCleanup(() => clearTimeout(timeoutId));
    },
    { injector: options?.injector },
  );

  return output.asReadonly();
}
