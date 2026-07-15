# `@intaqalab/utils`

Librería de utilidades compartidas del monorepo. Incluye pipes/directivas de formato, helpers de testing y un conjunto de **utilidades signals/router propias** (sin dependencias externas, inspiradas en la API de ngxtension — ver [ADR-009](../../../docs/adrs/009-utilidades-signals-router-propias.md)).

```ts
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

Todas las funciones `inject*` y `linkedQueryParam` deben llamarse en contexto de inyección (constructor / inicializador de campo). Fuera de él, pasar `{ injector }` en options.

---

## Utilidades de Signals

### `explicitEffect(deps, fn, options?)`

**Qué hace:** `effect()` con array de dependencias explícito. Solo las señales del array disparan el effect; el cuerpo se ejecuta dentro de `untracked()`, así que cualquier señal leída dentro NO se convierte en dependencia accidental.

**Cuándo usarlo:**

- Siempre que un `effect()` clásico lea varias señales pero solo deba reaccionar a una/algunas.
- Effects con lógica async: garantiza por construcción la regla del repo _"leer todas las señales antes del primer `await`"_.
- Con `{ defer: true }` cuando no quieres la ejecución inicial (solo reaccionar a cambios).

**Cuándo NO:** para derivar estado → usa `computed()` o `linkedSignal()`. Effect es último recurso (side effects: log, focus, storage, APIs imperativas).

```ts
// Solo reacciona a trialId. status se lee pero NO retrigger.
explicitEffect([this.store.trialId], ([trialId]) => {
  this.logger.info(`Trial ${trialId}, estado: ${this.store.status()}`);
});

// defer: no ejecuta al montar, solo en cambios reales
explicitEffect([this.filters], ([f]) => this.analytics.track(f), { defer: true });

// cleanup igual que effect() nativo
explicitEffect([this.shotId], ([id], onCleanup) => {
  const timer = setTimeout(() => this.highlight(id), 500);
  onCleanup(() => clearTimeout(timer));
});
```

---

### `computedPrevious(source)`

**Qué hace:** signal de solo lectura con el valor **anterior** de `source`. En la primera lectura devuelve el valor actual (aún no hay anterior).

**Cuándo usarlo:**

- Detectar transiciones de estado: máquina de estados de ejecución (`READY → FIRING`), saber de dónde vienes.
- Animaciones/UI que comparan valor previo vs actual (flechas delta, dirección de cambio).
- Auditoría ligera en widgets: mostrar "valor anterior" sin guardarlo en la store.

**Limitación:** pull-based — "anterior" es el valor de la última **lectura**, valores intermedios no leídos se colapsan.

```ts
readonly status = this.store.executionStatus;
readonly previousStatus = computedPrevious(this.store.executionStatus);

readonly cameFromPause = computed(
  () => this.previousStatus() === 'PAUSED' && this.status() === 'READY',
);
```

---

### `debouncedSignal(source, debounceMs?, options?)`

**Qué hace:** signal de solo lectura que replica `source` tras `debounceMs` (default 300) de silencio. Sin RxJS — `effect` + `setTimeout` con cleanup automático al destruir el injector.

**Cuándo usarlo:**

- **Caso principal:** input de búsqueda que alimenta el Signal Trigger Pattern — evita que `httpResource` refetchee en cada tecla.
- Cualquier señal de alta frecuencia (resize, slider, scroll position) que dispara trabajo caro.

**Cuándo NO:** si necesitas throttle (emisión periódica durante actividad) o cancelación de peticiones en vuelo — eso ya lo hace `httpResource` al cambiar la URL.

```ts
readonly searchTerm = signal('');
readonly #debouncedTerm = debouncedSignal(this.searchTerm, 300);

