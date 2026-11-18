import { formatNumber } from '@angular/common';
import type { PipeTransform } from '@angular/core';
import { Pipe, inject } from '@angular/core';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';
import { formatPreciseNumber } from './format-precise-number';

/**
 * Locale-aware decimal pipe.
 *
 * Formats numbers using the reactive locale from `LOCALE_SIGNAL` token:
 * - `es-ES` → thousands: `.`  decimal: `,`  (e.g. `12.345,67`)
 * - `en-US` → thousands: `,`  decimal: `.`  (e.g. `12,345.67`)
 *
 * By default (when `digitsInfo` is omitted or empty), delegates to
 * `formatPreciseNumber()` so all significant decimal digits are preserved
 * without rounding or truncation (no-rounding contract).
 * When `digitsInfo` is explicitly provided, delegates to Angular `formatNumber()`.
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
   * @param value      - Number to format (null/undefined renders as empty string)
   * @param digitsInfo - Optional format string `minInt.minFrac-maxFrac`; when omitted/falsy, preserves full precision (zero rounding)
   */
  transform(value: number | null | undefined, digitsInfo?: string): string {
    // eslint-disable-next-line eqeqeq
    if (value == null || isNaN(value)) return '';

    const locale = this.#localeSignal();
    return digitsInfo ? formatNumber(value, locale, digitsInfo) : formatPreciseNumber(value, locale);
  }
}
