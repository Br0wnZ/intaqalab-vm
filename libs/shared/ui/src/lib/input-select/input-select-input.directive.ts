import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Directiva marcadora para proyectar un `<input>` nativo dentro de `ui-input-select`.
 *
 * Al aplicar esta directiva al `<input>` proyectado, el componente padre puede
 * decorarlo con cualquier directiva de validación existente (`libNoNegativeValues`,
 * `libNoLeadingZeros`, `libLocalDecimal`, etc.) y el componente `InputSelect`
 * tomará ese elemento como su campo de entrada, conectando focus/blur/input.
 *
 * @example
 * ```html
 * <ui-input-select label="Distance" [opciones]="opts" [(value)]="val" [showLabel]="false">
 *   <input inputSelectInput libNoNegativeValues libNoLeadingZeros />
 * </ui-input-select>
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[inputSelectInput]',
})
export class InputSelectInput {
  /** Referencia al elemento `<input>` nativo decorado. */
  readonly el = inject(ElementRef<HTMLInputElement>);
}
