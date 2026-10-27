import type { AfterViewInit } from '@angular/core';
import { DestroyRef, Directive, ElementRef, contentChild, inject, input } from '@angular/core';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import type { TooltipPosition } from '@angular/material/tooltip';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Directiva `uiValueTooltip` para controles Material y elementos de texto.
 *
 * Muestra el valor completo del control mediante MatTooltip, sin modificar
 * su etiqueta ni su valor. En campos Material, se aplica al `mat-form-field`
 * para anclar el tooltip al contorno; lee el MatInput o MatSelect proyectado.
 * Aplicada directamente a un `mat-select`, utiliza su texto seleccionado.
 * En otros elementos, recibe el contenido mediante `uiValueTooltipValue`.
 *
 * Parámetros:
 * - `uiValueTooltip`: atributo de activacion, sin texto ni etiqueta.
 * - `uiValueTooltipValue`: texto opcional que tiene prioridad sobre el valor
 *   del control. Permite usar la directiva en elementos como `div` o `span`.
 * - `uiValueTooltipPosition`: `auto` por defecto. También admite las posiciones
 *   de Material: `above`, `below`, `left`, `right`, `before` y `after`.
 *   `before` y `after` respetan la dirección de lectura.
 * - `uiValueTooltipAnchor`: `host` por defecto, sin cambios de layout.
 *   Con `text`, ajusta el propio elemento al texto y lo trunca al ancho
 *   disponible. Este modo modifica su layout; usa margen, no padding,
 *   si necesitas separar el texto de otros elementos.
 *
 * Posicionamiento e interacción:
 * - En `auto`, compara el espacio hasta los cuatro bordes del viewport al
 *   entrar el ratón. No mide geometría en cada render.
 * - Una posición explícita indica preferencia, no una ubicación absoluta:
 *   Material mantiene sus posiciones alternativas si no cabe en pantalla.
 * - Captura el mensaje tras el primer render si el valor no esta vacio.
 *   Con `uiValueTooltipValue` explicito, refresca el mensaje en hover con el valor actual.
 *   En controles sin valor explicito, conserva el texto capturado.
 * - En hover, calcula la posición y muestra MatTooltip. Al salir lo oculta.
 *   Un valor inicial vacío no muestra tooltip.
 *
 * Usa la clase `ui-value-tooltip` para los estilos y la flecha específicos,
 * sin cambiar el tema global de los demás tooltips.
 *
 * @example
 * <mat-form-field uiValueTooltip uiValueTooltipPosition="above">
 *   <input matInput readonly [value]="specimenSummary()" />
 * </mat-form-field>
 *
 * Omitir `uiValueTooltipPosition` conserva la elección automática del lado.
 *
 * @example
 * <div uiValueTooltip [uiValueTooltipValue]="item.observations"
 *      uiValueTooltipPosition="above" uiValueTooltipAnchor="text">
 *   {{ item.observations }}
 * </div>
 */
@Directive({
  selector: '[uiValueTooltip]',
  hostDirectives: [MatTooltip],
  host: {
    '[class]': 'uiValueTooltipAnchor() === "text" ? "block w-fit max-w-full min-w-0 truncate" : ""',
    '(mouseenter)': 'showTooltip()',
    '(mouseleave)': 'hideTooltip()',
  },
})
export class ValueTooltip implements AfterViewInit {
  readonly uiValueTooltipValue = input<string | number | null>();
  readonly uiValueTooltipPosition = input<TooltipPosition | 'auto'>('auto');
  readonly uiValueTooltipAnchor = input<'host' | 'text'>('host');

  readonly #select = inject(MatSelect, { optional: true, self: true });
  protected readonly childSelect = contentChild(MatSelect);
  protected readonly childInput = contentChild(MatInput);
  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #tooltip = inject(MatTooltip, { self: true });
  readonly #destroyRef = inject(DestroyRef);

  constructor() {
    this.#tooltip.tooltipClass = 'ui-value-tooltip';
    this.#tooltip.position = 'above';
    this.#tooltip.touchGestures = 'off';
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      if (!this.#destroyRef.destroyed) this.#initializeMessage();
    });
  }

  protected showTooltip(): void {
    const explicitValue = this.uiValueTooltipValue();
    if (explicitValue !== undefined) {
      this.#tooltip.message = (explicitValue !== null ? String(explicitValue) : '').trim();
    } else if (!this.#tooltip.message) {
      this.#initializeMessage();
    }
    this.#prepareTooltip();
    this.#tooltip.show();
  }

  protected hideTooltip(): void {
    this.#tooltip.hide();
  }

  #prepareTooltip() {
    if (!this.#tooltip.message) return;

    const preferredPosition = this.uiValueTooltipPosition();
    if (preferredPosition !== 'auto') {
      this.#tooltip.position = preferredPosition;
      return;
    }

    const element = this.#element.nativeElement;
    const viewport = element.ownerDocument.defaultView;

    if (!viewport) return;

    const rect = element.getBoundingClientRect();
    const spaces = [
      ['above', rect.top],
      ['below', viewport.innerHeight - rect.bottom],
      ['left', rect.left],
      ['right', viewport.innerWidth - rect.right],
    ] as const;
    const [position] = spaces.reduce((largest, candidate) => (candidate[1] > largest[1] ? candidate : largest));
    this.#tooltip.position = position;
  }

  #initializeMessage(): void {
    const explicitValue = this.uiValueTooltipValue();
    const value = (
      explicitValue !== undefined ? (explicitValue !== null ? String(explicitValue) : '') : this.#controlValue()
    ).trim();
    this.#tooltip.message = value;
  }

  #controlValue() {
    const select = this.#select ?? this.childSelect();
    if (select) return select.triggerValue;

    const input = this.childInput();
    if (input) return input.value;

    const element = this.#element.nativeElement;
    return element instanceof HTMLInputElement ? element.value : '';
  }
}
