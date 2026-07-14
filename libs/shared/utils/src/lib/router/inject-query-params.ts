import type { Injector, Signal } from '@angular/core';
import { assertInInjectionContext, computed, inject, runInInjectionContext } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { Params } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

export interface InjectQueryParamsOptions {
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Query params of the current `ActivatedRoute` as a signal
 * (inspired by ngxtension's `injectQueryParams`).
 *
 * Read-only view — to keep component state *synchronized both ways* with a
 * query param, use `linkedQueryParam()` instead.
 *
 * @example
 * readonly searchTerm = injectQueryParams('q');    // Signal<string | null>
 * readonly allQueryParams = injectQueryParams();   // Signal<Params>
 */
export function injectQueryParams(key?: undefined, options?: InjectQueryParamsOptions): Signal<Params>;
export function injectQueryParams(key: string, options?: InjectQueryParamsOptions): Signal<string | null>;
export function injectQueryParams(
  key?: string,
  options?: InjectQueryParamsOptions,
): Signal<Params> | Signal<string | null> {
  if (!options?.injector) {
    assertInInjectionContext(injectQueryParams);
  }

  const setup = (): Signal<Params> | Signal<string | null> => {
    const route = inject(ActivatedRoute);
    const queryParams = toSignal(route.queryParams, { initialValue: route.snapshot.queryParams });

    return key === undefined ? queryParams : computed(() => (queryParams()[key] as string | undefined) ?? null);
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}
