import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';
import type { AppLocale } from '../tokens/locale-signal.token';
import { LocaleDecimalInputDirective } from './locale-decimal-input.directive';

// ── Helpers ────────────────────────────────────────────────────────────────────

function localeSignalProvider(locale: AppLocale) {
  const sig = signal<AppLocale>(locale);
  return { signal: sig, provider: { provide: LOCALE_SIGNAL, useValue: sig } };
}

// ── Host components ────────────────────────────────────────────────────────────

@Component({
  imports: [LocaleDecimalInputDirective],
  template: `
    <input id="dec" libLocalDecimal />
  `,
})
class HostComponent {}

@Component({
  imports: [LocaleDecimalInputDirective],
  template: `
    <input id="dec" libLocalDecimal [decimals]="3" />
  `,
})
class HostComponent3Decimals {}

// ── Event helpers ──────────────────────────────────────────────────────────────

function fireKeydown(el: HTMLInputElement, key: string, extra?: KeyboardEventInit): boolean {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
  const prevented = !el.dispatchEvent(event);
  return prevented;
}

function firePaste(el: HTMLInputElement, text: string): void {
  const dt = { getData: (_format: string) => text } as unknown as DataTransfer;
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: dt, writable: false });
  el.dispatchEvent(event);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LocaleDecimalInputDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let inputEl: HTMLInputElement;

  async function setup(locale: AppLocale = 'es-ES', component = HostComponent) {
    const { provider, signal: localeSig } = localeSignalProvider(locale);
    await TestBed.configureTestingModule({
      imports: [component],
      providers: [provider],
    }).compileComponents();

    fixture = TestBed.createComponent(component as typeof HostComponent);
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('#dec') as HTMLInputElement;
    return localeSig;
  }

  describe('initialization', () => {
    beforeEach(async () => setup());

    it('sets type to text on init', () => {
      expect(inputEl.type).toBe('text');
    });

    it('sets inputMode to decimal', () => {
      expect(inputEl.inputMode).toBe('decimal');
    });
  });

  describe('ES locale — keydown filtering', () => {
    beforeEach(async () => setup('es-ES'));

    it('allows digit keys', () => {
      expect(fireKeydown(inputEl, '5')).toBe(false); // NOT prevented
    });

    it('allows comma (decimal separator in ES)', () => {
      expect(fireKeydown(inputEl, ',')).toBe(false);
    });

    it('blocks dot when used as decimal separator (ES uses comma)', () => {
      expect(fireKeydown(inputEl, '.')).toBe(true); // prevented
    });

    it('allows navigation keys', () => {
      expect(fireKeydown(inputEl, 'Backspace')).toBe(false);
      expect(fireKeydown(inputEl, 'ArrowLeft')).toBe(false);
      expect(fireKeydown(inputEl, 'Delete')).toBe(false);
    });

    it('allows minus at position 0', () => {
      inputEl.setSelectionRange(0, 0);
      expect(fireKeydown(inputEl, '-')).toBe(false);
    });

    it('blocks second comma', () => {
      inputEl.value = '1,5';
      expect(fireKeydown(inputEl, ',')).toBe(true);
    });

    it('blocks letters', () => {
      expect(fireKeydown(inputEl, 'a')).toBe(true);
      expect(fireKeydown(inputEl, 'e')).toBe(true);
    });
  });

  describe('EN locale — keydown filtering', () => {
    beforeEach(async () => setup('en-US'));

    it('allows dot (decimal separator in EN)', () => {
      expect(fireKeydown(inputEl, '.')).toBe(false);
    });

    it('blocks comma (thousands separator in EN)', () => {
      expect(fireKeydown(inputEl, ',')).toBe(true);
    });
  });

  describe('max decimal enforcement (default = 2)', () => {
    beforeEach(async () => setup('es-ES'));

    it('allows 2nd decimal digit', () => {
      // Simulate: "1,5" — cursor after the "5", adding one more digit
      inputEl.value = '1,5';
      inputEl.setSelectionRange(3, 3); // cursor after '5'
      expect(fireKeydown(inputEl, '6')).toBe(false); // 2nd decimal → allowed
    });

    it('blocks 3rd decimal digit', () => {
      // "1,56" — cursor at end, trying to add a 3rd decimal digit
      inputEl.value = '1,56';
      inputEl.setSelectionRange(4, 4);
      expect(fireKeydown(inputEl, '7')).toBe(true); // 3rd decimal → blocked
    });

    it('allows digit before the separator (not a decimal digit)', () => {
      inputEl.value = '1,56';
      inputEl.setSelectionRange(1, 1); // cursor before comma (integer part)
      expect(fireKeydown(inputEl, '2')).toBe(false); // integer part → allowed
    });
  });

  describe('max decimal enforcement — custom [decimals]="3"', () => {
    it('allows 3rd decimal digit with [decimals]="3"', async () => {
      await setup('es-ES', HostComponent3Decimals);
      inputEl.value = '1,56';
      inputEl.setSelectionRange(4, 4);
      expect(fireKeydown(inputEl, '7')).toBe(false); // 3rd decimal allowed
    });

    it('blocks 4th decimal digit with [decimals]="3"', async () => {
      await setup('es-ES', HostComponent3Decimals);
      inputEl.value = '1,567';
      inputEl.setSelectionRange(5, 5);
      expect(fireKeydown(inputEl, '8')).toBe(true); // 4th → blocked
    });
  });

  describe('paste sanitization', () => {
    beforeEach(async () => setup('es-ES'));

    it('removes letters from pasted text', () => {
      firePaste(inputEl, '1,56abc');
      expect(inputEl.value).not.toContain('a');
      expect(inputEl.value).not.toContain('b');
      expect(inputEl.value).not.toContain('c');
    });

    it('truncates pasted decimal to max 2 digits', () => {
      firePaste(inputEl, '1,5678');
      // Should truncate fractional to 2 digits
      const fracPart = inputEl.value.split(',')[1];
      expect(fracPart?.length).toBeLessThanOrEqual(2);
    });
  });

  describe('blur → parse and emit', () => {
    beforeEach(async () => setup('es-ES'));

    it('parses ES decimal string to number on blur', () => {
      let emittedValue: number | null = null;
      const dir = TestBed.runInInjectionContext(() =>
        fixture.debugElement.query((el) => el.nativeElement === inputEl)?.injector.get(LocaleDecimalInputDirective),
      );
      if (dir) {
        dir.registerOnChange((v: number | null) => {
          emittedValue = v;
        });
      }

      inputEl.value = '1234,56';
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emittedValue).toBeCloseTo(1234.56, 2);
    });
  });

  describe('reactive locale change', () => {
    it('updates display when locale signal changes while unfocused', async () => {
      const localeSig = await setup('es-ES');

      // Write a value through CVA
      const dir = fixture.debugElement
        .query((el) => el.nativeElement === inputEl)
        ?.injector.get(LocaleDecimalInputDirective);
      dir?.writeValue(1234.56);
      fixture.detectChanges();

      // ES: comma as decimal
      expect(inputEl.value).toContain(',');

      // Switch to EN
      localeSig.set('en-US');
      fixture.detectChanges();
      await fixture.whenStable();

      // EN: dot as decimal
      expect(inputEl.value).toContain('.');
    });
  });
});
