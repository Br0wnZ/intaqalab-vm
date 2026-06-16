import { Directive, HostListener } from '@angular/core';

/**
 * Prevents leading zeros in integer number inputs (e.g. "01" → "1").
 * Apply to `<input type="number">` fields where leading zeros are semantically invalid.
 * Do NOT apply to fields like `clientNumber` where leading zeros are allowed.
 *
 * @example
 * <input matInput type="number" libNoLeadingZeros [(ngModel)]="value" />
 */
@Directive({
  selector: 'input[libNoLeadingZeros]',
})
export class NoLeadingZerosDirective {
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    if (!raw) return;
    const sanitized = raw.replace(/^(-?)0+(\d)/, '$1$2');
    if (sanitized !== raw) {
      input.value = sanitized;
    }
  }
}
