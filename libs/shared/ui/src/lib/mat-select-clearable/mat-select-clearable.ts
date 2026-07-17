/* eslint-disable no-restricted-properties */
import type { AfterViewInit } from '@angular/core';
import { Directive, ElementRef, NgZone, Renderer2, inject } from '@angular/core';
import { MatSelect } from '@angular/material/select';

/**
 * Directiva `clearable` para `mat-select`.
 *
 * Añade un botón "×" dentro del trigger del select (a la izquierda del icono
 * de expansión) cuando hay un valor seleccionado. Al pulsarlo, limpia la
 * selección y notifica al control subyacente (incluye Signal Forms).
 *
 * Estrategia de detección de valor:
 * 1. Parchea `writeValue` del MatSelect para capturar valores escritos por
 *    cualquier ControlValueAccessor (ngModel, Signal Forms, FormControl...).
 * 2. Suscribe a `valueChange` y `stateChanges` para selecciones manuales.
 * 3. Ejecuta una comprobación inicial en ngAfterViewInit.
 *
 * Uso: `<mat-select clearable ...>`
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-select[clearable]',
  host: { class: 'mat-select-clearable' },
})
export class MatSelectClearable implements AfterViewInit {
  readonly #select = inject(MatSelect);
  readonly #el = inject(ElementRef);
  readonly #renderer = inject(Renderer2);
  readonly #zone = inject(NgZone);

  #btn: HTMLElement | null = null;

  constructor() {
    // Parchear writeValue para detectar cuando Signal Forms (o cualquier CVA)
    // escribe el valor programáticamente en el MatSelect.
    const originalWriteValue = this.#select.writeValue.bind(this.#select);
    this.#select.writeValue = (value: unknown) => {
      originalWriteValue(value);
      // Ejecutar fuera de la zona para no interferir con CD, y de forma asíncrona
      // para que el DOM interno del select ya esté actualizado.
      this.#zone.runOutsideAngular(() => {
        Promise.resolve().then(() => this.#syncButton());
      });
    };
  }

  ngAfterViewInit(): void {
    // Suscripciones a cambios de valor por selección manual del usuario
    this.#select.valueChange.subscribe(() => this.#syncButton());
    this.#select.stateChanges.subscribe(() => this.#syncButton());

    // Comprobación inicial (por si el valor ya estaba seteado antes del patch)
    this.#syncButton();
  }

  #syncButton(): void {
    const hasValue = this.#hasValue();
    const disabled = this.#select.disabled;

    if (hasValue && !disabled) {
      if (!this.#btn) this.#createButton();
    } else {
      this.#destroyButton();
    }
  }

  #hasValue(): boolean {
    // MatSelect.empty consulta el modelo de selección interno:
    // solo es false cuando hay una MatOption real seleccionada.
    return !this.#select.empty;
  }

  #createButton(): void {
    const el = this.#el.nativeElement as HTMLElement;

    const btn = this.#renderer.createElement('button') as HTMLElement;
    this.#renderer.setAttribute(btn, 'type', 'button');
    this.#renderer.setAttribute(btn, 'aria-label', 'Limpiar selección');
    this.#renderer.addClass(btn, 'mat-select-clear-btn');

    const icon = this.#renderer.createElement('mat-icon') as HTMLElement;
    icon.textContent = 'close';
    this.#renderer.addClass(icon, 'mat-icon');
    this.#renderer.addClass(icon, 'material-icons');
    this.#renderer.appendChild(btn, icon);

    this.#renderer.listen(btn, 'click', (e: Event) => {
      e.stopPropagation();
      // Limpiar valor en el control interno del select
      this.#select.value = null;
      if (this.#select._onChange) {
        this.#select._onChange(null);
      }
      this.#select.valueChange.emit(null);
      this.#destroyButton();
    });

    // Insertar ANTES del .mat-mdc-select-arrow-wrapper (dentro del trigger)
    // para que la X quede a la izquierda del icono de expandir.
    // NOTA: arrowWrapper está dentro de .mat-mdc-select-trigger (no es hijo directo de mat-select),
    // por eso usamos arrowWrapper.parentNode como parent del insertBefore.
    const arrowWrapper = el.querySelector('.mat-mdc-select-arrow-wrapper');
    if (arrowWrapper?.parentNode) {
      this.#renderer.insertBefore(arrowWrapper.parentNode, btn, arrowWrapper);
    } else {
      this.#renderer.appendChild(el, btn);
    }
    this.#btn = btn;
  }

  #destroyButton(): void {
    if (this.#btn) {
      this.#btn.remove();
      this.#btn = null;
    }
  }
}
