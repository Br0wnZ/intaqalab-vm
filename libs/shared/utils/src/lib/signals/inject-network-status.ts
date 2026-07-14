import type { Injector, Signal } from '@angular/core';
import { DestroyRef, assertInInjectionContext, inject, runInInjectionContext, signal } from '@angular/core';

export interface InjectNetworkStatusOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Exposes browser connectivity as a read-only signal
 * (inspired by ngxtension's `injectNetwork`, reduced to the online flag).
 *
 * `true` while the browser reports connectivity (`navigator.onLine`),
 * updated reactively via the `online`/`offline` window events.
 * Listeners are removed when the owning injector is destroyed.
 *
 * @example
 * readonly online = injectNetworkStatus();
 * // template: @if (!online()) { <inta-offline-banner /> }
 */
export function injectNetworkStatus(options?: InjectNetworkStatusOptions): Signal<boolean> {
  if (!options?.injector) {
    assertInInjectionContext(injectNetworkStatus);
  }

  const setup = (): Signal<boolean> => {
    const destroyRef = inject(DestroyRef);
    const online = signal(navigator.onLine);

    const handleOnline = (): void => online.set(true);
    const handleOffline = (): void => online.set(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    destroyRef.onDestroy(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });

    return online.asReadonly();
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}
