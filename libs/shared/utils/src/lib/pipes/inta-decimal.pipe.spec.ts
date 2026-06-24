import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';
import type { AppLocale } from '../tokens/locale-signal.token';
import { IntaDecimalPipe } from './inta-decimal.pipe';

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
    it('re-formats when signal changes', async () => {
      const { signal: localeSig, provider } = localeSignalProvider('es-ES');

      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [provider],
      }).compileComponents();

      const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
      fixture.componentInstance.value = 1234.56;
      fixture.detectChanges();

      const span = fixture.nativeElement.querySelector('#val') as HTMLElement;
      expect(span.textContent?.trim()).toContain(','); // ES decimal

      // Change to EN
      localeSig.set('en-US');
      fixture.detectChanges();
      expect(span.textContent?.trim()).toContain('.'); // EN decimal
    });
  });
});
