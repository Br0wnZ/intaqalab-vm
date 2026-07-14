import type { Signal } from '@angular/core';
import { computed, untracked } from '@angular/core';

/**
 * Returns a signal holding the *previous* value of `source`
 * (inspired by ngxtension's `computedPrevious`).
 *
 * On first read it returns the current value (there is no previous one yet).
 * Being pull-based, "previous" means the value held the last time the
 * returned signal was read — intermediate values between reads are not kept.
 *
 * @example
 * const status = this.store.executionStatus;
 * const previousStatus = computedPrevious(status);
 * // status: 'READY' → 'FIRING'  ⇒  previousStatus() === 'READY'
 */
export function computedPrevious<T>(source: Signal<T>): Signal<T> {
  let current = untracked(source);
  let previous = current;

  return computed(() => {
    const value = source();
    if (!Object.is(value, current)) {
      previous = current;
      current = value;
    }
    return previous;
  });
}
