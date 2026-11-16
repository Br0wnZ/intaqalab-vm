---
name: signal-trigger-pattern
version: 1.2.0
last-updated: 2026-11-13
description: Implements the Signal Trigger Pattern — mandatory httpResource + private trigger signal pattern for GET queries, and HttpClient + firstValueFrom for mutations in Intaqalab. USE WHEN creating or modifying data-access services, stores that fetch remote data or execute mutations, or any component that interacts with APIs.
---

# Signal Trigger Pattern — Intaqalab Standard

El patrón canónico para data-fetching (GET) en el proyecto. Toda carga de datos remota usa este patrón. Las mutaciones (POST/PUT/PATCH/DELETE) usan `HttpClient` imperativo con `firstValueFrom` bajo el principio CQS (ADR-020).

## Por Qué Este Patrón (Separación CQS)

- **GET (Queries):** `httpResource` reactivo con trigger signal privado. Sin suscripciones manuales, auto-cancelación limpia al cambiar parámetros.
- **POST/PUT/PATCH/DELETE (Mutaciones):** `HttpClient` imperativo con `firstValueFrom` retornando `Promise<T>`. Evita cancelaciones accidentales por `AbortController`, permite composición secuencial `await` y control determinista de errores.
- Sin `ngOnInit` con lógica HTTP ni suscripciones sin cleanup.
- El Store controla cuándo se dispara la carga y orquesta mutaciones.
- La vista recibe computed signals, nunca observables.

---

## Implementación Completa (3 capas)

### Capa 1 — Service (`data-access`)

