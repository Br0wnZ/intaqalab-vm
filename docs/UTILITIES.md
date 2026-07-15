# 🧰 Utilidades Signals & Router (`@intaqalab/utils`)

Guía de referencia de las utilidades propias de la librería [`libs/shared/utils`](../libs/shared/utils/README.md). Implementadas in-house (cero dependencias externas, API inspirada en ngxtension — ver [ADR-009](adrs/009-utilidades-signals-router-propias.md)).

> [!IMPORTANT]
> **Regla para agentes IA:** antes de implementar a mano un helper reactivo (debounce, throttle, params de ruta como signal, persistencia en storage, countdown, idle, undo…), comprueba esta guía. Si la utilidad existe aquí, **úsala** — no reimplementes ni propongas instalar ngxtension/rx-angular. Si falta, impleméntala en `libs/shared/utils` siguiendo el mismo contrato y añádela a esta guía.

## Import

```typescript
import {
  actionTrigger,
  computedPrevious,
  createCountdown,
  debouncedSignal,
  explicitEffect,
  injectIdleStatus,
  injectNetworkStatus,
  injectPageVisibility,
  injectParams,
  injectQueryParams,
  linkedQueryParam,
  safeResourceValue,
  signalHistory,
  storageSignal,
  throttledSignal,
} from '@intaqalab/utils';
```

## Tabla de decisión — necesidad → utilidad

| Necesito…                                       | Usa                    | NO uses                                          |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------ |
| Reaccionar solo a ciertas señales en un effect  | `explicitEffect`       | `effect()` con lecturas sueltas                  |
| Id de ruta que alimente `httpResource`          | `injectParams`         | `route.snapshot.params` / `paramMap.subscribe()` |
| Leer un query param (solo lectura)              | `injectQueryParams`    | `route.snapshot.queryParams`                     |
| Filtro/paginación sincronizado con URL          | `linkedQueryParam`     | signal local + `router.navigate` manual          |
| Búsqueda sin refetch por tecla                  | `debouncedSignal`      | `debounceTime` de RxJS                           |
| Telemetría/gauges a ritmo acotado               | `throttledSignal`      | `throttleTime` de RxJS                           |
| Valor anterior de un signal (transiciones)      | `computedPrevious`     | signal + effect manual                           |
| Preferencia UI que sobreviva F5                 | `storageSignal`        | `localStorage` manual disperso                   |
| Undo/redo sobre estado local                    | `signalHistory`        | pila manual ad-hoc                               |
| Detectar pestaña en background (pausar polling) | `injectPageVisibility` | `document.addEventListener` manual               |
| Auto-logout por inactividad                     | `injectIdleStatus`     | ng2-idle / timers manuales                       |
| Cuenta de seguridad / countdown pausable        | `createCountdown`      | `setInterval` acumulando ticks (drift)           |
| Estado online/offline                           | `injectNetworkStatus`  | `navigator.onLine` sin reactividad               |
| Leer valor resource con seguridad               | `safeResourceValue`    | `try/catch` manual o lecturas inseguras          |
| Forzar mutaciones httpResource o resetear       | `actionTrigger`        | `signal()` regular o métodos no estables         |

## Contrato común

- Las funciones `inject*`, `linkedQueryParam`, `debouncedSignal`, `throttledSignal`, `createCountdown` y `storageSignal` requieren **contexto de inyección** (constructor, inicializador de campo, factory de `withMethods`/`withProps`). Fuera de él: pasar `{ injector }` en options.
- Cleanup automático vía `DestroyRef` del injector propietario (listeners, timers).
- Cero RxJS salvo interop permitido (`toSignal` interno en las de router).
- `computedPrevious` y `signalHistory` NO necesitan contexto de inyección.

---

## 1. `explicitEffect(deps, fn, options?)`

**Qué es:** `effect()` con array de dependencias explícito. Solo las señales de `deps` disparan re-ejecución; el cuerpo corre en `untracked()` — ninguna señal leída dentro se convierte en dependencia accidental.

