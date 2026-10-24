import type { PipeTransform } from '@angular/core';
import { Pipe, inject } from '@angular/core';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';
import { formatPreciseNumber } from './format-precise-number';

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

  /**
   * @param value    - Number to format (null/undefined renders as empty string)
   * @param digitsInfo - Format string `minInt.minFrac-maxFrac` (default `'1.0-2'`)
   */
  transform(value: number | null | undefined, digitsInfo = '1.0-2'): string {
    // eslint-disable-next-line eqeqeq
    if (value == null || isNaN(value)) return '';

    const [, fracPart] = digitsInfo.split('.');
    const [minFrac] = (fracPart ?? '0-2').split('-').map(Number);

    return formatPreciseNumber(value, this.#localeSignal(), minFrac ?? 0);
  }
}
