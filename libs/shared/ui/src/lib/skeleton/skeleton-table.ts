import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

import { RangePipe } from '@intaqalab/utils';

import { Skeleton, type SkeletonAnimation } from './skeleton';

/** Anchos variados para simular columnas de tabla realistas */
const HEADER_WIDTHS = ['45%', '60%', '50%', '70%', '55%', '40%', '65%', '50%'];
const CELL_WIDTHS = ['80%', '65%', '90%', '70%', '85%', '75%', '60%', '95%'];

/**
 * Componente compuesto que renderiza una tabla skeleton completa.
 *
 * Pensado para estados de carga de listados tabulares (el patrón más frecuente).
 *
 * Uso mínimo:
 * ```html
 * <ui-skeleton-table />
 * ```
 *
 * Uso configurado:
 * ```html
 * <ui-skeleton-table [columns]="6" [rows]="8" animation="wave" />
 * ```
 *
 * Sin header:
 * ```html
 * <ui-skeleton-table [showHeader]="false" [rows]="3" />
 * ```
 */
@Component({
  selector: 'ui-skeleton-table',
  imports: [Skeleton, RangePipe],
  template: `
    <div
      class="w-full rounded-client-md bg-white shadow-client-sm overflow-hidden"
      role="status"
      aria-busy="true"
    >
      @if (showHeader()) {
        <!-- Cabecera de tabla -->
        <div class="flex gap-4 px-4 py-3 bg-client-neutral-50">
          @for (col of (columns() | range); track col) {
            <div class="flex-1">
              <ui-skeleton
                variant="text"
                [width]="headerWidth(col)"
                [animation]="animation()"
                class="text-sm"
              />
            </div>
          }
        </div>
      }

      <!-- Filas de tabla -->
      @for (row of (rows() | range); track row) {
        <div
          class="flex gap-4 px-4 py-3"
        >
          @for (col of (columns() | range); track col) {
            <div class="flex-1">
              <ui-skeleton
                variant="text"
                [width]="cellWidth(row, col)"
                [animation]="animation()"
                class="text-sm"
              />
            </div>
          }
        </div>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonTable {
  /** Número de columnas */
  readonly columns = input<number>(4);
  /** Número de filas del body */
  readonly rows = input<number>(5);
  /** Tipo de animación */
  readonly animation = input<SkeletonAnimation>('wave');
  /** Mostrar fila de cabecera */
  readonly showHeader = input<boolean>(true);

  /** Ancho variado para headers (evita look artificial) */
  headerWidth(col: number): string {
    return HEADER_WIDTHS[(col - 1) % HEADER_WIDTHS.length];
  }

  /** Ancho variado para celdas (combina row+col para más variación) */
  cellWidth(row: number, col: number): string {
    return CELL_WIDTHS[(row + col) % CELL_WIDTHS.length];
  }
}
