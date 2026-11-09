import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AppLocale } from '../tokens/locale-signal.token';
import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';
import { IntaDecimalPipe } from './inta-decimal.pipe';

registerLocaleData(localeEs);

// ── Helpers ────────────────────────────────────────────────────────────────────

function localeSignalProvider(locale: AppLocale) {
  const sig = signal<AppLocale>(locale);
  return { signal: sig, provider: { provide: LOCALE_SIGNAL, useValue: sig } };
}

// ── Host component ─────────────────────────────────────────────────────────────

@Component({
  imports: [IntaDecimalPipe],
  template: `
    <span id="val">{{ value | intaDecimal }}</span>
  `,
})
class HostComponent {
  value: number | null | undefined = null;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IntaDecimalPipe', () => {
  describe.each<AppLocale>(['es-ES', 'en-US'])('exact formatting for %s', (locale) => {
    beforeEach(() => {
      const { provider } = localeSignalProvider(locale);
      TestBed.configureTestingModule({ providers: [provider] });
    });

    it.each([
      { value: 3.46, es: '3,46', en: '3.46' },
      { value: 12345.67, es: '12.345,67', en: '12,345.67' },
      { value: -12345.67, es: '-12.345,67', en: '-12,345.67' },
      { value: 0.01, es: '0,01', en: '0.01' },
      { value: 12345, es: '12.345', en: '12,345' },
      { value: 0, es: '0', en: '0' },
    ])('formats $value with locale-specific separators', ({ value, es, en }) => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());

      expect(pipe.transform(value)).toBe(locale === 'es-ES' ? es : en);
    });

    it('pads decimal zeros with the locale-specific separator', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());

      expect(pipe.transform(3.4, '1.2-2')).toBe(locale === 'es-ES' ? '3,40' : '3.40');
    });
  });

  describe('ES locale (es-ES)', () => {
    beforeEach(() => {
      const { provider } = localeSignalProvider('es-ES');
      TestBed.configureTestingModule({ providers: [provider] });
    });

    it('uses comma as decimal separator', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      const result = pipe.transform(1234.56);
      expect(result).toContain(',56');
      expect(result).not.toContain('.56');
    });

    it('respects custom digitsInfo — uses comma decimal sep', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      const result = pipe.transform(3.14159, '1.2-4');
      expect(result).toContain(',');
      expect(result).not.toContain('.'); // no dot as decimal in ES
      expect(result).toBe('3,1416');
    });

    it.each([
      { value: 3.46, expected: '3,5' },
      { value: -3.456789, expected: '-3,5' },
      { value: 1e-7, expected: '0' },
      { value: 1e-101, expected: '0' },
      { value: Number.MIN_VALUE, expected: '0' },
    ])('respects digitsInfo for $value', ({ value, expected }) => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(value, '1.0-1')).toBe(expected);
    });

    it('limits decimals to two by default', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(1.6500000000000001)).toBe('1,65');
    });

    it('formats negative — comma as decimal sep', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      const result = pipe.transform(-1234.5);
      expect(result).toContain('-');
      expect(result).toContain(',5');
      expect(result).not.toContain('.5');
    });
  });

  describe('EN locale (en-US)', () => {
    beforeEach(() => {
      const { provider } = localeSignalProvider('en-US');
      TestBed.configureTestingModule({ providers: [provider] });
    });

    it('uses dot as decimal separator', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      const result = pipe.transform(1234.56);
      expect(result).toContain('.56');
      expect(result).not.toContain(',56');
    });

    it('limits decimals to two by default', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(1.6500000000000001)).toBe('1.65');
    });

    it('formats integer', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      const result = pipe.transform(1234);
      // EN: thousands with comma → '1,234'; digits still present
      expect(result).toMatch(/1.?2.?3.?4/);
      expect(result).not.toContain(',5'); // must NOT mistake comma for decimal
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      const { provider } = localeSignalProvider('es-ES');
      TestBed.configureTestingModule({ providers: [provider] });
    });

    it('returns empty string for null', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(undefined)).toBe('');
    });

    it('returns empty string for NaN', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(NaN)).toBe('');
    });

    it('formats zero correctly', () => {
      const pipe = TestBed.runInInjectionContext(() => new IntaDecimalPipe());
      expect(pipe.transform(0)).toBe('0');
    });
  });

  describe('reactive to locale signal', () => {
    it('re-formats the same value when switching from Spanish to English and back', async () => {
      const { signal: localeSig, provider } = localeSignalProvider('es-ES');
      const { fixture } = await render(HostComponent, {
        componentProperties: { value: 12345.67 },
        providers: [provider],
      });

      expect(screen.getByText('12.345,67')).toBeInTheDocument();

      localeSig.set('en-US');
      fixture.detectChanges();
      expect(screen.getByText('12,345.67')).toBeInTheDocument();

      localeSig.set('es-ES');
      fixture.detectChanges();
      expect(screen.getByText('12.345,67')).toBeInTheDocument();
      expect(fixture.componentInstance.value).toBe(12345.67);
    });
  });
});