**Para qué se usa:** side effects controlados (log, storage, APIs imperativas, disparar cargas). Cumple por construcción la regla del repo _"leer todas las señales antes del primer `await`"_.

```typescript
// Reacciona SOLO a trialId; status se lee pero no re-dispara:
explicitEffect([this.store.trialId], ([trialId]) => {
  this.logger.info(`Trial ${trialId}, estado: ${this.store.status()}`);
});

// defer: true → ignora la ejecución inicial, solo cambios reales
explicitEffect([this.filters], ([f]) => this.analytics.track(f), { defer: true });

// Cleanup idéntico a effect() nativo:
explicitEffect([this.shotId], ([id], onCleanup) => {
  const timer = setTimeout(() => this.highlight(id), 500);
  onCleanup(() => clearTimeout(timer));
});
```

> [!CAUTION]
> No usar para **derivar estado** — eso es `computed()` o `linkedSignal()`. Effect es último recurso.

---

## 2. `computedPrevious(source)`

**Qué es:** `Signal<T>` de solo lectura con el valor **anterior** de `source`. Primera lectura devuelve el valor actual.

**Para qué se usa:** detectar transiciones en la máquina de estados de ejecución, deltas en widgets, dirección de cambio.

```typescript
readonly status = this.store.executionStatus;
readonly previousStatus = computedPrevious(this.store.executionStatus);

readonly resumedFromPause = computed(
  () => this.previousStatus() === 'PAUSED' && this.status() === 'IN_PROGRESS',
);
```

**Limitación:** pull-based — "anterior" es el de la última _lectura_; valores intermedios no leídos se colapsan.

---

## 3. `debouncedSignal(source, debounceMs?, options?)`

**Qué es:** signal de solo lectura que replica `source` tras `debounceMs` (default 300) sin cambios. Sin RxJS.

**Para qué se usa:** inputs de búsqueda que alimentan el Signal Trigger Pattern — `httpResource` no refetchea por tecla.

```typescript
readonly searchTerm = signal('');
readonly #debouncedTerm = debouncedSignal(this.searchTerm, 300);

readonly results = httpResource<CatalogItem[]>(() =>
  this.#debouncedTerm() ? `/api/master-data/ammo?q=${this.#debouncedTerm()}` : undefined,
);
```

---

## 4. `throttledSignal(source, intervalMs?, options?)`

**Qué es:** signal de solo lectura que replica `source` como máximo una vez por ventana (leading + trailing).

**Para qué se usa:** fuentes de alta frecuencia que deben seguir actualizando la UI _durante_ la actividad: telemetría a Chart.js, gauges, progreso.

**Regla debounce vs throttle:** ¿importa el valor solo cuando los cambios paran? → debounce. ¿Necesitas updates periódicos mientras cambia? → throttle.

```typescript
// Chart re-renderiza máx. cada 500 ms aunque la telemetría emita a 50 Hz:
readonly chartPressure = throttledSignal(this.store.livePressure, 500);
```

---

## 5. `storageSignal(key, initialValue, options?)`

**Qué es:** `WritableSignal<T>` persistido en Web Storage. Lee inicial de storage (fallback si falta o corrupto), `set()`/`update()` escriben síncrono, sync cross-tab vía evento `storage` (default on).

**Para qué se usa:** preferencias de UI que sobreviven F5 y no pertenecen al backend: layout del execution grid, densidad de tabla, paneles colapsados.

```typescript
readonly gridLayout = storageSignal<GridLayout>('execution.grid-layout', DEFAULT_LAYOUT);

// Por pestaña, sin sync:
readonly draft = storageSignal('wizard.draft', {}, { storage: sessionStorage, crossTab: false });

