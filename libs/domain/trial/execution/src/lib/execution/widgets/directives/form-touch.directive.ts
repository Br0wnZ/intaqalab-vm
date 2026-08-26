import { computed, DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Rastrea si el usuario ha interactuado (focus + blur) con algún campo
 * dentro del elemento anfitrión.
 *
 * A diferencia de las flags internas de Signal Form (`form().touched()`),
 * esta señal NO se marca cuando el formulario se rellena programáticamente
 * (patch tras un GET): solo responde a interacción real del usuario.
 *
 * Uso:
 * ```html
 * <div intaFormTouch #touch="intaFormTouch">
 *   ...campos...
 * </div>
 * ```
 * ```ts
 * readonly touched = viewChild.required('touch', { read: FormTouchDirective });
 * // formState: touched: this.touched().touched()
 * ```
 */
@Directive({
  selector: '[intaFormTouch]',
  exportAs: 'intaFormTouch',
})
export class FormTouchDirective {
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  /** Deshabilita el tracking (ej. en modo readonly). */
  readonly disabled = input(false, { alias: 'intaFormTouchDisabled' });

  readonly #touched = signal(false);

  /** True cuando el usuario ha salido con focus de algún campo interactivo. */
  readonly touched = computed(() => !this.disabled() && this.#touched());

  constructor() {
    const host = this.#elementRef.nativeElement;
    const handler = (event: FocusEvent) => {
      if (this.disabled()) return;
      const target = event.target as HTMLElement | null;
      if (!target?.matches('input, textarea, select')) return;
      // Solo marcar si el nuevo foco sale del contenedor o va a otro campo
      // (cualquier focusout desde un campo cuenta como interacción).
      this.#touched.set(true);
    };

    host.addEventListener('focusout', handler, true);
    this.#destroyRef.onDestroy(() => host.removeEventListener('focusout', handler, true));
  }

  reset(): void {
    this.#touched.set(false);
  }
}
