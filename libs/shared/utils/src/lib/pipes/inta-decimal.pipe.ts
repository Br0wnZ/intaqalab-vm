import type { PipeTransform } from '@angular/core';
import { Pipe, computed, inject } from '@angular/core';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';

/**
 * Locale-aware decimal pipe.
 *
 * Formats numbers using the reactive locale from `LOCALE_SIGNAL` token:
 * - `es-ES` → thousands: `.`  decimal: `,`  (e.g. `1.234,56`)
 * - `en-US` → thousands: `,`  decimal: `.`  (e.g. `1,234.56`)
 *
 * Reactively recomputes when the locale signal changes (language switch).
 * Provide `LOCALE_SIGNAL` via `provideLocaleSignal()` from `@intaqalab/data-access`
 * for full reactivity — falls back to static `es-ES` if not provided.
 *
 * @example
 * {{ value | intaDecimal }}
 * {{ pressure | intaDecimal:'1.2-4' }}
 */
@Pipe({
  name: 'intaDecimal',
  pure: false, // required: re-evaluates when locale signal changes
})
export class IntaDecimalPipe implements PipeTransform {
  readonly #localeSignal = inject(LOCALE_SIGNAL);

  /** Cached formatter — recreated only when locale changes. */
  readonly #formatter = computed(() => {
    // Reading the signal here registers the reactive dependency.
    // The formatter is recreated on locale change automatically.
    return (minFrac: number, maxFrac: number) =>
      new Intl.NumberFormat(this.#localeSignal(), {
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      });
  });

  /**
   * @param value    - Number to format (null/undefined renders as empty string)
   * @param digitsInfo - Format string `minInt.minFrac-maxFrac` (default `'1.0-2'`)
   */
  transform(value: number | null | undefined, digitsInfo = '1.0-2'): string {
    // eslint-disable-next-line eqeqeq
    if (value == null || isNaN(value)) return '';

    const [, fracPart] = digitsInfo.split('.');
    const [minFrac, maxFrac] = (fracPart ?? '0-2').split('-').map(Number);

    return this.#formatter()(minFrac ?? 0, maxFrac ?? 2).format(value);
  }
}
