---
name: signal-trigger-pattern
description: Implements the Signal Trigger Pattern — the mandatory httpResource + private trigger signal pattern for all data fetching in the Intaqalab project. USE WHEN creating or modifying data-access services, stores that fetch remote data, or any component that needs to load data from an API.
---

# Signal Trigger Pattern — Intaqalab Standard

El patrón canónico para data-fetching en el proyecto. Toda carga de datos remota usa este patrón. Sin excepciones.

## Por Qué Este Patrón

- Sin suscripciones manuales `.subscribe()`.
- Sin `ngOnInit` con lógica HTTP.
- El servicio es un signal reactivo puro.
- El Store controla cuándo se dispara la carga.
- La vista recibe computed signals, nunca observables.

---

## Implementación Completa (3 capas)

### Capa 1 — Service (`data-access`)

```typescript
// libs/domain/<domain>/data-access/src/lib/<entity>.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { httpResource } from '@angular/core';
import { AppConfigService } from '@intaqalab/config';
import { EntityListResponse, EntityParams } from '@intaqalab/models/<domain>';

@Injectable({ providedIn: 'root' })
export class EntityService {
  readonly #config = inject(AppConfigService);

  // 1. Trigger privado — activa el recurso cuando no es null
  readonly #trigger = signal<EntityParams | null>(null);

  // 2. httpResource — reactivo al trigger
  readonly resource = httpResource<EntityListResponse>(() => {
    const params = this.#trigger();
    if (!params) return undefined; // sin trigger → sin petición

    return {
      url: `${this.#config.apiUrl}/entities`,
      method: 'GET',
      params: { ...params },
    };
  });

  // 3. Método público — lo llama el Store (nunca el componente directamente)
  load(params: EntityParams): void {
    this.#trigger.set(params);
  }

  // Para operaciones POST/PUT/DELETE usar httpResource con method específico
  readonly #createTrigger = signal<CreateEntityDto | null>(null);

  readonly createResource = httpResource<EntityResponse>(() => {
    const body = this.#createTrigger();
    if (!body) return undefined;
    return {
      url: `${this.#config.apiUrl}/entities`,
      method: 'POST',
      body,
    };
  });

  create(dto: CreateEntityDto): void {
    this.#createTrigger.set(dto);
  }
}
```

### Capa 2 — SignalStore (`feature`)

```typescript
// libs/domain/<domain>/feature-<name>/src/lib/+state/<entity>.store.ts
import { computed } from '@angular/core';
import { inject } from '@angular/core';
import { EntityService } from '@intaqalab/data-access/<domain>';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const EntityStore = signalStore(
  { providedIn: 'root' }, // o en el componente Shell

  withState({
    selectedId: null as string | null,
    filters: {} as EntityParams,
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
      entityService.load(params);
    },
    create(dto: CreateEntityDto): void {
      entityService.create(dto);
    },
    selectItem(id: string): void {
      patchState(store, { selectedId: id });
    },
  })),
);
```

### Capa 3 — Shell Component (`feature`)

```typescript
// El componente Shell provee el Store y dispara la carga inicial
@Component({
  selector: 'inta-entity-shell',
  providers: [EntityStore], // provee aquí si el scope es la feature
  template: `
    @if (store.isLoading()) {
      <mat-progress-bar mode="indeterminate" />
    }
    @for (item of store.items(); track item.id) {
      <inta-entity-card [item]="item" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityShellComponent {
  protected readonly store = inject(EntityStore);

  constructor() {
    // Dispara la carga inicial en el constructor
    effect(
      () => {
        this.store.load({ page: 1, size: 20 });
      },
      { allowSignalWrites: true },
    );
  }
}
```

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

### Refresco tras mutación

```typescript
// Tras create/update/delete, recarga la lista
withMethods((store, service = inject(EntityService)) => ({
  async createAndRefresh(dto: CreateEntityDto): Promise<void> {
    service.create(dto);
    // Espera a que el resource de creación resuelva, luego recarga
    effect(() => {
      if (!service.createResource.isLoading() && service.createResource.value()) {
        service.load(store.lastParams());
      }
    });
  },
}));
```

---

## Anti-patrones — Nunca Hagas Esto

```typescript
// ❌ HttpClient directo en el componente
ngOnInit() { this.http.get('/api/entities').subscribe(d => this.data = d); }

// ❌ Observable expuesto desde el servicio
entities$ = this.http.get<Entity[]>('/api/entities');

// ❌ Trigger en el componente en lugar del Store
constructor() { this.service.load(params); } // el componente no llama al service directamente

// ❌ Leer resource.value() en el template directamente (sin computed en el Store)
{{ service.resource.value()?.data }}
```
