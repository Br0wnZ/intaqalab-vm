# ADR-020: Use HttpClient for Mutations in Trial Execution Domain

**Estado:** Aceptado
**Fecha:** 2026-11-03
**Autores:** INTAQALAB Architecture Team

## Contexto

En el dominio de ejecución de ensayos de tiro (`libs/domain/trial/execution`), el botón global "Guardar" de la cabecera (`Execution`) orquesta el guardado masivo de todos los widgets con cambios sin persistir a través de `WidgetStateService.saveAllDirtyForms()`. Cada widget sucio ejecuta secuencialmente su método `saveForm()`.

Históricamente, se intentó unificar todas las operaciones de red bajo la API reactiva `httpResource` de Angular. Sin embargo, en escenarios de mutación (POST, PUT, DELETE) y especialmente en guardados masivos o secuenciales (múltiples widgets sucios o bucles por serie/disparo como en `setProfileReadiness`), este enfoque presentaba graves problemas arquitectónicos:

1. **Semántica `switchMap` y cancelaciones `AbortController`:** `httpResource` es un primitivo reactivo declarativo diseñado para consultas de lectura (GET). Cuando la señal de parámetros que alimenta el recurso cambia mientras una petición está en vuelo, `httpResource` aborta automáticamente la petición anterior mediante `AbortController`. En consecuencia, al guardar varios widgets o series seguidas, **solo se guardaba la última llamada**.
2. **Colapso síncrono de señales:** Cuando dos operaciones disparan `params.set(...)` sobre el mismo recurso en el mismo ciclo síncrono o microtask, el contenedor de señales descarta el primer valor (glitch-free semantics), impidiendo que la primera petición llegue a emitirse.
3. **Sobreingeniería y fragilidad en Zoneless:** Para transformar `httpResource` en un flujo imperativo con promesas se requerían helpers artificiales (`#awaitResourceValue`, `toObservable`, `filter`, `take(1)`), propensos a carreras y transiciones perdidas entre iteraciones secuenciales.
4. **Métodos sin promesa (`void`):** Ciertos widgets (`ArmamentIntroduction`, `VelocityIntroduction`, `JltShotData`) invocaban métodos `setShot*` que solo actualizaban una señal interna sin retornar ninguna `Promise`, provocando que el bucle `for...of` de `saveAllDirtyForms()` avanzara de forma instantánea sin esperar a que el servidor confirmara la escritura.

## Decisión

Se adopta una separación clara de responsabilidades en `libs/domain/trial/execution` según el tipo de operación HTTP:

1. **Consultas de lectura (GET):** Mantienen el uso de `httpResource` con el patrón _Signal Trigger Pattern_ (`resource = httpResource(() => ...)`), beneficiándose de la reactividad pura, cacheado declarativo y ciclo de vida de componentes.
2. **Mutaciones y comandos de escritura (POST, PUT, DELETE):** Se implementan mediante `HttpClient` directo inyectado de forma privada en `ExecutionService`, encapsulado con `firstValueFrom(this.#http.put<T>(url, body))` o `this.#http.post<T>(url, body)`.
   - Se crean métodos imperativos asíncronos (`updateShotArmament`, `updateShotVelocity`, `updateJltShotData`, etc.) que retornan directamente un `Promise<T>` nativo.
   - Los métodos de mutación existentes (`updateShotMunition`, `updateShotPressures`, `updateShotAcousticLevel`, `setSeriesProfileReadiness`, etc.) se refactorizan para prescindir de `#awaitResourceValue` y utilizar `HttpClient.put()` directamente.
   - En `saveForm()` de los widgets, se invocan y esperan mediante `await` estos métodos asíncronos, garantizando que `saveAllDirtyForms()` en `WidgetStateService` pause el avance del bucle hasta que la petición HTTP se complete satisfactoriamente.
3. **Encapsulación arquitectónica:** Los componentes y widgets nunca consumen `HttpClient` directamente; toda interacción HTTP permanece estrictamente aislada dentro de la capa `data-access` (`ExecutionService`).

## Consecuencias

### Positivas

- **Resolución definitiva de cancelaciones:** Cada petición de guardado es una transacción HTTP aislada e independiente; ninguna mutación es abortada por llamadas posteriores.
- **Guardado garantizado:** En `saveAllDirtyForms()`, cada formulario dirty espera a que su PUT confirme antes de avanzar al siguiente widget en el grid.
- **Eliminación de sobreingeniería:** Se erradican las señales sintéticas de parámetros de actualización (`#update*Params`), los triggers artificiales y los hacks basados en `toObservable(isLoading)`.
- **Compatibilidad total con Vitest:** Los tests continúan verificándose de forma determinista a través de `HttpTestingController` (`httpMock.expectOne()`), sin retrasos ni carreras de microtasks.

### Negativas / Consideraciones

- Los componentes que requieran exponer un estado de carga local durante la mutación deben gestionar una señal `isSaving` local o recibir el flag del shell (`ExecutionHeader.isSaving`).