// Tipos no-JSON:
readonly lastVisit = storageSignal<Date>('last-visit', new Date(), {
  parse: (raw) => new Date(Number(raw)),
  serialize: (value) => String(value.getTime()),
});
```

> [!CAUTION]
> Storage es texto plano: **solo preferencias de UI**, nunca datos de negocio ni sensibles.

---

## 6. `signalHistory(source, { capacity? })`

**Qué es:** undo/redo para un `WritableSignal` instrumentando su `set`/`update`. Devuelve `{ canUndo, canRedo, history, undo(), redo(), clear() }`. Registro síncrono, sin effects, sin contexto de inyección. `capacity` default 50.

**Para qué se usa:** edición de layout de widgets, formularios complejos, cualquier estado local donde el usuario experimenta y quiere volver atrás.

```typescript
readonly layout = signal<GridLayout>(DEFAULT_LAYOUT);
readonly layoutHistory = signalHistory(this.layout, { capacity: 20 });
```

```html
<button matIconButton aria-label="Deshacer" [disabled]="!layoutHistory.canUndo()" (click)="layoutHistory.undo()">
  <mat-icon>undo</mat-icon>
</button>
```

**Limitación:** guarda referencias, no clones — el estado debe tratarse como inmutable (norma ya con signals).

---

## 7. `injectNetworkStatus(options?)`

**Qué es:** conectividad como `Signal<boolean>` (`navigator.onLine` + eventos `online`/`offline`).

**Para qué se usa:** banner offline en el shell, deshabilitar acciones que requieren red (transiciones de ejecución), pausar refetch.

```typescript
readonly online = injectNetworkStatus();
```

```html
@if (!online()) {
<inta-offline-banner />
}
<button matButton [disabled]="!online()">{{ 'execution.actions.fire' | translate }}</button>
```

---

## 8. `injectPageVisibility(options?)`

**Qué es:** visibilidad de la pestaña como `Signal<boolean>` (Page Visibility API).

**Para qué se usa:** pausar polling de estado de ejecución con pestaña en background; refetch al volver.

```typescript
readonly pageVisible = injectPageVisibility();

explicitEffect([this.pageVisible], ([visible]) =>
  visible ? this.store.startPolling() : this.store.stopPolling(),
);
```

---

## 9. `injectIdleStatus(options?)`

**Qué es:** inactividad de usuario como `{ idle: Signal<boolean>, lastActivityAt: Signal<number> }`. `idle` → `true` tras `idleAfterMs` (default 5 min) sin actividad (pointer/teclado/scroll/touch, listeners pasivos).

**Para qué se usa:** auto-logout / re-lock de sesión con `angular-auth-oidc-client`; atenuar paneles con datos sensibles.

```typescript
readonly idleStatus = injectIdleStatus({ idleAfterMs: 15 * 60 * 1000 });

explicitEffect([this.idleStatus.idle], ([idle]) => {
  if (idle) this.oidcSecurityService.logoff();
}, { defer: true });
```

---

## 10. `createCountdown(durationMs, options?)`

**Qué es:** cuenta atrás pausable como signals: `{ remainingMs, running, finished, start(), pause(), resume(), reset() }`. Sin drift — restante derivado de un deadline timestamp. `tickMs` (default 100) solo controla el refresco de UI.

**Para qué se usa:** la **cuenta de seguridad** del panel de ejecución (endpoint `updateSecurityCountdown`); timeouts visibles de UI.

```typescript
readonly safetyCount = createCountdown(30_000);

onSafetyStart(): void {
  this.safetyCount.start();
}
onSafetyPause(): void {
  this.safetyCount.pause();
}
```

```html
<span class="font-mono text-4xl">{{ safetyCount.remainingMs() / 1000 | intaDecimal:'1.0-0' }}</span>
@if (safetyCount.finished()) {
<inta-fire-enabled-badge />
}
```

---

## 11. `injectParams(key?, options?)`

**Qué es:** params de ruta como signal. Con `key` → `Signal<string | null>`; sin key → `Signal<Params>`. Se actualiza en navegaciones que reutilizan el componente.

**Para qué se usa:** id de ruta → `httpResource` (Signal Trigger Pattern) sin `subscribe()`. Sustituye `route.snapshot.params` (bug latente: el snapshot no se actualiza al reusar componente).

```typescript
readonly trialId = injectParams('trialId');

