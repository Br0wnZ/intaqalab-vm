# Capa de SignalStore (`+state/`)

Los stores son la fuente de verdad para los componentes. Usan `signalStore` de `@ngrx/signals` y NUNCA hacen peticiones HTTP directamente — siempre delegan al servicio correspondiente.

## Patrón Arquitectónico

```
Component → Store.method() → Service.method() → signal.set() → httpResource fetch
                ↑                                                        |
                └────── Store.computed ← Service.resource.value() ←──────┘
```

## Estructura Base

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

interface <Entity>State {
  isInitialized: boolean;
}

const initialState: <Entity>State = {
  isInitialized: false,
};

export const <Entity>Store = signalStore(
  withState(initialState),
  withComputed((store, service = inject(<Entity>Service)) => ({ ... })),
  withMethods((store, service = inject(<Entity>Service)) => ({ ... })),
  withHooks({ onDestroy(store) { store.reset(); } }),
);

export type <Entity>StoreType = InstanceType<typeof <Entity>Store>;
```

## Ejemplo Real: Store Simple (GET + PUT)

Archivo: `libs/domain/trial/planning/src/lib/+state/armament.store.ts`

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type {
  ArmamentBulkUpdateRequest,
  CatalogQueryParams,
  SeriesArmamentData,
  SpecimenItem,
} from '../services/armament-service';
import { ArmamentService } from '../services/armament-service';
import { PlanningGeneralDataStore } from './planning-general-data.store';

interface ArmamentState {
  isInitialized: boolean;
}

const initialState: ArmamentState = {
  isInitialized: false,
};

export const ArmamentStore = signalStore(
  withState(initialState),

  withComputed(
    (store, armamentService = inject(ArmamentService), planningStore = inject(PlanningGeneralDataStore)) => ({
      fireTrialId: computed(() => planningStore.fireTrialId()),

      armamentResponse: computed(() => armamentService.armamentResource.value()),

      seriesArmament: computed<SeriesArmamentData[] | undefined>(() => {
        const response = armamentService.armamentResource.value();
        return response?.series;
      }),

      isLoadingArmament: computed(() => armamentService.armamentResource.isLoading()),
      armamentError: computed(() => armamentService.armamentResource.error()),
      hasArmamentError: computed(() => armamentService.armamentResource.error() !== null),

      updateArmamentStatus: computed(() => armamentService.updateArmamentResource.status()),
      isUpdatingArmament: computed(() => armamentService.updateArmamentResource.isLoading()),
      updateArmamentError: computed(() => armamentService.updateArmamentResource.error()),

      weapons: computed<SpecimenItem[]>(() => {
        const response = armamentService.weaponsResource.value();
        return response?.items ?? [];
      }),

      isLoadingWeapons: computed(() => armamentService.weaponsResource.isLoading()),

      tubes: computed<SpecimenItem[]>(() => {
        const response = armamentService.tubesResource.value();
        return response?.items ?? [];
      }),

      isLoadingTubes: computed(() => armamentService.tubesResource.isLoading()),

      isLoading: computed(
        () =>
          armamentService.armamentResource.isLoading() ||
          armamentService.updateArmamentResource.isLoading() ||
          armamentService.weaponsResource.isLoading() ||
          armamentService.tubesResource.isLoading(),
      ),
    }),
  ),

  withMethods((store, armamentService = inject(ArmamentService), planningStore = inject(PlanningGeneralDataStore)) => ({
    loadArmament(): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        armamentService.getArmament(trialId);
        patchState(store, { isInitialized: true });
      }
    },
    reloadArmament(): void {
      armamentService.armamentResource.reload();
    },
    updateArmament(request: ArmamentBulkUpdateRequest): void {
      const trialId = planningStore.fireTrialId();
      if (trialId) {
        armamentService.updateArmament(trialId, request);
      }
    },
    resetUpdateArmament(): void {
      armamentService.resetUpdateArmament();
    },
    loadWeapons(params: CatalogQueryParams = {}): void {
      armamentService.getWeapons(params);
    },
    loadTubes(params: CatalogQueryParams = {}): void {
      armamentService.getTubes(params);
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type ArmamentStoreType = InstanceType<typeof ArmamentStore>;
```

## Ejemplo Real: Store con Búsqueda y Paginación (Warehouse)

Archivo: `libs/domain/wharehouse-managment/src/lib/+state/stock-list.store.ts`

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import type { MunitionStockListSearch } from '../models/munition-stock-list.model';
import { MunitionsStockListService } from '../services/munitions-stock-list.service';

interface StockListStoreState {
  isInitialized: boolean;
  currentSearch: MunitionStockListSearch;
  emptyList: boolean;
}

const initialState: StockListStoreState = {
  isInitialized: false,
  currentSearch: {},
  emptyList: false,
};

export const StockListStore = signalStore(
  withState(initialState),

  withComputed((store, service = inject(MunitionsStockListService)) => ({
    items: computed(() => {
      if (store.emptyList()) return [];
      const response = service.paginatedResponse.value();
      return response?.items ?? [];
    }),
    totalElements: computed(() => {
      const response = service.paginatedResponse.value();
      return response?.totalElements ?? 0;
    }),
    isLoading: computed(() => service.paginatedResponse.isLoading()),
    error: computed(() => service.paginatedResponse.error()),
    hasError: computed(() => service.paginatedResponse.error() !== null),
  })),

  withMethods((store, service = inject(MunitionsStockListService)) => ({
    search(criteria: MunitionStockListSearch): void {
      patchState(store, { currentSearch: criteria, emptyList: false });
      service.searchItems.set(criteria);
    },
    pagination(start: number, size: number): void {
      const searchCriteria: MunitionStockListSearch = {
        page: start,
        pageSize: size,
        ...store.currentSearch(),
      };
      service.searchItems.set(searchCriteria);
    },
    sortTable(sortField: string, sortDirection: string): void {
      const searchCriteria: MunitionStockListSearch = {
        ...store.currentSearch(),
        page: 0,
        sortDirection,
        sortField,
      };
      service.searchItems.set(searchCriteria);
    },
    reload(): void {
      service.paginatedResponse.reload();
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),

  withHooks({
    onDestroy(store) {
      store.reset();
    },
  }),
);

export type StockListStoreType = InstanceType<typeof StockListStore>;
```

## Computed Signals: Qué Exponer

Para cada httpResource del servicio, el store debe exponer:

| Resource Signal | Store Computed | Uso |
|----------------|---------------|-----|
| `resource.value()` | `items`, `data`, etc. | Datos procesados para el template |
| `resource.isLoading()` | `isLoading` | Spinners, skeleton loaders |
| `resource.error()` | `error`, `hasError` | Mensajes de error |
| `resource.status()` | `createStatus`, `updateStatus` | Reaccionar a completado/fallido |

## Reglas Clave

1. **El Store NUNCA hace HTTP** — Siempre delega al Service
2. **`withState`** — Solo estado local (isInitialized, currentSearch, flags de UI)
3. **`withComputed`** — Expone signals derivados del servicio con `computed()`
4. **`withMethods`** — Llama a métodos públicos del servicio + `patchState` para estado local
5. **`withHooks`** — Siempre implementar `onDestroy` → `store.reset()`
6. **`patchState(store, initialState)`** — Limpieza de estado en el reset
7. **Dependencias entre stores** — Si necesitas datos de otro store (ej: `fireTrialId`), inyéctalo como parámetro extra en `withComputed` y `withMethods`
8. **Type alias** — Siempre exportar `export type <Store>Type = InstanceType<typeof <Store>>;`
