# resource() Avanzado — httpResource, hasValue, snapshots

## Patrones avanzados sobre la base ya establecida con httpResource

El proyecto ya tiene el factory pattern `injectWarehouseResource` bien establecido.
Estos son los patrones adicionales para casos especiales.

---

## 1. `resource.hasValue()` como type guard

Siempre usar `hasValue()` antes de acceder a `value()` para evitar errores de tipo y runtime.

```typescript
// ❌ Peligroso: puede lanzar error si resource está en estado 'error'
const name = computed(() => this.userResource.value()?.firstName ?? '');

// ✅ Correcto: hasValue actúa como type guard
const firstName = computed(() => {
  if (this.userResource.hasValue()) {
    return this.userResource.value().firstName; // Aquí value() nunca es undefined
  }
  return ''; // fallback cuando no hay valor o hay error
});

// En template:
// @if (resource.hasValue()) { {{ resource.value().name }} }
// @else if (resource.isLoading()) { <spinner /> }
// @else { <error-state [error]="resource.error()" /> }
```

---

## 2. `resourceFromSnapshots` — Composición con valor anterior

Útil cuando quieres mantener el valor anterior mientras se carga el nuevo (evita flickering).

```typescript
import { linkedSignal, resourceFromSnapshots, Resource, ResourceSnapshot } from '@angular/core';
import { httpResource } from '@angular/common/http';

// Helper reutilizable para "mantener valor anterior mientras carga"
function withPreviousValue<T>(input: Resource<T>): Resource<T> {
  const derived = linkedSignal<ResourceSnapshot<T>, ResourceSnapshot<T>>({
    source: input.snapshot,
    computation: (snap, previous) => {
      // Si está cargando y había un valor previo (no error), mantener el valor previo
      if (snap.status === 'loading' && previous && previous.value.status !== 'error') {
        return { status: 'loading' as const, value: previous.value.value };
      }
      return snap;
    },
  });
  return resourceFromSnapshots(derived);
}

// Uso en componente:
@Component({ ... })
export class ItemListComponent {
  readonly categoryId = input.required<number>();

  // Cuando categoryId cambia, muestra los items anteriores mientras carga los nuevos
  readonly items = withPreviousValue(
    httpResource<Item[]>(() => `/api/items?category=${this.categoryId()}`)
  );
}
```

---

## 3. Abort signals — Cancelación automática de peticiones

```typescript
import { resource } from '@angular/core';

// resource() estándar con abort signal para cancelar fetch nativo
const userResource = resource({
  params: () => ({ id: this.userId() }),
  loader: ({ params, abortSignal }): Promise<User> => {
    // fetch nativo acepta AbortSignal
    return fetch(`/api/users/${params.id}`, { signal: abortSignal })
      .then(res => res.json());
  },
});

// httpResource cancela automáticamente — no necesita configuración manual
const userResource = httpResource<User>(
  () => `/api/users/${this.userId()}`
  // httpResource ya maneja el abort automáticamente
);
```

---

## 4. Resource status — Mostrar estados correctamente en template

```typescript
import { ResourceStatus } from '@angular/core';

// Constantes de estado disponibles:
// 'idle'      — sin parámetros válidos, loader no ha corrido
// 'loading'   — cargando por primera vez (params cambió)
// 'reloading' — recargando (se llamó .reload()), MANTIENE el valor anterior
// 'resolved'  — completado exitosamente
// 'error'     — error en el loader
// 'local'     — valor establecido manualmente via .set()/.update()
```

```html
<!-- Template pattern recomendado para este proyecto -->
@switch (store.resourceStatus()) { @case ('loading') {
<mat-spinner />
} @case ('error') {
<app-error-state [error]="store.error()" (retry)="store.reload()" />
} @case ('idle') {
<app-empty-state message="Realiza una búsqueda" />
} @default {
<!-- 'resolved', 'reloading', 'local' — mostrar datos -->
@if (store.isLoading()) {
<!-- 'reloading' — mostrar datos anteriores con indicador sutil -->
<mat-progress-bar mode="indeterminate" />
}
<app-data-table [items]="store.items()" />
} }
```

---

## 5. `resource()` estándar para operaciones no-HTTP

Para async que no es HTTP (IndexedDB, Web Workers, third-party SDKs):

```typescript
import { resource, signal } from '@angular/core';

// Cargar datos de IndexedDB reactivamente
readonly userId = signal<string | null>(null);

readonly userPreferences = resource({
  params: () => this.userId() ?? undefined, // undefined → idle, no ejecuta loader
  loader: async ({ params: userId, abortSignal }) => {
    return await db.getUserPreferences(userId);
  },
});

// Recargar manualmente
refreshPreferences() {
  this.userPreferences.reload();
}

// Actualizar localmente sin petición (status → 'local')
updateLocalPreference(key: string, value: unknown) {
  this.userPreferences.update(prefs => ({ ...prefs, [key]: value }));
}
```

---

## 6. Trigger explícito (patrón del proyecto ampliado)

El factory `injectWarehouseResource` ya usa este patrón. Aquí la versión simplificada para casos directos:

```typescript
import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';

// Trigger explícito: el resource solo corre cuando hay params
readonly #searchTrigger = signal<SearchParams | null>(null);

readonly searchResults = httpResource<SearchResponse>(
  () => {
    const params = this.#searchTrigger();
    if (!params) return undefined; // undefined → idle, no corre
    return {
      url: '/api/search',
      params: {
        q: params.query,
        page: String(params.page),
        size: String(params.pageSize),
      },
    };
  }
);

search(params: SearchParams): void {
  this.#searchTrigger.set(params);
}
```