readonly trial = httpResource<Trial>(() =>
  this.trialId() ? `/api/trials/${this.trialId()}` : undefined,
);
```

---

## 12. `injectQueryParams(key?, options?)`

**Qué es:** igual que `injectParams` pero para query params. **Solo lectura.**

**Para qué se usa:** leer `?returnUrl=`, `?tab=`, flags de navegación que el componente no modifica.

```typescript
readonly activeTab = injectQueryParams('tab');
```

> [!NOTE]
> Si el componente también **escribe** el param → `linkedQueryParam`.

---

## 13. `linkedQueryParam(key, options?)`

**Qué es:** `WritableSignal<T>` sincronizado bidireccional con un query param. URL → signal (back/forward, deep link, F5) y signal → URL (`set()`/`update()` navegan con `queryParamsHandling: 'merge'`, `replaceUrl: true` por defecto). `parse`/`serialize` tipan el valor; `serialize` → `null` elimina el param.

**Para qué se usa:** filtros, paginación y orden de catálogos master-data — estado compartible por URL y resistente a F5.

```typescript
readonly searchTerm = linkedQueryParam('q'); // WritableSignal<string | null>

readonly page = linkedQueryParam('page', {
  parse: (raw) => (raw ? Number(raw) : 1),
  serialize: (value) => (value === 1 ? null : String(value)), // page=1 fuera de la URL
});

onNextPage(): void {
  this.page.update((page) => page + 1);
}
```

Combinación canónica filtro + URL + fetch:

```typescript
readonly searchTerm = linkedQueryParam('q');
readonly #debounced = debouncedSignal(computed(() => this.searchTerm() ?? ''), 300);
readonly items = httpResource<Item[]>(() => `/api/master-data/items?q=${this.#debounced()}`);
```

**Limitación:** cada `set()` emite una navegación. Cambiar varios params atómicamente → `router.navigate` directo con todos.

---

## 14. `actionTrigger()`

**Qué es:** `ActionTrigger<T>` es un wrapper sobre un signal configurado con `{ equal: () => false }` para asegurar que cada vez que se emita un payload, se obligue a re-evaluar la reactividad (incluso si el payload es idéntico al anterior).

**Para qué se usa:** mutaciones en el **Signal Trigger Pattern** (POST/PUT/DELETE) donde un mismo payload enviado múltiples veces debe disparar un nuevo `httpResource`, o cuando se requiere resetear el recurso manualmente de vuelta al estado `Idle`.

```typescript
// En lugar de signal<Payload | null>(null)
readonly #createTrigger = actionTrigger<CreateEntityDto>();

readonly createResource = httpResource<EntityResponse>(() => {
  const body = this.#createTrigger.value();
  if (!body) return undefined; // Retornar undefined resetea el resource a Idle

  return { url: '/api/entities', method: 'POST', body };
});

create(dto: CreateEntityDto): void {
  // Siempre dispara la red, aunque 'dto' sea idéntico al anterior
  this.#createTrigger.fire(dto);
}

reset(): void {
  // Pone el trigger a null, haciendo que el resource retorne a Idle
  this.#createTrigger.reset();
}
```

---

## 15. `safeResourceValue(resource)`

**Qué es:** Función segura para leer el valor de un `ResourceRef` o `HttpResourceRef` sin lanzar excepciones, comprobando la existencia de `hasValue()`.

**Para qué se usa:** Evitar errores de inicialización ("Signal is not initialized") en componentes, computed properties o efectos al intentar leer recursos en estado inicial sin resolver.

```typescript
// Seguro independientemente de si es local, HTTP, inicializado o no
readonly fireTrialData = computed(() => safeResourceValue(this.trialsService.byIdResource));
```

---

## Testing

Cada utilidad tiene spec junto al fuente (`nx test utils`). Patrones útiles al testear código que las consume:

- Effects (`explicitEffect`, `debouncedSignal`, `throttledSignal`): flush con `TestBed.tick()`; timers con `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`.
- Router (`injectParams`, `injectQueryParams`, `linkedQueryParam`): `RouterTestingHarness` + `provideRouter`. Para esperar navegaciones de `linkedQueryParam`: `waitForSignal(() => router.url, ...)` de `@intaqalab/utils`.
- `storageSignal` cross-tab: `window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }))`.