readonly results = httpResource<CatalogItem[]>(() =>
  this.#debouncedTerm() ? `/api/master-data/ammo?q=${this.#debouncedTerm()}` : undefined,
);
```

---

### `injectNetworkStatus(options?)`

**Qué hace:** conectividad del navegador como `Signal<boolean>` (`navigator.onLine` + eventos `online`/`offline`). Listeners se eliminan solos al destruir el injector.

**Cuándo usarlo:**

- Banner "sin conexión" en el shell de la app.
- Deshabilitar acciones que requieren red en el panel de ejecución (transiciones de estado, envío de datos) cuando no hay conectividad.
- Pausar polling/refetch mientras offline.

```ts
readonly online = injectNetworkStatus();
```

```html
@if (!online()) {
<inta-offline-banner />
}
<button matButton [disabled]="!online()">{{ 'execution.actions.fire' | translate }}</button>
```

---

### `throttledSignal(source, intervalMs?, options?)`

**Qué hace:** signal de solo lectura que replica `source` como máximo una vez por `intervalMs` (default 300). Leading + trailing: el primer cambio pasa inmediato, el último de la ventana aterriza al cerrarse.

**Cuándo usarlo (vs `debouncedSignal`):**

- **Throttle** → necesitas actualizaciones _periódicas_ mientras la fuente sigue cambiando: gauges en vivo, telemetría a Chart.js, indicadores de progreso.
- **Debounce** → solo importa el valor cuando los cambios _paran_: búsquedas.

```ts
// Chart re-renderiza como mucho cada 500 ms aunque la telemetría emita más rápido
readonly chartPressure = throttledSignal(this.store.livePressure, 500);
```

---

### `storageSignal(key, initialValue, options?)`

**Qué hace:** `WritableSignal` persistido en Web Storage. Lee el valor inicial de storage (fallback a `initialValue` si no existe o está corrupto), `set()`/`update()` escriben síncrono, y con `crossTab` (default `true`) escrituras desde otras pestañas actualizan el signal en vivo.

**Cuándo usarlo:**

- Preferencias de UI que deben sobrevivir F5 pero no pertenecen al backend: layout del execution grid, densidad de tablas, paneles colapsados, último tab activo.
- `{ storage: sessionStorage, crossTab: false }` para estado por pestaña.

**Cuándo NO:** datos de negocio o sensibles → store + backend. Storage es texto plano en el navegador.

```ts
readonly gridLayout = storageSignal<GridLayout>('execution.grid-layout', DEFAULT_LAYOUT);
readonly density = storageSignal<'compact' | 'comfortable'>('ui.density', 'comfortable');

// tipos no-JSON con parse/serialize propios:
readonly lastVisit = storageSignal<Date>('last-visit', new Date(), {
  parse: (raw) => new Date(Number(raw)),
  serialize: (value) => String(value.getTime()),
});
```

---

### `signalHistory(source, { capacity? })`

**Qué hace:** añade undo/redo a un `WritableSignal` instrumentando su `set`/`update`. Cada escritura _distinta_ apila el valor reemplazado (undo) y limpia el stack de redo — semántica de editor. Devuelve `{ canUndo, canRedo, history, undo(), redo(), clear() }`. Sin effects ni contexto de inyección: registro síncrono.

**Cuándo usarlo:**

- Edición de configuración de widgets del execution grid (deshacer cambios de layout).
- Formularios complejos donde "deshacer" es más barato que re-fetch.
- Cualquier estado local donde el usuario experimenta y quiere volver atrás.

**Cuándo NO:** estado de la SignalStore global — el historial vive con el signal instrumentado; para stores usa un feature de historial propio.

```ts
readonly layout = signal<GridLayout>(DEFAULT_LAYOUT);
readonly layoutHistory = signalHistory(this.layout, { capacity: 20 });
```

```html
<button matIconButton aria-label="Deshacer" [disabled]="!layoutHistory.canUndo()" (click)="layoutHistory.undo()">
  <mat-icon>undo</mat-icon>
</button>
```

---

### `injectPageVisibility(options?)`

**Qué hace:** visibilidad de la pestaña como `Signal<boolean>` (Page Visibility API). `false` con pestaña en background o ventana minimizada.

**Cuándo usarlo:**

- Pausar polling de estado de ejecución mientras nadie mira; reanudar + refetch al volver.
- Detener animaciones/telemetría en background (batería, CPU).

```ts
readonly pageVisible = injectPageVisibility();

explicitEffect([this.pageVisible], ([visible]) =>
  visible ? this.store.startPolling() : this.store.stopPolling(),
);
```

---

### `injectIdleStatus(options?)`

**Qué hace:** inactividad de usuario como signals: `{ idle, lastActivityAt }`. `idle` pasa a `true` tras `idleAfterMs` (default 5 min) sin actividad (pointer/teclado/scroll/touch, listeners pasivos); cualquier actividad lo revierte. Cleanup automático.

**Cuándo usarlo:**

- **Caso principal:** auto-logout / re-lock de sesión con `angular-auth-oidc-client` — requisito razonable en dominio sensible.
- Atenuar dashboards o cerrar diálogos con datos sensibles cuando nadie interactúa.

```ts
readonly idleStatus = injectIdleStatus({ idleAfterMs: 15 * 60 * 1000 });

