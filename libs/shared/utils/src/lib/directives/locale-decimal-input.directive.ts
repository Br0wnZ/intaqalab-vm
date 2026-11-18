import type { OnInit } from '@angular/core';
import {
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { FormValueControl, ParseResult } from '@angular/forms/signals';
import { transformedValue } from '@angular/forms/signals';

import { formatPreciseNumber } from '../pipes/format-precise-number';
import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';

/**
 * Locale-aware decimal input directive.
 *
 * Transforms an `<input>` into a locale-aware decimal field:
 * - Sets `type="text"` + `inputMode="decimal"` (numeric keyboard on mobile).
 * - Allows only digits, the locale-specific decimal separator, `-` (negatives), and navigation keys.
 * - Preserves all decimal places on input, paste, display, and blur.
 * - On focus: converts the stored JS number to an editable locale string (no thousands separator).
 * - On blur: parses the locale string back to a JS `number` and notifies Signal Forms / listeners.
 * - Implements `FormValueControl<number | null>` with `transformedValue()` → native `[formField]` integration.
 * - Also supports standalone `[decimalValue]` / `(decimalValueChange)` bindings.
 * - Reactive to language changes via `LOCALE_SIGNAL` token (no direct `data-access` dependency).
 *
 * @example
 * <input matInput libLocalDecimal [formField]="form.velocity" />
 * <input matInput libLocalDecimal [decimals]="4" [formField]="form.pressure" />
 */
@Directive({
  selector: 'input[libLocalDecimal]',
  host: {
    '(input)': 'onInput()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
    '(keydown)': 'onKeyDown($event)',
    '(paste)': 'onPaste($event)',
  },
})
export class LocaleDecimalInputDirective implements FormValueControl<number | null>, OnInit {
  /** Model signal for Signal Forms `FormValueControl<number | null>` integration. */
  readonly value = model<number | null>(null);
  /** Emits on blur to mark the bound Signal Forms field as touched. */
  readonly touch = output<void>();

  /** Retained for compatibility; precision is never limited. */
  readonly decimals = input<number>(2);
  /** Minimum fraction digits displayed — default 0. */
  readonly minDecimals = input<number>(0);
  readonly numericSign = input<'any' | 'non-negative' | 'non-positive'>('any');
  /** Standalone value input for non-`[formField]` consumers (e.g. `InputSelect`). */
  readonly decimalValue = input<number | null>();
  /** Standalone value change output for non-`[formField]` consumers. */
  readonly decimalValueChange = output<number | null>();

  readonly #el = inject(ElementRef<HTMLInputElement>);
  readonly #localeSignal = inject(LOCALE_SIGNAL);

  /** The decimal separator character for the active locale. */
  readonly #decimalSeparator = computed(() => (this.#localeSignal() === 'es-ES' ? ',' : '.'));
  /** Whether user is currently editing the field. */
  readonly #isFocused = signal(false);
  /** Tracks whether a bound form control or `decimalValue` has initialized the value. */
  #hasBoundValue = false;

  /** Raw string value synchronized with `value` via `transformedValue()`. */
  readonly #rawValue = transformedValue(this.value, {
    parse: (raw: string): ParseResult<number | null> => this.#parseForTransform(raw),
    format: (val: number | null): string => this.#formatForTransform(val),
  });

  /** Parse errors produced by the latest `transformedValue()` transformation. */
  readonly parseErrors = this.#rawValue.parseErrors;

  constructor() {
    effect(() => {
      const legacyValue = this.decimalValue();
      if (legacyValue !== undefined) {
        this.#hasBoundValue = true;
        untracked(() => {
          if (this.value() !== legacyValue) {
            this.value.set(legacyValue);
          }
        });
      }
    });

    // Effect runs in injection context → auto-cleaned when directive is destroyed.
    effect(() => {
      const currentValue = this.value();
      if (typeof currentValue === 'string') {
        return;
      }
      if (currentValue !== null) {
        this.#hasBoundValue = true;
      }
      const formatted = this.#rawValue();
      if (!this.#hasBoundValue && currentValue === null) {
        return;
      }
      const el = this.#el.nativeElement;
      if (el.value !== formatted) {
        el.value = formatted;
      }
    });
  }

  ngOnInit(): void {
    const el = this.#el.nativeElement;
    el.type = 'text';
    el.autocomplete = 'off';
    el.inputMode = 'decimal';
    const current = this.value();
    if ((this.#hasBoundValue || current !== null) && typeof current === 'number') {
      el.value = this.#formatForTransform(current);
    }
  }

  // ── Host Listeners ──────────────────────────────────────────────────────────

  onInput(): void {
    const raw = this.#el.nativeElement.value;
    const parsed = this.#parseLocaleString(raw);
    if (!this.#isSignAllowed(raw, parsed)) return;

    this.#hasBoundValue = true;
    this.#rawValue.set(raw);
    this.decimalValueChange.emit(this.value());
  }

  onFocus(): void {
    const el = this.#el.nativeElement;
    if (el.readOnly || el.disabled) return;

    this.#isFocused.set(true);
    const current = this.value();
    if (current !== null && !Number.isNaN(current)) {
      el.value = this.#toEditString(current);
    }
  }

  onBlur(): void {
    const el = this.#el.nativeElement;
    if (el.readOnly || el.disabled) {
      this.#isFocused.set(false);
      return;
    }

    this.#isFocused.set(false);
    this.touch.emit();

    const raw = el.value;
    const parsed = this.#parseLocaleString(raw);
    if (!this.#isSignAllowed(raw, parsed)) {
      const fallback = this.#formatForTransform(this.value());
      this.#rawValue.set(fallback);
      el.value = fallback;
      return;
    }

    this.#hasBoundValue = true;
    this.#rawValue.set(raw);
    const committed = this.value();
    this.decimalValueChange.emit(committed);

    const formatted = this.#formatForTransform(committed);
    if (formatted !== raw) {
      this.#rawValue.set(formatted);
    }
    el.value = formatted;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.#isAllowedKey(event)) return;
    event.preventDefault();
  }

  onPaste(event: Event): void {
    event.preventDefault();
    // Access clipboardData dynamically for jsdom/test compatibility
    const clipboardData = (event as ClipboardEvent).clipboardData;
    const text = clipboardData?.getData('text') ?? '';
    const sanitized = this.#sanitizeInput(text);
    if (sanitized !== '') {
      this.#el.nativeElement.value = sanitized;
      const parsed = this.#parseLocaleString(sanitized);
      if (!this.#isSignAllowed(sanitized, parsed)) {
        this.#el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }

      this.#hasBoundValue = true;
      this.#rawValue.set(sanitized);
      this.#el.nativeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  #parseForTransform(raw: string): ParseResult<number | null> {
    if (!raw.trim()) {
      return { value: null };
    }
    const parsed = this.#parseLocaleString(raw);
    if (!this.#isSignAllowed(raw, parsed)) {
      return { error: { kind: 'parse', message: 'Sign not allowed' } };
    }
    if (parsed === null && raw.trim() !== '-') {
      return { error: { kind: 'parse', message: 'Invalid decimal number' } };
    }
    return { value: parsed };
  }

  #formatForTransform(val: number | null): string {
    if (val === null || Number.isNaN(val)) {
      return '';
    }
    if (this.#isFocused()) {
      return this.#toEditString(val);
    }
    return formatPreciseNumber(val, this.#localeSignal(), this.minDecimals());
  }

  /**
   * Converts a JS number to an editable string using the locale decimal separator
   * without thousands separators or scientific notation, for comfortable editing.
   */
  #toEditString(value: number): string {
    if (Object.is(value, -0)) {
      return '0';
    }
    const [coefficient, exponent = '0'] = String(value).split('e');
    const fractionDigits = coefficient.split('.')[1]?.length ?? 0;
    const maximumFractionDigits = Math.max(fractionDigits - Number(exponent), 0);

    return new Intl.NumberFormat(
      this.#localeSignal(),
      maximumFractionDigits <= 100
        ? { useGrouping: false, maximumFractionDigits }
        : { useGrouping: false, maximumSignificantDigits: 21 },
    ).format(value);
  }

  /**
   * Parses a locale-formatted string to a JS number.
   * Handles `1.234,56` (ES) and `1,234.56` (EN).
   */
  #parseLocaleString(raw: string): number | null {
    if (!raw.trim()) return null;
    const sep = this.#decimalSeparator();
    let normalized: string;
    if (sep === ',') {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  #isSignAllowed(raw: string, value: number | null): boolean {
    const sign = this.numericSign();
    if (sign === 'any' || value === null) {
      return sign !== 'non-negative' || !raw.trim().startsWith('-');
    }
    return sign === 'non-negative' ? value >= 0 : value <= 0;
  }

  /**
   * Decides whether a keydown event should be allowed.
   *
   * Rules:
   * - Navigation keys, Ctrl/Meta combos → always allowed.
   * - Digits (0-9) → always allowed.
   * - Locale decimal separator → allowed only once.
   * - `-` → allowed only at position 0 and only once.
   * - Everything else → blocked.
   */
  #isAllowedKey(event: KeyboardEvent): boolean {
    const sep = this.#decimalSeparator();

    const navigationKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (navigationKeys.includes(event.key)) return true;
    if (event.ctrlKey || event.metaKey) return true;

    if (/^\d$/.test(event.key)) {
      return true;
    }

    if (event.key === sep) {
      return !this.#el.nativeElement.value.includes(sep);
    }

    if (event.key === '-') {
      const el = this.#el.nativeElement;
      return el.selectionStart === 0 && !el.value.includes('-');
    }

    return false;
  }

  /**
   * Sanitizes pasted text:
   * - Strips disallowed characters.
   * - Allows only one decimal separator.
   * - Ensures `-` only appears at position 0.
   */
  #sanitizeInput(text: string): string {
    const sep = this.#decimalSeparator();

    // Strip chars not valid for this locale
    const allowedPattern = sep === ',' ? /[^0-9,-]/g : /[^0-9.-]/g;
    let result = text.replace(allowedPattern, '');

    // Keep only first decimal separator
    const parts = result.split(sep);
    if (parts.length > 2) {
      result = parts[0] + sep + parts.slice(1).join('');
    }

    // Minus sign only at position 0
    result = result.replace(/(?!^)-/g, '');

    return result;
  }
}
