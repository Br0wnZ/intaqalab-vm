import { Directive, HostListener } from '@angular/core';

/**
 * Prevents negative values in number inputs.
 * Apply to `<input type="number">` fields where negative values are invalid.
 *
 * @example
 * <input matInput type="number" libNoNegativeValues [(ngModel)]="value" />
 */
@Directive({
  selector: 'input[libNoNegativeValues]',
  standalone: true,
})
export class NoNegativeValuesDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '+') {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;
    if (!raw) return;

    if (raw.includes('-') || raw.includes('+')) {
      const sanitized = raw.replace(/[-+]/g, '');
      if (sanitized !== raw) {
        input.value = sanitized;
        input.dispatchEvent(new Event('input'));
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;
    const pastedText = clipboardData.getData('text');
    if (pastedText.includes('-') || pastedText.includes('+')) {
      event.preventDefault();
      const sanitized = pastedText.replace(/[-+]/g, '');
      const input = event.target as HTMLInputElement;
      input.value = sanitized;
      input.dispatchEvent(new Event('input'));
    }
  }
}
