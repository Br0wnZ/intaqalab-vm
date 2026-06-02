import type { Provider } from '@angular/core';
import { Injectable } from '@angular/core';
import type { MatDateFormats } from '@angular/material/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { isValid, parse } from 'date-fns';

// Generic override to prevent timezone shift errors during JSON serialization of Date objects.
// When a date is selected, it represents a local day. Subtracting the offset forces JSON.stringify()
// to serialize the local values in YYYY-MM-DDTHH:mm:ss.sssZ format, avoiding off-by-one-day errors.
Date.prototype.toJSON = function (this: Date) {
  const timezoneOffsetInMs = this.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(this.getTime() - timezoneOffsetInMs);
  return localDate.toISOString();
};

/**
 * Spanish date format: DD/MM/YYYY
 */
export const INTA_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

/**
 * Custom date adapter that parses DD/MM/YYYY (Spanish format).
 * Falls back to standard ISO 8601 parsing if DD/MM/YYYY fails.
 */
@Injectable()
export class IntaNativeDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, _parseFormat?: unknown): Date | null {
    if (typeof value === 'number') {
      return new Date(value);
    }
    if (!value || typeof value !== 'string') {
      return null;
    }
    // Strict DD/MM/YYYY — no fallback to avoid silent English-format correction.
    // Returning new Date(NaN) triggers the matDatepickerParse validation error.
    const parsed = parse(value, 'dd/MM/yyyy', new Date());
    return isValid(parsed) ? parsed : new Date(NaN);
  }
}

/**
 * Provides the Inta date adapter globally with Spanish DD/MM/YYYY format.
 * Use this in component providers or in app.config.ts.
 */
export function provideIntaDateAdapter(): Provider[] {
  return [
    { provide: DateAdapter, useClass: IntaNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: INTA_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
  ];
}
