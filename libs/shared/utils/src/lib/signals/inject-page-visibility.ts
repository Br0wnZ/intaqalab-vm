import type { Injector, Signal } from '@angular/core';
import { DestroyRef, assertInInjectionContext, inject, runInInjectionContext, signal } from '@angular/core';

export interface InjectPageVisibilityOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Page visibility as a read-only signal (own utility over the Page Visibility API).
 *
 * `true` while the tab is visible, `false` when hidden (tab switch, minimized
 * window). Listener removed when the owning injector is destroyed.
 *
 * Typical use: pause polling or live telemetry while the tab is in the
 * background, refresh stale data on return.
 *
 * @example
 * readonly pageVisible = injectPageVisibility();
 *
 * // Poll execution status only while the tab is visible:
 * explicitEffect([this.pageVisible], ([visible]) =>
 *   visible ? this.store.startPolling() : this.store.stopPolling(),
 * );
 */
export function injectPageVisibility(options?: InjectPageVisibilityOptions): Signal<boolean> {
  if (!options?.injector) {
    assertInInjectionContext(injectPageVisibility);
  }

  const setup = (): Signal<boolean> => {
    const visible = signal(document.visibilityState === 'visible');

    const onVisibilityChange = (): void => visible.set(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', onVisibilityChange));

    return visible.asReadonly();
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}
