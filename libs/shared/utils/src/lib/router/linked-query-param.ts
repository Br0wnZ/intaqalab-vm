import type { Injector, WritableSignal } from '@angular/core';
import { assertInInjectionContext, inject, linkedSignal, runInInjectionContext, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

export interface LinkedQueryParamOptions<T> {
  /** Converts the raw query param (or `null` when absent) into the signal value. */
  parse?: (raw: string | null) => T;
  /** Converts the signal value into the query param. Return `null`/`undefined` to remove it from the URL. */
  serialize?: (value: T) => string | null | undefined;
  /** Whether URL updates replace the history entry instead of pushing one. Default: `true`. */
  replaceUrl?: boolean;
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Writable signal synchronized both ways with a query param
 * (inspired by ngxtension's `linkedQueryParam`).
 *
 * - URL → signal: browser navigation (back/forward, deep link, F5) updates the signal.
 * - signal → URL: `set()`/`update()` navigate with `queryParamsHandling: 'merge'`.
 *
 * Ideal for catalog filters in master-data: state survives refresh and is shareable by URL.
 *
 * Limitation: each `set()` issues one navigation. To change several params at
 * once atomically, call `router.navigate` directly with all of them.
 *
 * @example
 * // string | null (raw param):
 * readonly searchTerm = linkedQueryParam('q');
 *
 * // typed with parse/serialize (page=1 removed from URL):
 * readonly page = linkedQueryParam('page', {
 *   parse: (raw) => (raw ? Number(raw) : 1),
 *   serialize: (value) => (value === 1 ? null : String(value)),
 * });
 */
export function linkedQueryParam<T>(
  key: string,
  options: LinkedQueryParamOptions<T> & { parse: (raw: string | null) => T },
): WritableSignal<T>;
export function linkedQueryParam(
  key: string,
  options?: LinkedQueryParamOptions<string | null>,
): WritableSignal<string | null>;
export function linkedQueryParam<T>(key: string, options?: LinkedQueryParamOptions<T>): WritableSignal<T> {
  if (!options?.injector) {
    assertInInjectionContext(linkedQueryParam);
  }

  const setup = (): WritableSignal<T> => {
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    const parse = options?.parse ?? ((raw: string | null) => raw as T);
    const serialize =
      options?.serialize ?? ((value: T) => (value === null || value === undefined ? null : String(value)));

    const queryParamMap = toSignal(route.queryParamMap, { initialValue: route.snapshot.queryParamMap });

    // linkedSignal: recomputes from the URL on external navigation,
    // but accepts local writes without waiting for the async navigation.
    const state = linkedSignal(() => parse(queryParamMap().get(key)));

    const applyLocally = state.set.bind(state);

    const setAndNavigate = (value: T): void => {
      applyLocally(value);
      void router.navigate([], {
        relativeTo: route,
        queryParams: { [key]: serialize(value) ?? null },
        queryParamsHandling: 'merge',
        replaceUrl: options?.replaceUrl ?? true,
      });
    };

    // Overriding set/update keeps the real signal node (valid for templates,
    // effects and interop) while adding URL synchronization.
    state.set = setAndNavigate;
    state.update = (updateFn: (value: T) => T) => setAndNavigate(updateFn(untracked(state)));

    return state;
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}
