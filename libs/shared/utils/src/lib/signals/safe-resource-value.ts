import type { HttpResourceRef } from '@angular/common/http';
import type { ResourceRef } from '@angular/core';

/**
 * Type that represents a generic resource that has a value signal
 * and optionally a hasValue signal.
 */
type GenericResourceRef<T> = {
  value: () => T | undefined;
  hasValue?: () => boolean;
};

/**
 * Safely reads the value from an Angular Resource or HttpResource.
 * It checks if `hasValue()` is available and true before accessing `value()`.
 * If `hasValue()` is not available, it attempts to read `value()` safely.
 *
 * @param resource - The resource reference to read from
 * @returns The resource value or undefined if not available
 */
export function safeResourceValue<T>(resource: GenericResourceRef<T>): T | undefined {
  if (typeof resource.hasValue === 'function') {
    return resource.hasValue() ? resource.value() : undefined;
  }

  try {
    return resource.value();
  } catch {
    return undefined;
  }
}
