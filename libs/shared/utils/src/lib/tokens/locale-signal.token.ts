import { InjectionToken, signal } from '@angular/core';
import type { Signal } from '@angular/core';

/**
 * BCP-47 locale strings supported by the app.
 * Kept narrow intentionally — extend if more locales are added.
 */
export type AppLocale = 'es-ES' | 'en-US';

/**
 * Injection token for a reactive locale signal.
 *
 * The default factory returns a static `'es-ES'` signal (safe fallback).
 * For full reactivity, provide this token via `provideLocaleSignal()` from
 * `@intaqalab/data-access` in `app.config.ts`.
 *
 * @example — providing reactive version (app.config.ts):
 * import { provideLocaleSignal } from '@intaqalab/data-access';
 * providers: [...provideLocaleSignal()]
 *
 * @example — using in pipes/directives:
 * readonly #locale = inject(LOCALE_SIGNAL);
 */
export const LOCALE_SIGNAL = new InjectionToken<Signal<AppLocale>>('LOCALE_SIGNAL', {
  // Safe default: Spanish. Works even without explicit app-level provider.
  factory: () => signal<AppLocale>('es-ES'),
});
