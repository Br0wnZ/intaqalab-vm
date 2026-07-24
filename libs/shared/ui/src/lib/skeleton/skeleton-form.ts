import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { RangePipe } from '@intaqalab/utils';

import { Skeleton, type SkeletonAnimation } from './skeleton';

/** Anchos de label variados para dar realismo */
const LABEL_WIDTHS = ['30%', '45%', '35%', '50%', '40%', '55%', '38%', '42%'];

/**
 * Componente compuesto que renderiza un formulario skeleton completo.
 *
 * Pensado para estados de carga de vistas con formularios.
 *
 * Uso mínimo:
 * ```html
 * <ui-skeleton-form />
 * ```
 *
 * Uso configurado:
 * ```html
 * <ui-skeleton-form [fields]="6" [columns]="3" animation="wave" />
 * ```
 *
 * Sin botones de acción:
 * ```html
 * <ui-skeleton-form [fields]="4" [showActions]="false" />
 * ```
 */
@Component({
  selector: 'ui-skeleton-form',
  imports: [Skeleton, RangePipe],
  template: `
    <div
      class="w-full rounded-client-md bg-white shadow-client-sm p-6"
      role="status"
      aria-busy="true"
    >
      <!-- Campos del formulario -->
      <div
        class="grid gap-x-6 gap-y-5"
        [style.grid-template-columns]="'repeat(' + columns() + ', minmax(0, 1fr))'"
      >
        @for (field of (fields() | range); track field) {
          <div class="flex flex-col gap-1.5">
            <!-- Label skeleton -->
            <ui-skeleton
              variant="text"
              [width]="labelWidth(field)"
              [animation]="animation()"
              class="text-xs"
            />
            <!-- Input skeleton -->
            <ui-skeleton
              variant="rectangle"
              width="100%"
              height="40px"
              [animation]="animation()"
            />
          </div>
        }
      </div>

      @if (showActions()) {
        <!-- Separador -->
        <div class="h-px bg-client-neutral-200 mt-6 mb-4"></div>

        <!-- Botones de acción -->
        <div class="flex gap-3 justify-end">
          <ui-skeleton variant="button" width="90px" [animation]="animation()" />
          <ui-skeleton variant="button" width="110px" [animation]="animation()" />
        </div>
      }
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonForm {
  /** Número de campos del formulario */
  readonly fields = input<number>(4);
  /** Columnas del grid (1, 2 o 3) */
  readonly columns = input<number>(2);
  /** Tipo de animación */
  readonly animation = input<SkeletonAnimation>('pulse');
  /** Mostrar botones skeleton al final */
  readonly showActions = input<boolean>(true);

  /** Ancho variado para labels */
  labelWidth(field: number): string {
    return LABEL_WIDTHS[(field - 1) % LABEL_WIDTHS.length];
  }
}
