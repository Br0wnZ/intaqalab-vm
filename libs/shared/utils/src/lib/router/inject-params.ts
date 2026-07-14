import type { Injector, Signal } from '@angular/core';
import { assertInInjectionContext, computed, inject, runInInjectionContext } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Params } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

export interface InjectParamsOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Route params of the current `ActivatedRoute` as a signal
 * (inspired by ngxtension's `injectParams`).
 *
 * Feeds the Signal Trigger Pattern directly: an `httpResource` reading the
 * returned signal refetches automatically on route param changes — no
 * `paramMap.subscribe()` boilerplate.
 *
 * @example
 * readonly trialId = injectParams('trialId');           // Signal<string | null>
 * readonly allParams = injectParams();                  // Signal<Params>
 * readonly trial = httpResource(() =>
 *   this.trialId() ? `/api/trials/${this.trialId()}` : undefined,
 * );
 */
export function injectParams(key?: undefined, options?: InjectParamsOptions): Signal<Params>;
export function injectParams(key: string, options?: InjectParamsOptions): Signal<string | null>;
export function injectParams(key?: string, options?: InjectParamsOptions): Signal<Params> | Signal<string | null> {
  if (!options?.injector) {
    assertInInjectionContext(injectParams);
  }

  const setup = (): Signal<Params> | Signal<string | null> => {
    const route = inject(ActivatedRoute);
    const params = toSignal(route.params, { initialValue: route.snapshot.params });

    return key === undefined ? params : computed(() => (params()[key] as string | undefined) ?? null);
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}
