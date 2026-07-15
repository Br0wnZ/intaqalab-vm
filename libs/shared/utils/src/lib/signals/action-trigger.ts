import type { Signal } from '@angular/core';
import { signal } from '@angular/core';

export interface ActionTrigger<T> {
  /**
   * The signal to read inside `httpResource`.
   * Returns `null` when reset.
   */
  readonly value: Signal<T | null>;

  /**
   * Triggers the resource by setting a new payload.
   * Will ALWAYS force reactivity even if the payload is identical to the previous one,
   * bypassing the default signal equality check.
   */
  fire(payload: T): void;

  /**
   * Resets the trigger to null.
   * When read by `httpResource`, returning `undefined` (if !value) sets the resource status back to `Idle`.
   */
  reset(): void;
}

/**
 * Creates a trigger specifically designed for mutational `httpResource` operations (POST/PUT/DELETE).
 * Solves the problem where firing the same payload twice does not re-trigger the resource.
 */
export function actionTrigger<T>(): ActionTrigger<T> {
  // equal: () => false ensures that every .set() triggers dependents,
  // preventing the resource from caching the same identical payload.
  const state = signal<T | null>(null, { equal: () => false });

  return {
    value: state.asReadonly(),
    fire: (payload: T) => state.set(payload),
    reset: () => state.set(null),
  };
}
