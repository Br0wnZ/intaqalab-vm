import type { OnInit } from '@angular/core';
import { Directive, ElementRef, HostListener, computed, effect, forwardRef, inject, input } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { LOCALE_SIGNAL } from '../tokens/locale-signal.token';

/**
 * Locale-aware decimal input directive.
 *
 * Transforms an `<input>` into a locale-aware decimal field:
 * - Sets `type="text"` + `inputMode="decimal"` (numeric keyboard on mobile).
 * - Allows only digits, the locale-specific decimal separator, `-` (negatives), and navigation keys.
 * - Enforces max decimal places on keydown AND paste — extra digits beyond `[decimals]` are blocked.
 * - On focus: converts the stored JS number to an editable locale string (no thousands separator).
 * - On blur: parses the locale string back to a JS `number` and notifies the form.
 * - Implements `ControlValueAccessor` → compatible with `[formField]`, `ngModel`, `formControl`.
 * - Reactive to language changes via `LOCALE_SIGNAL` token (no direct `data-access` dependency).
 *
 * @example
 * <input matInput libLocalDecimal [formField]="form.velocity" />
 * <input matInput libLocalDecimal [decimals]="4" [formField]="form.pressure" />
 */
@Directive({
  selector: 'input[libLocalDecimal]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocaleDecimalInputDirective),
      multi: true,
    },
  ],
})
export class LocaleDecimalInputDirective implements ControlValueAccessor, OnInit {
  /** Maximum fraction digits — default 2, user cannot type more. */
  readonly decimals = input<number>(2);
  /** Minimum fraction digits displayed — default 0. */
  readonly minDecimals = input<number>(0);

  readonly #el = inject(ElementRef<HTMLInputElement>);
  readonly #localeSignal = inject(LOCALE_SIGNAL);

  /** The decimal separator character for the active locale. */
  readonly #decimalSeparator = computed(() => (this.#localeSignal() === 'es-ES' ? ',' : '.'));

  /** Stored JS number (source of truth). */
  #internalValue: number | null = null;
  /** Whether user is currently editing the field. */
  #isFocused = false;

  // CVA callbacks
  #onChange: (value: number | null) => void = () => {
    /* empty */
  };
  #onTouched: () => void = () => {
    /* empty */
  };

  constructor() {
    // Effect runs in injection context → auto-cleaned when directive is destroyed.
    effect(() => {
      // Register reactive dependency on locale signal.
      this.#localeSignal();
      if (!this.#isFocused) {
        this.#renderDisplayValue();
      }
    });
  }

  ngOnInit(): void {
    const el = this.#el.nativeElement;
    el.type = 'text';
    el.autocomplete = 'off';
    el.inputMode = 'decimal';
    this.#renderDisplayValue();
  }

  // ── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: number | null | undefined): void {
    this.#internalValue = value ?? null;
    if (!this.#isFocused) {
      this.#renderDisplayValue();
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.#el.nativeElement.disabled = isDisabled;
  }

  // ── Host Listeners ──────────────────────────────────────────────────────────

  @HostListener('focus')
  onFocus(): void {
    this.#isFocused = true;
    if (this.#internalValue !== null && !isNaN(this.#internalValue)) {
      this.#el.nativeElement.value = this.#toEditString(this.#internalValue);
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.#isFocused = false;
    this.#onTouched();
    const parsed = this.#parseLocaleString(this.#el.nativeElement.value);
    this.#internalValue = parsed;
    this.#onChange(parsed);
    this.#renderDisplayValue();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.#isAllowedKey(event)) return;
    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: Event): void {
    event.preventDefault();
    // Access clipboardData dynamically for jsdom/test compatibility
    const clipboardData = (event as ClipboardEvent).clipboardData;
    const text = clipboardData?.getData('text') ?? '';
    const sanitized = this.#sanitizeInput(text);
    if (sanitized !== '') {
      this.#el.nativeElement.value = sanitized;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Renders the formatted display value with thousands + decimal separators.
   * Used when the field is NOT focused.
   */
  #renderDisplayValue(): void {
    const el = this.#el.nativeElement;
    if (this.#internalValue === null || isNaN(this.#internalValue)) {
      el.value = '';
      return;
    }
    el.value = new Intl.NumberFormat(this.#localeSignal(), {
      minimumFractionDigits: this.minDecimals(),
      maximumFractionDigits: this.decimals(),
    }).format(this.#internalValue);
  }

  /**
   * Converts a JS number to an editable string using the locale decimal separator
   * but WITHOUT thousands separators, for comfortable editing.
   */
  #toEditString(value: number): string {
    const sep = this.#decimalSeparator();
    const str = value.toString(); // always uses '.' as decimal
    return sep === ',' ? str.replace('.', ',') : str;
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
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Decides whether a keydown event should be allowed.
   *
   * Rules:
   * - Navigation keys, Ctrl/Meta combos → always allowed.
   * - Digits (0-9) → allowed unless adding the digit would exceed `decimals()` max.
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
      return !this.#wouldExceedMaxDecimals(event.key, sep);
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
   * Checks whether inserting `digit` at the current cursor position would push
   * the fractional part beyond `decimals()` max digits.
   */
  #wouldExceedMaxDecimals(digit: string, sep: string): boolean {
    const el = this.#el.nativeElement;
    const value = el.value;
    const sepIndex = value.indexOf(sep);
    if (sepIndex === -1) return false; // no decimal part yet → safe

    const cursorPos = el.selectionStart ?? value.length;
    const selectionEnd = el.selectionEnd ?? cursorPos;

    // Only counts if the cursor is AFTER the separator
    if (cursorPos <= sepIndex) return false;

    // Simulate insertion
    const newValue = value.slice(0, cursorPos) + digit + value.slice(selectionEnd);
    const newSepIndex = newValue.indexOf(sep);
    if (newSepIndex === -1) return false;

    const fractionalDigits = newValue.length - newSepIndex - 1;
    return fractionalDigits > this.decimals();
  }

  /**
   * Sanitizes pasted text:
   * - Strips disallowed characters.
   * - Allows only one decimal separator.
   * - Truncates fractional part to `decimals()` max.
   * - Ensures `-` only appears at position 0.
   */
  #sanitizeInput(text: string): string {
    const sep = this.#decimalSeparator();
    const maxDec = this.decimals();

    // Strip chars not valid for this locale
    const allowedPattern = sep === ',' ? /[^0-9,-]/g : /[^0-9.-]/g;
    let result = text.replace(allowedPattern, '');

    // Keep only first decimal separator
    const parts = result.split(sep);
    if (parts.length > 2) {
      result = parts[0] + sep + parts.slice(1).join('');
    }

    // Truncate fractional part to max decimals
    const finalParts = result.split(sep);
    if (finalParts.length === 2 && finalParts[1].length > maxDec) {
      result = finalParts[0] + sep + finalParts[1].slice(0, maxDec);
    }

    // Minus sign only at position 0
    result = result.replace(/(?!^)-/g, '');

    return result;
  }
}