```typescript
// libs/domain/<domain>/data-access/src/lib/<entity>.service.ts
import { HttpClient, httpResource } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { AppConfigService } from '@intaqalab/config';
import {
  CreateEntityDto,
  EntityListResponse,
  EntityParams,
  EntityResponse,
  UpdateEntityDto,
} from '@intaqalab/models/<domain>';
import { firstValueFrom } from 'rxjs';

@Service()
export class EntityService {
  readonly #http = inject(HttpClient);
  readonly #config = inject(AppConfigService);

  // 1. GET (Queries): Trigger privado + httpResource
  readonly #trigger = signal<EntityParams | null>(null);

  readonly resource = httpResource<EntityListResponse>(() => {
    const params = this.#trigger();
    if (!params) return undefined; // sin trigger → sin petición

    return {
      url: `${this.#config.apiUrl}/entities`,
      method: 'GET',
      params: { ...params },
    };
  });

  // Método público para disparar la query reactiva
  load(params: EntityParams): void {
    this.#trigger.set(params);
  }

  // 2. MUTACIONES (Commands - POST/PUT/PATCH/DELETE): HttpClient + firstValueFrom (ADR-020)
  // PROHIBIDO usar httpResource para mutaciones
  create(dto: CreateEntityDto): Promise<EntityResponse> {
    return firstValueFrom(this.#http.post<EntityResponse>(`${this.#config.apiUrl}/entities`, dto));
  }

  update(id: string, dto: UpdateEntityDto): Promise<EntityResponse> {
    return firstValueFrom(this.#http.put<EntityResponse>(`${this.#config.apiUrl}/entities/${id}`, dto));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.#http.delete<void>(`${this.#config.apiUrl}/entities/${id}`));
  }
}
```

### Capa 2 — SignalStore (`feature`)

```typescript
// libs/domain/<domain>/feature-<name>/src/lib/+state/<entity>.store.ts
import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { EntityService } from '@intaqalab/data-access/<domain>';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const EntityStore = signalStore(
  { providedIn: 'root' }, // o en el componente Shell

  withState({
    selectedId: null as string | null,
    filters: {} as EntityParams,
    isSaving: false,
  }),

  withComputed((_, entityService = inject(EntityService)) => ({
    // Expone la data del resource como computed signal
    items: computed(() => entityService.resource.value()?.data ?? []),
    total: computed(() => entityService.resource.value()?.total ?? 0),
    isLoading: computed(() => entityService.resource.isLoading()),
    error: computed(() => entityService.resource.error()),
  })),

  withMethods((store, entityService = inject(EntityService)) => ({
    load(params: EntityParams): void {
      patchState(store, { filters: params });
      entityService.load(params);
    },
    async create(dto: CreateEntityDto): Promise<void> {
      patchState(store, { isSaving: true });
      try {
        await entityService.create(dto);
        // Tras mutación exitosa: recarga queries usando los últimos filtros
        entityService.load(store.filters());
      } finally {
        patchState(store, { isSaving: false });
      }
    },
    selectItem(id: string): void {
      patchState(store, { selectedId: id });
    },
  })),
);
```

### Capa 3 — Shell Component (`feature`)

> [!IMPORTANT]
> **Patrón Obligatorio de 3 Estados en la Vista:**
>
> 1. **Loading (`isLoading()`)**: Réplica visual de la vista usando componentes `ui-skeleton` / `ui-skeleton-card` de `@intaqalab/ui`.
> 2. **Error (`error()`)**: Mensaje de error accesible traducido con `@ngx-translate` (`{{ 'ERRORS.LOADING_ERROR' | translate }}`).
> 3. **Success**: Componentes reales cargados con los datos.
>
> **REGLA DE ORO DE INYECCIÓN:** La store NUNCA se expone públicamente ni se accede directamente en el HTML. Se inyecta como `readonly #store = inject(Store)` y se exponen propiedades mediante `computed()`.

```typescript
// El componente Shell provee el Store y expone señales computadas para la vista
@Component({
  selector: 'inta-entity-shell',
  imports: [Skeleton, SkeletonCard, TranslatePipe, EntityCardComponent],
  providers: [EntityStore], // provee aquí si el scope es la feature
  template: `
    @if (isLoading()) {
      <!-- ESTADO 1: LOADING (Réplica visual con Skeletons) -->
      <div class="flex flex-col gap-4 p-4">
        <ui-skeleton variant="text" width="40%" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (i of [1, 2, 3]; track i) {
            <ui-skeleton-card animation="wave" />
          }
        </div>
      </div>
    } @else if (error()) {
      <!-- ESTADO 2: ERROR (Mensaje i18n) -->
      <div class="p-6 text-center text-client-error font-medium">
        {{ 'ERRORS.LOADING_ERROR' | translate }}
      </div>
    } @else {
      <!-- ESTADO 3: ÉXITO (Componentes reales con datos) -->
      <div class="flex flex-col gap-4 p-4">
        @for (item of items(); track item.id) {
          <inta-entity-card [item]="item" />
        }
      </div>
    }
  `,
})
export class EntityShellComponent {
  readonly #store = inject(EntityStore);

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly error = computed(() => this.#store.error());
  readonly items = computed(() => this.#store.items());

  constructor() {
    // Dispara la carga inicial en el constructor
    effect(() => {
      this.#store.load({ page: 1, size: 20 });
    });
  }
}
```

## Patrones Avanzados Angular 22.2 + NgRx Signals 22

1. **Paginación/Recarga Sin Parpadeo (`@ngrx/signals/resource`):** En listados paginados o por disparo, envuelve `httpResource` con `extendResource(httpResource(...), withPreviousValueOnLoading())` para mantener los datos previos visibles durante `'reloading'`.
2. **Encadenamiento Declarativo (`ctx.chain()`):** Para recursos dependientes (ej. componentes → denominaciones → lotes), usa `(ctx) => { const parents = ctx.chain(this.parentResource); ... }` propagando estados `'idle' | 'loading' | 'error'` sin guardas manuales.
3. **Instantáneas (`resource.snapshot()` y `resourceFromSnapshots()`):** En vistas 3-State o composición de resources, usa `@let snap = resource.snapshot(); @switch (snap.status)` con narrow discriminado automático.
4. **Debounce Nativo (`debounced()`):** Si una búsqueda requiere estado `.isLoading()` mientras el usuario teclea antes del HTTP, usa `debounced(searchSignal, 300)` combinado con `ctx.chain()`. Para debounce síncrono simple, usa `debouncedSignal()` de `@intaqalab/utils`.
5. **Efectos sin `{ allowSignalWrites: true }`:** En Angular 22 `allowSignalWrites` es innecesario/obsoleto; escribe en triggers o stores directamente desde `effect()` leyendo dependencias antes del primer `await`.

---

## Variantes Comunes

### Carga paginada reactiva

```typescript
// En el Store: el trigger reacciona a cambios de página
withMethods((store, service = inject(EntityService)) => ({
  goToPage(page: number): void {
    patchState(store, { currentPage: page });
    service.load({ page, size: store.pageSize() });
  },
}));
```

### Refresco tras mutación (CQS)

```typescript
// Tras create/update/delete con HttpClient, recarga la lista limpiamente con await
withMethods((store, service = inject(EntityService)) => ({
  async createAndRefresh(dto: CreateEntityDto): Promise<void> {
    await service.create(dto);
    service.load(store.filters()); // Re-dispara el httpResource de GET
  },
}));
```

---

## Utilidades `@intaqalab/utils` que alimentan el patrón

Usa estas utilidades propias en lugar de reimplementarlas (guía completa: `docs/UTILITIES.md`):

```typescript
import { debouncedSignal, explicitEffect, injectParams, linkedQueryParam } from '@intaqalab/utils';

// Id de ruta como trigger — refetch automático al navegar entre entidades:
readonly trialId = injectParams('trialId');
readonly trial = httpResource<Trial>(() =>
  this.trialId() ? `${this.#config.apiUrl}/trials/${this.trialId()}` : undefined,
);

// Búsqueda sin refetch por tecla:
readonly searchTerm = linkedQueryParam('q'); // además sincroniza con la URL
readonly #debounced = debouncedSignal(computed(() => this.searchTerm() ?? ''), 300);
readonly items = httpResource<Item[]>(() => ({
  url: `${this.#config.apiUrl}/items`,
  method: 'GET',
  params: { q: this.#debounced() },
}));

// Feedback de mutación sin dependencias accidentales:
explicitEffect([this.store.saveStatus], ([status]) => {
  if (status === 'resolved') this.toast.success('OK');
});
```

Regla: nunca `route.snapshot.params` para triggers (no se actualiza al reusar el componente) — siempre `injectParams`.

---

## Anti-patrones — Nunca Hagas Esto

```typescript
// ❌ HttpClient directo en el componente
ngOnInit() { this.http.get('/api/entities').subscribe(d => this.data = d); }

// ❌ Observable expuesto desde el servicio a la vista
entities$ = this.http.get<Entity[]>('/api/entities');

// ❌ Usar httpResource para mutaciones (POST, PUT, PATCH, DELETE) — PROHIBIDO (ADR-020)
readonly createResource = httpResource(() => ({ method: 'POST', body: ... }));

// ❌ Crear effects o actionTriggers para intentar sincronizar mutaciones con httpResource
async create(dto) { this.createTrigger.fire(dto); effect(() => { ... }); }

// ❌ Trigger en el componente en lugar del Store
constructor() { this.service.load(params); } // el componente no llama al service directamente

// ❌ Leer resource.value() en el template directamente (sin computed en el Store)
{{ service.resource.value()?.data }}

// ❌ Non-null assertion on resource.value()! (Forbidden non-null assertion)
```
