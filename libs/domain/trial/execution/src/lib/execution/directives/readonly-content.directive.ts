import { Directive, inject } from '@angular/core';
import { computed } from '@angular/core';

import { ExecutionStore } from '../../+state/execution.store';

/**
 * 🔒 ReadonlyContentDirective
 *
 * Marca un área de contenido como no editable cuando la prueba se encuentra en
 * un estado de solo lectura (Ejecutada, Finalizando, Cerrada o Cancelada).
 *
 * ## Uso
 * Aplica el atributo `intaReadonlyContent` al div contenedor de los campos de
 * datos (NO al header con los selectores de serie/disparo, que deben permanecer
 * activos para consulta).
 *
 * ```html
 * <!-- Header con serie/disparo: permanece interactivo -->
 * <div class="flex shrink-0">...</div>
 *
 * <!-- Área de datos: se bloquea en modo lectura -->
 * <div class="flex-1 ..." intaReadonlyContent>
 *   <mat-form-field>...</mat-form-field>
 * </div>
 * ```
 *
 * ## Mecanismo
 * - Aplica el atributo HTML estándar `inert` cuando la prueba es de solo lectura.
 *   El atributo `inert` deshabilita toda interacción (ratón, teclado, foco) en
 *   los elementos descendientes, siendo la solución más robusta y accesible.
 * - Añade la clase CSS `inta-readonly-content` para indicación visual (opacity,
 *   cursor) definida en el stylesheet global.
 *
 * ## Principios SOLID
 * - **SRP**: Solo gestiona el modo de solo lectura del área de contenido.
 * - **OCP**: Los nuevos widgets se integran añadiendo un único atributo.
 * - **DIP**: Lee el estado de `ExecutionStore`, no de la implementación concreta
 *   de cada widget.
 */
@Directive({
  selector: '[intaReadonlyContent]',
  standalone: true,
  host: {
    '[attr.inert]': 'isReadOnly() ? "" : null',
    '[class.inta-readonly-content]': 'isReadOnly()',
  },
})
export class ReadonlyContentDirective {
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  /** `true` cuando la prueba está en estado de solo lectura. */
  protected readonly isReadOnly = computed(() => this.#store.isTrialReadOnly());
}
