# ADR-009: Utilidades signals/router propias en `@intaqalab/utils` en lugar de adoptar ngxtension

**Estado:** Aceptado
**Fecha:** 2026-07-12
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

El ecosistema Angular ofrece librerías de utilidades maduras (ngxtension, rx-angular, colecciones ngneat) que resuelven patrones recurrentes de la arquitectura Signals-first del proyecto: params de ruta como signals, effects con dependencias explícitas, debounce sin RxJS, sincronización estado ↔ query params. Se evaluó adoptar `ngxtension` como dependencia.

Factores en contra de añadir la dependencia:

- INTAQALAB es un proyecto de dominio sensible con política de minimizar superficie de dependencias de terceros.
- Solo se necesitaba un subconjunto pequeño (~7 utilidades) de una librería grande.
- Las utilidades necesarias son implementables en <100 líneas cada una sobre primitivas estables de Angular 21 (`effect`, `computed`, `linkedSignal`, `toSignal`).
- Una dependencia externa acopla el calendario de upgrades de Angular al de la librería (ngxtension debe publicar soporte para cada major antes de poder migrar).

## Decisión

Implementar en `libs/shared/utils` (`@intaqalab/utils`) un conjunto propio de utilidades inspiradas en la API de ngxtension, sin dependencia externa:

| Utilidad                                      | Fichero                                | Inspirada en                                        |
| --------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| `explicitEffect(deps, fn, { defer })`         | `lib/signals/explicit-effect.ts`       | ngxtension `explicitEffect`                         |
| `computedPrevious(source)`                    | `lib/signals/computed-previous.ts`     | ngxtension `computedPrevious`                       |
| `debouncedSignal(source, ms)`                 | `lib/signals/debounced-signal.ts`      | ngxtension `debounceSignal` (sin RxJS)              |
| `injectNetworkStatus()`                       | `lib/signals/inject-network-status.ts` | ngxtension `injectNetwork` (reducida a flag online) |
| `injectParams(key?)`                          | `lib/router/inject-params.ts`          | ngxtension `injectParams`                           |
| `injectQueryParams(key?)`                     | `lib/router/inject-query-params.ts`    | ngxtension `injectQueryParams`                      |
| `linkedQueryParam(key, { parse, serialize })` | `lib/router/linked-query-param.ts`     | ngxtension `linkedQueryParam`                       |

**Ampliación (mismo día) — segundo lote de utilidades de diseño propio**, alineadas con necesidades del dominio (panel de ejecución, catálogos, sesión OIDC):

| Utilidad                              | Fichero                                 | Origen                                                            |
| ------------------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `throttledSignal(source, ms)`         | `lib/signals/throttled-signal.ts`       | Complemento de `debouncedSignal` (leading + trailing)             |
| `storageSignal(key, initial, opts)`   | `lib/signals/storage-signal.ts`         | Propia — Web Storage + sync cross-tab vía evento `storage`        |
| `signalHistory(source, { capacity })` | `lib/signals/signal-history.ts`         | Propia — undo/redo instrumentando `set`/`update` (sin effects)    |
| `injectPageVisibility()`              | `lib/signals/inject-page-visibility.ts` | Propia — Page Visibility API (pausar polling en background)       |
| `injectIdleStatus({ idleAfterMs })`   | `lib/signals/inject-idle-status.ts`     | Propia — sustituye caso de uso de `ng2-idle` (auto-logout)        |
| `createCountdown(durationMs)`         | `lib/signals/create-countdown.ts`       | Propia — cuenta de seguridad pausable, sin drift (deadline-based) |

Criterios de diseño comunes:

- Firma `options.injector` + `assertInInjectionContext` para uso fuera de contexto de inyección (patrón CIF estándar).
- RxJS solo vía interop permitido (`toSignal`); cero operadores.
- `linkedQueryParam` se apoya en `linkedSignal`: escritura local síncrona + recomputación desde la URL en navegación externa (back/forward, deep link).
- Tests Vitest por utilidad (40 tests nuevos, cobertura de la lib dentro del umbral 80%).

Utilidades evaluadas y **descartadas** deliberadamente:

- `derivedAsync`: `httpResource` cubre el data fetching; no replicar.
- Bus de eventos (`ng-event-bus`, etc.): anti-patrón con SignalStore como fuente de verdad.
- take-until-destroy y variantes: `takeUntilDestroyed()` nativo ya lo resuelve.
- Pipes de fechas de terceros: ya existe `IntaDatePipe` propio sobre `date-fns`.

## Consecuencias

### Positivas

- Cero dependencias nuevas en `package.json`; upgrades de Angular sin esperar a terceros.
- API idéntica en espíritu a ngxtension: si en el futuro se decidiera adoptar la librería, la migración sería mecánica (mismos nombres y semántica).
- `explicitEffect` materializa en código la regla del repo "leer todas las señales antes del primer `await`" (deps explícitas + cuerpo `untracked`).
- `injectParams`/`injectQueryParams` alimentan el Signal Trigger Pattern sin `subscribe()`.

### Negativas / limitaciones

- Mantenimiento propio: bugs y edge cases que ngxtension ya tiene resueltos (p. ej. coalescing de escrituras) son responsabilidad del equipo.
- `linkedQueryParam` emite una navegación por `set()`; cambiar varios params atómicamente requiere `router.navigate` directo (documentado en JSDoc).
- `computedPrevious` es pull-based: valores intermedios entre lecturas no se conservan como "previo".
- `injectNetworkStatus` cubre solo el flag online/offline, no la Network Information API completa.

- `storageSignal` persiste en texto plano: solo preferencias de UI, nunca datos de negocio o sensibles.
- `signalHistory` guarda referencias, no clones: el estado versionado debe tratarse como inmutable (ya es la norma con signals).

### Verificación realizada

- `nx test utils`: 130 tests OK (86 nuevos entre ambos lotes).
- `nx lint utils`: 0 errores (1 warning preexistente ajeno a este cambio).
- `tsc --noEmit` sobre `tsconfig.lib.json`: limpio.
