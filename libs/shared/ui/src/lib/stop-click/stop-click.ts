import { Directive, input } from '@angular/core';

/**
 * Directiva para detener la propagación del evento click (stopPropagation) y prevenir la acción por defecto (preventDefault).
 *
 * Especialmente útil para elementos interactivos anidados (botones, iconos, toggles) dentro de
 * contenedores clickables (`mat-option`, cabeceras de acordeón, filas de tablas, tarjetas) para
 * evitar que el evento burbujee al contenedor padre, manteniendo la lógica de componentes pura.
 *
 * @example
 * ```html
 * <!-- Detiene propagación y previene acción por defecto (valores por defecto: true) -->
 * <button mat-icon-button type="button" uiStopClick (click)="toggleFavorite(item.id)">
 *   <mat-icon>star</mat-icon>
 * </button>
 *
 * <!-- Solo detiene propagación sin preventDefault -->
 * <button uiStopClick [preventDefault]="false" (click)="onAction()">
 *   Acción
 * </button>
 * ```
 */
@Directive({
  selector: '[uiStopClick], [stopClick]',
  host: {
    '(click)': 'onClick($event)',
  },
})
export class StopClick {
  /** Indica si se debe detener la propagación del evento hacia los ancestros. Por defecto `true`. */
  readonly stopPropagation = input<boolean>(true);

  /** Indica si se debe prevenir la acción por defecto del evento. Por defecto `true`. */
  readonly preventDefault = input<boolean>(true);

  onClick(event: Event): void {
    if (this.stopPropagation()) {
      event.stopPropagation();
    }
    if (this.preventDefault()) {
      event.preventDefault();
    }
  }
}
