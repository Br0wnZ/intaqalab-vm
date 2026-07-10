# SignalStore Avanzado

## Patterns adicionales sobre la base ya establecida en el proyecto

El proyecto ya usa correctamente `withState/withComputed/withMethods/withHooks`. Estos son los patrones
avanzados que faltan.

---

## 1. Miembros privados con `_` prefix

NgRx SignalStore permite marcar miembros como privados (no accesibles desde el componente).

```typescript
import { signalStore, withState, withComputed, withMethods, withHooks } from '@ngrx/signals';

// ❌ Estado de implementación expuesto públicamente
export const MyStore = signalStore(
  withState({
    _page: 0,           // interno, no debería ser público
    _pageSize: 10,      // interno
    items: [] as Item[],
    isLoading: false,
  }),
);

// ✅ CORRECTO: privado con underscore prefix
export const MyStore = signalStore(
  withState({
    items: [] as Item[],
    isLoading: false,
    totalElements: 0,
  }),
  withComputed(({ items, totalElements }) => ({
    isEmpty: computed(() => items().length === 0),
    hasMore: computed(() => items().length < totalElements()),
  })),
  withMethods((store, service = inject(MyService)) => ({
    // La paginación es un detalle de implementación del método
    async loadPage(page: number, size = 10): Promise<void> {
      patchState(store, { isLoading: true });
      const result = await service.getPage(page, size);
      patchState(store, {
        items: result.content,
        totalElements: result.totalElements,
        isLoading: false,
      });
    },
  })),
);
```

---

## 2. `withProps()` para dependencias y valores estáticos

Usa `withProps` para inyectar servicios, tokens o valores estáticos que no son estado reactivo.

```typescript
import { signalStore, withMethods, withProps, withState } from '@ngrx/signals';

export const MyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  // 👇 Inyectar dependencias en el store (no en withMethods para reutilizarlas)
  withProps(() => ({
    service: inject(MyDataService),
    config: inject(APP_CONFIG),
    router: inject(Router),
  })),
  withMethods((store) => ({
    async loadData(): Promise<void> {
      const data = await store.service.fetchAll();
      patchState(store, { items: data });
    },
    navigate(path: string): void {
      store.router.navigate([path]);
    },
  })),
);
```

---

## 3. Custom Store Features (Reutilización)

Cuando varios stores tienen el mismo patrón (ej: paginación, búsqueda), extráelo como feature.

```typescript
// libs/shared/data-access/src/lib/features/with-pagination.feature.ts
import { Signal, computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalElements: number;
}

const paginationInitialState: PaginationState = {
  currentPage: 0,
  pageSize: 20,
  totalElements: 0,
};

export function withPagination() {
  return signalStoreFeature(
    withState(paginationInitialState),
    withComputed(({ currentPage, pageSize, totalElements }) => ({
      totalPages: computed(() => Math.ceil(totalElements() / pageSize())),
      isFirstPage: computed(() => currentPage() === 0),
      isLastPage: computed(() => currentPage() >= Math.ceil(totalElements() / pageSize()) - 1),
      paginationParams: computed(() => ({
        page: currentPage(),
        size: pageSize(),
      })),
    })),
    withMethods((store) => ({
      nextPage(): void {
        if (!store.isLastPage()) {
          patchState(store, ({ currentPage }) => ({ currentPage: currentPage + 1 }));
        }
      },
      prevPage(): void {
        if (!store.isFirstPage()) {
          patchState(store, ({ currentPage }) => ({ currentPage: currentPage - 1 }));
        }
      },
      goToPage(page: number): void {
        patchState(store, { currentPage: page });
      },
      setTotalElements(total: number): void {
        patchState(store, { totalElements: total });
      },
    })),
  );
}

// Uso en un store concreto:
export const StockListStore = signalStore(
  withState({ items: [] as StockItem[], isLoading: false }),
  withPagination(), // 👈 Feature reutilizable
  withMethods((store, service = inject(StockService)) => ({
    async load(): Promise<void> {
      patchState(store, { isLoading: true });
      const result = await service.getPage(store.paginationParams());
      patchState(store, {
        items: result.content,
        isLoading: false,
      });
      store.setTotalElements(result.totalElements);
    },
  })),
);
```

---

## 4. `withEntities()` para stores de entidades CRUD

Usa el plugin de entidades de NgRx para stores que gestionan colecciones.

```typescript
import { signalStore, withHooks, withMethods } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';

export interface MunitionItem {
  id: string; // withEntities necesita una propiedad id
  name: string;
  quantity: number;
}

export const MunitionItemsStore = signalStore(
  withEntities<MunitionItem>(), // 👈 Genera ids(), entities(), entityMap()
  withMethods((store, service = inject(MunitionService)) => ({
    async loadAll(): Promise<void> {
      const items = await service.getAll();
      patchState(store, setAllEntities(items)); // Reemplaza toda la colección
    },
    async add(item: MunitionItem): Promise<void> {
      await service.create(item);
      patchState(store, addEntity(item));
    },
    async remove(id: string): Promise<void> {
      await service.delete(id);
      patchState(store, removeEntity(id));
    },
    async updateQuantity(id: string, quantity: number): Promise<void> {
      await service.updateQuantity(id, quantity);
      patchState(store, updateEntity({ id, changes: { quantity } }));
    },
  })),
  withHooks({
    onInit(store) {
      store.loadAll();
    },
  }),
);

// En el componente/template:
// store.entities()  → Item[]
// store.ids()       → string[]
// store.entityMap() → Record<string, Item>
```

---

## 5. `signalMethod()` — Reactive methods sin RxJS

`signalMethod` de `@ngrx/signals` crea métodos que reaccionan a señales sin necesitar `rxMethod`.

```typescript
import { signalMethod } from '@ngrx/signals';

export const SearchStore = signalStore(
  withState({ query: '', results: [] as Result[], isLoading: false }),
  withMethods((store, service = inject(SearchService)) => ({
    // Reactivo: se re-ejecuta cuando la señal pasada cambia
    search: signalMethod<string>(async (query) => {
      if (!query.trim()) {
        patchState(store, { results: [], isLoading: false });
        return;
      }
      patchState(store, { isLoading: true });
      const results = await service.search(query);
      patchState(store, { results, isLoading: false, query });
    }),
  })),
);

// Uso en componente — pasa la señal del input de búsqueda:
@Component({ providers: [SearchStore] })
export class SearchComponent {
  readonly store = inject(SearchStore);
  readonly searchQuery = signal('');

  constructor() {
    // Se re-ejecuta automáticamente cuando searchQuery cambia
    this.store.search(this.searchQuery);
  }
}
```

---

## 6. Estado de Store con `asReadonly()` exposed desde servicios

Cuando un servicio expone estado derivado de httpResource, usar asReadonly().

```typescript
@Injectable()
export class MyDataService {
  readonly #resource = httpResource<Item[]>(() => '/api/items');

  // ✅ Exponer readonly signals del resource
  readonly items: Signal<Item[]> = computed(() => this.#resource.value() ?? []);
  readonly isLoading = this.#resource.isLoading.asReadonly?.() ?? this.#resource.isLoading;
  readonly error = this.#resource.error;

  // El trigger de búsqueda es writable (internal writeable, exposed for stores)
  readonly #searchParams = signal<SearchParams | null>(null);
  readonly searchParams = this.#searchParams.asReadonly();

  setSearch(params: SearchParams): void {
    this.#searchParams.set(params);
  }
}
```
