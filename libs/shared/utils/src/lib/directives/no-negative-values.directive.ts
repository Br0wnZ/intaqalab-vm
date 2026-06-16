import type { OnInit } from '@angular/core';
import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Prevents negative values in number inputs.
 * Apply to `<input type="number">` fields where negative values are invalid.
 *
 * @example
 * <input matInput type="number" libNoNegativeValues [(ngModel)]="value" />
 */
@Directive({
  selector: 'input[libNoNegativeValues]',
})
export class NoNegativeValuesDirective implements OnInit {
  readonly #el = inject(ElementRef<HTMLInputElement>);

  public ngOnInit(): void {
    const input = this.#el.nativeElement;
    if (input.type === 'number') {
      const currentMin = input.getAttribute('min');
      if (!currentMin || parseFloat(currentMin) < 0) {
        input.min = '0';
      }
    }
  }

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
