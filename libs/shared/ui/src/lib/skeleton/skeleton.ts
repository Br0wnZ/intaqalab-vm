import { Component, ViewEncapsulation, computed, input } from '@angular/core';
import { cn } from '@intaqalab/utils';
import { TranslatePipe } from '@ngx-translate/core';

/** Forma del esqueleto */
export type SkeletonVariant = 'rectangle' | 'circle' | 'text' | 'button';

/** Tipo de animación */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

/**
 * Componente Skeleton para mostrar placeholders de carga.
 *
 * Uso básico:
 * ```html
 * @if (resource.isLoading()) {
 *   <ui-skeleton variant="text" width="60%" />
 *   <ui-skeleton variant="rectangle" height="120px" />
 * }
 * ```
 *
 * Variantes:
 * - `rectangle` (default): bloque rectangular con bordes redondeados
 * - `circle`: forma circular (ideal para avatares/iconos)
 * - `text`: línea de texto (altura fija de 1em, bordes más suaves)
 * - `button`: forma de botón con altura fija
 *
 * Animaciones:
 * - `pulse` (default): opacidad pulsante
 * - `wave`: efecto shimmer de izquierda a derecha
 * - `none`: sin animación (útil en tests o accesibilidad)
 */
@Component({
  selector: 'ui-skeleton',
  imports: [TranslatePipe],
  template: `
    <span class="sr-only" [attr.aria-label]="'UI.SKELETON.LOADING' | translate"></span>
    <ng-content />
  `,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'elementClass()',
    '[style.background-color]': '"var(--inta-neutral-200, #e5e7eb)"',
    '[style.width]': 'width()',
    '[style.height]': 'elementHeight()',
    role: 'status',
    'aria-busy': 'true',
  },
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('rectangle');
  readonly animation = input<SkeletonAnimation>('pulse');
  readonly width = input<string | undefined>(undefined);
  readonly height = input<string | undefined>(undefined);
  readonly class = input<string>('');

  readonly #variantClasses = computed<string>(() => {
    const v = this.variant();
    if (v === 'circle') return 'rounded-full aspect-square';
    if (v === 'text') return 'rounded h-[1em] w-full my-0.5';
    if (v === 'button') return 'rounded-client-md h-9';
    return 'rounded-client-md'; // rectangle default
  });

  readonly #animationClasses = computed<string>(() => {
    const a = this.animation();
    if (a === 'wave') return 'inta-skeleton-wave overflow-hidden';
    if (a === 'none') return '';
    return 'animate-pulse'; // pulse default
  });

  readonly elementClass = computed<string>(() =>
    cn('block relative', this.#variantClasses(), this.#animationClasses(), this.class()),
  );

  readonly elementHeight = computed<string | undefined>(() => {
    // Para 'circle', si no hay height, se hereda del width mediante aspect-square
    if (this.variant() === 'circle' && !this.height()) return this.width();
    return this.height();
  });
}
