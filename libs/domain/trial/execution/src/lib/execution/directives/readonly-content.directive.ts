import { Directive, computed, inject, input } from '@angular/core';

import { ExecutionStore } from '../../+state/execution.store';

/**
 * 🔒 ReadonlyContentDirective
 *
 * Marca un área de contenido como no editable cuando la prueba o el disparo
 * se encuentra en un estado de solo lectura (Ejecutada, Finalizando, Cerrada o Cancelada).
 *
 * ## Uso
 * Aplica el atributo `intaReadonlyContent` al div contenedor de los campos de
 * datos (NO al header con los selectores de serie/disparo, que deben permanecer
 * activos para consulta).
 *
 * Permite override reactivo explícito mediante `[intaReadonlyContent]="shotLock.readOnly()"`.
 *
 * ```html
 * <!-- Header con serie/disparo: permanece interactivo -->
 * <div class="flex shrink-0">...</div>
 *
 * <!-- Área de datos: se bloquea en modo lectura -->
 * <div class="flex-1 ..." [intaReadonlyContent]="shotLock.readOnly()">
 *   <mat-form-field>...</mat-form-field>
 * </div>
 * ```
 */
@Directive({
  selector: '[intaReadonlyContent]',
  host: {
    '[attr.inert]': 'isReadOnly() ? "" : null',
    '[class.inta-readonly-content]': 'isReadOnly()',
  },
})
export class ReadonlyContentDirective {
  /**
   * Permite override explícito (p.ej. [intaReadonlyContent]="shotLock.readOnly()").
   * Si no se provee (o es string vacío como atributo puro `intaReadonlyContent`),
   * consulta `store.isTrialReadOnly()`.
   */
  readonly readonlyInput = input<boolean | string | undefined>(undefined, { alias: 'intaReadonlyContent' });

  /**
   * Store opcional: null cuando la directiva vive en un MatDialog abierto
   * sin un injector que provea ExecutionStore (p.ej. diálogos de configuración
   * masiva). En ese caso `isReadOnly` devuelve `false` de forma segura.
   */
  readonly #store = inject(ExecutionStore, { skipSelf: true, optional: true });

  /** `true` si el input explícito es true, o si falta el input y la prueba es de solo lectura. */
  protected readonly isReadOnly = computed(() => {
    const inputVal = this.readonlyInput();
    if (typeof inputVal === 'boolean') {
      return inputVal;
    }
    if (inputVal === 'true') {
      return true;
    }
    if (inputVal === 'false') {
      return false;
    }
    return this.#store?.isTrialReadOnly() ?? false;
  });
}
