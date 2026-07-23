import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Skeleton, type SkeletonAnimation } from './skeleton';

/**
 * Componente compuesto que renderiza una tarjeta skeleton completa.
 *
 * Pensado para listas donde cada ítem sigue el patrón:
 * [avatar] [título + subtítulo] + [bloque de contenido]
 *
 * Uso:
 * ```html
 * @if (resource.isLoading()) {
 *   @for (i of [1, 2, 3]; track i) {
 *     <ui-skeleton-card />
 *   }
 * }
 * ```
 *
 * Se puede controlar la animación y si mostrar el avatar:
 * ```html
 * <ui-skeleton-card animation="wave" [showAvatar]="false" />
 * ```
 */
@Component({
  selector: 'ui-skeleton-card',
  imports: [Skeleton],
  template: `
    <div class="flex flex-col gap-3 p-4 rounded-client-md border border-client-neutral-200 bg-white shadow-client-sm w-full">
      <!-- Cabecera -->
      <div class="flex items-center gap-3">
        @if (showAvatar()) {
          <!-- Avatar circular -->
          <ui-skeleton variant="circle" width="40px" [animation]="animation()" />
        }
        <!-- Título y subtítulo -->
        <div class="flex flex-col gap-1.5 flex-1">
          <ui-skeleton variant="text" width="55%" [animation]="animation()" />
          <ui-skeleton variant="text" width="35%" [animation]="animation()" class="text-xs" />
        </div>
        <!-- Badge / estado -->
        <ui-skeleton variant="button" width="64px" [animation]="animation()" />
      </div>

      <!-- Separador -->
      <div class="h-px bg-client-neutral-200"></div>

      <!-- Cuerpo: bloque de contenido -->
      <div class="flex flex-col gap-2">
        <ui-skeleton variant="text" width="100%" [animation]="animation()" />
        <ui-skeleton variant="text" width="80%" [animation]="animation()" />
        <ui-skeleton variant="text" width="90%" [animation]="animation()" />
      </div>

      <!-- Footer: 2 botones de acción -->
      <div class="flex gap-2 justify-end">
        <ui-skeleton variant="button" width="80px" [animation]="animation()" />
        <ui-skeleton variant="button" width="100px" [animation]="animation()" />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCard {
  /** Tipo de animación aplicada a todos los skeletons hijos */
  readonly animation = input<SkeletonAnimation>('pulse');
  /** Muestra o no el avatar circular en la cabecera */
  readonly showAvatar = input<boolean>(true);
}
