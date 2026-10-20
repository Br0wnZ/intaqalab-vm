import type { Injector, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, take } from 'rxjs';

/**
 * Espera a que un `httpResource` complete y devuelve su valor de forma segura.
 * Lanza si el recurso reporta error o si el valor resultante es `undefined`.
 *
 * Patrón compartido por los servicios query del dominio (_equivalente al helper
 * privado de `ExecutionService`, portado a la capa de acceso a datos para no
 * duplicarlo por servicio).
 */
export async function awaitResourceValue<T>(
  resource: {
    isLoading: Signal<boolean>;
    error: Signal<unknown>;
    value: Signal<T | undefined>;
  },
  injector: Injector,
): Promise<T> {
  await firstValueFrom(
    toObservable(resource.isLoading, { injector }).pipe(
      filter((_, index) => index > 0 || resource.isLoading()),
      filter((loading) => !loading),
      take(1),
    ),
  );
  if (resource.error()) {
    throw resource.error();
  }
  const value = resource.value();
  if (value === undefined) {
    throw new Error('Resource response is undefined');
  }
  return value;
}
