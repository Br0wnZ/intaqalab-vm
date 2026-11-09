import type { Injector, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom, take } from 'rxjs';

/**
 * Espera a que un `httpResource` complete su carga actual.
 * Detecta la transición de carga y lanza si hay error.
 *
 * La semántica es deliberadamente idéntica al helper privado previo de
 * `ExecutionService`: el primer filtro evita resolver antes de que el recurso
 * arranque cuando la señal aún no ha emitido.
 */
export async function awaitResource(
  resource: { isLoading: Signal<boolean>; error: Signal<unknown> },
  injector: Injector,
): Promise<void> {
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
}

/**
 * Espera a que un `httpResource` complete y devuelve su valor de forma segura.
 * Lanza si el recurso reporta error o si el valor resultante es `undefined`.
 */
export async function awaitResourceValue<T>(
  resource: {
    isLoading: Signal<boolean>;
    error: Signal<unknown>;
    value: Signal<T | undefined>;
  },
  injector: Injector,
): Promise<T> {
  await awaitResource(resource, injector);
  const value = resource.value();
  if (value === undefined) {
    throw new Error('Resource response is undefined');
  }
  return value;
}