explicitEffect([this.idleStatus.idle], ([idle]) => {
  if (idle) this.oidcSecurityService.logoff();
}, { defer: true });
```

---

### `createCountdown(durationMs, options?)`

**Qué hace:** cuenta atrás pausable como signals: `{ remainingMs, running, finished, start(), pause(), resume(), reset() }`. Sin drift — el restante se deriva de un timestamp deadline, no de acumular ticks. `tickMs` (default 100) es solo resolución de refresco de UI.

**Cuándo usarlo:**

- **Diseñada para la cuenta de seguridad** del panel de ejecución: iniciar/pausar/reanudar la cuenta antes de habilitar disparo.
- Timeouts visibles de UI: reintento en N segundos, expiración de código, toast con countdown.

```ts
readonly safetyCount = createCountdown(30_000);

onSafetyStart(): void {
  this.safetyCount.start();
}
```

```html
<span class="font-mono text-4xl">{{ safetyCount.remainingMs() / 1000 | intaDecimal:'1.0-0' }}</span>
@if (safetyCount.finished()) {
<inta-fire-enabled-badge />
}
```

---

## Utilidades de Router

### `injectParams(key?, options?)`

**Qué hace:** params de ruta del `ActivatedRoute` actual como signal. Con `key` → `Signal<string | null>`; sin key → `Signal<Params>` completo. Se actualiza en navegaciones que reutilizan el componente (cambio solo de param).

**Cuándo usarlo:**

- **Caso principal:** alimentar `httpResource` con el id de la ruta — refetch automático al navegar entre entidades, cero `paramMap.subscribe()`.
- Cualquier componente/servicio route-aware que hoy use `route.snapshot.params` (bug latente: snapshot no se actualiza al reusar componente).

```ts
readonly trialId = injectParams('trialId');

readonly trial = httpResource<Trial>(() =>
  this.trialId() ? `/api/trials/${this.trialId()}` : undefined,
);
```

---

### `injectQueryParams(key?, options?)`

**Qué hace:** igual que `injectParams` pero para query params. **Solo lectura.**

**Cuándo usarlo:**

- Leer estado de URL que el componente no modifica: `?returnUrl=`, `?tab=`, flags de origen de navegación.
- Reaccionar a query params escritos por otro componente.

**Cuándo NO:** si el componente también **escribe** el param → `linkedQueryParam` (sincronización bidireccional).

```ts
readonly activeTab = injectQueryParams('tab'); // Signal<string | null>
readonly allQueryParams = injectQueryParams(); // Signal<Params>
```

---

### `linkedQueryParam(key, options?)`

**Qué hace:** `WritableSignal` sincronizado en ambos sentidos con un query param:

- URL → signal: back/forward, deep link, F5 actualizan el signal.
- signal → URL: `set()`/`update()` navegan con `queryParamsHandling: 'merge'` y `replaceUrl: true` (configurable).

Con `parse`/`serialize` el signal queda tipado (number, boolean, enum…). `serialize` devolviendo `null` elimina el param de la URL (valores default limpios).

**Cuándo usarlo:**

- **Caso principal:** filtros/paginación/orden de catálogos master-data — estado sobrevive F5, compartible por URL, back restaura filtros.
- Estado de UI que merece deep-linking: pestaña activa, panel expandido, término de búsqueda.

**Cuándo NO:**

- Estado que no debe ir a URL (selecciones sensibles, estado efímero) → signal normal o store.
- Cambiar **varios** params atómicamente → `router.navigate` directo con todos (cada `set()` emite una navegación propia).

```ts
// string | null crudo
readonly searchTerm = linkedQueryParam('q');

// tipado con parse/serialize — page=1 no ensucia la URL
readonly page = linkedQueryParam('page', {
  parse: (raw) => (raw ? Number(raw) : 1),
  serialize: (value) => (value === 1 ? null : String(value)),
});

