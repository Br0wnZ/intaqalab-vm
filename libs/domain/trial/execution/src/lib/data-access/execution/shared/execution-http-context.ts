import { HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST_STATUSES } from '@intaqalab/config';

/**
 * Opciones HTTP que omiten el toast global para errores 409 Conflict,
 * permitiendo que el guardado de ejecución muestre un warning contextual.
 */
export function skipConflictErrorToastOptions(): { context: HttpContext } {
  return {
    context: new HttpContext().set(SKIP_ERROR_TOAST_STATUSES, [409]),
  };
}