onNextPage(): void {
  this.page.update((page) => page + 1); // signal síncrono, URL en la siguiente vuelta
}
```

Combinación completa (filtro con debounce + URL + fetch):

```ts
readonly searchTerm = linkedQueryParam('q');                       // URL ↔ estado
readonly #debounced = debouncedSignal(
  computed(() => this.searchTerm() ?? ''), 300,
);
readonly items = httpResource<Item[]>(() =>
  `/api/master-data/items?q=${this.#debounced()}`,                 // fetch reactivo
);
```

---

### `actionTrigger()`

**Qué hace:** Retorna un `ActionTrigger<T>` que envuelve a un signal configurado con `{ equal: () => false }` para saltarse las verificaciones de igualdad nativas de Angular. Cuenta con funciones para disparar la reactividad (`fire`) y resetear a nulo (`reset`).

**Cuándo usarlo:**

- Para mutaciones (POST, PUT, DELETE) gestionadas con `httpResource` donde pulsar un botón o enviar el mismo formulario repetidamente deba forzar un nuevo envío de red.
- Cuando necesitas resetear un recurso de vuelta al estado `Idle` y borrar su valor, ya que hacer `.reset()` pone la señal interna a `null`, indicando a `httpResource` que detenga peticiones en vuelo y limpie el estado.

**Cuándo NO:**

- Para cargas de datos estándar de tipo GET que dependen de filtros o identificadores reactivos normales (usa signals regulares o `linkedQueryParam`).

```ts
// Definición
readonly #saveTrigger = actionTrigger<SaveDto>();

readonly saveResource = httpResource<SaveResponse>(() => {
  const payload = this.#saveTrigger.value();
  if (!payload) return undefined; // undefined resetea el resource a Idle
  return { url: '/api/items', method: 'POST', body: payload };
});

save(dto: SaveDto): void {
  this.#saveTrigger.fire(dto); // Siempre forzará una petición HTTP
}

clearState(): void {
  this.#saveTrigger.reset(); // Resource pasa a Idle y value a undefined
}
```

---

### `safeResourceValue(resource)`

**Qué hace:** Extrae de manera segura el valor actual de un `ResourceRef` o `HttpResourceRef`. Comprueba la existencia y valor de la función `hasValue()` y captura posibles excepciones internas al leer el signal.

**Cuándo usarlo:**

- Al consumir recursos desde componentes, getters calculados (`computed()`) o efectos (`effect()`). Evita que la inicialización perezosa de Angular lance la excepción `"Signal is not initialized"` si el recurso todavía no ha resuelto.

**Cuándo NO:**

- No lo uses si necesitas obligatoriamente propagar errores del recurso hacia capas superiores de manera síncrona.

```ts
// Lectura 100% segura contra fallos de ciclo de vida del recurso
readonly data = computed(() => safeResourceValue(this.service.resource));
```

---

## Tabla resumen

| Utilidad               | Devuelve                                    | Caso de uso principal                                            |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `explicitEffect`       | `EffectRef`                                 | Side effects con deps controladas, sin dependencias accidentales |
| `computedPrevious`     | `Signal<T>`                                 | Detectar transiciones (estado anterior vs actual)                |
| `debouncedSignal`      | `Signal<T>`                                 | Búsquedas → `httpResource` sin refetch por tecla                 |
| `throttledSignal`      | `Signal<T>`                                 | Telemetría/gauges en vivo a ritmo acotado                        |
| `storageSignal`        | `WritableSignal<T>`                         | Preferencias UI persistentes (F5 + cross-tab)                    |
| `signalHistory`        | `SignalHistory<T>`                          | Undo/redo sobre un signal (layout de widgets)                    |
| `injectNetworkStatus`  | `Signal<boolean>`                           | Banner offline, deshabilitar acciones de red                     |
| `injectPageVisibility` | `Signal<boolean>`                           | Pausar polling con pestaña en background                         |
| `injectIdleStatus`     | `IdleStatus`                                | Auto-logout por inactividad (OIDC)                               |
| `createCountdown`      | `Countdown`                                 | Cuenta de seguridad pausable en ejecución                        |
| `injectParams`         | `Signal<Params>` / `Signal<string \| null>` | Id de ruta → `httpResource` (Signal Trigger Pattern)             |
| `injectQueryParams`    | `Signal<Params>` / `Signal<string \| null>` | Leer query params (solo lectura)                                 |
| `linkedQueryParam`     | `WritableSignal<T>`                         | Filtros/paginación sincronizados con URL                         |
| `actionTrigger`        | `ActionTrigger<T>`                          | Forzar mutaciones httpResource o resetear estado a Idle          |
| `safeResourceValue`    | `T \| undefined`                            | Leer valor resource con seguridad (anti-excepciones de inicio)   |

## Tests

`nx test utils` — Vitest. Cada utilidad tiene su spec junto al fichero fuente.
