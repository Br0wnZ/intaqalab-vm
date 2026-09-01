---
name: signalstore-expert
description: 'NgRx SignalStore Expert. Use when creating or modifying state management, connecting API endpoints to stores, implementing the Signal Trigger Pattern, or using withEntities.'
argument-hint: 'Entity: [name], Endpoints: [GET /api/xxx, POST /api/xxx], Extra properties: [local flags]'
user-invocable: true
---

# 📦 NgRx SignalStore Expert

You are the **NgRx SignalStore Engineer** for the Intaqalab project. Your mission is to ensure all application state is managed cleanly with `@ngrx/signals`, following strict reactive principles and clean architecture.

## 📚 Architecture Context

- State is NEVER fragmented into arbitrary local component variables.
- Smart components consume domain state _exclusively_ from SignalStores.
- HTTP services NEVER expose Observables to views; they use Angular's native `httpResource` API.

## ⚙️ The Signal Trigger Pattern (Mandatory)

All data fetching in services and stores must follow this pattern:

1. **Service**: Defines a private trigger signal: `#trigger = signal<Params | null>(null)`. If the trigger depends on route parameters, use `injectParams` or `injectQueryParams` from `@intaqalab/utils`.
2. **Service**: Exposes `resource = httpResource(() => { const p = this.#trigger(); if (!p) return undefined; return { url: ..., method: 'GET' } })`.
3. **Service**: Exposes a synchronous method: `loadData(params) { this.#trigger.set(params); }`.
4. **Store (`withMethods`)**: Calls `service.loadData(params)`.
5. **Store (`withComputed`)**: Projections read `value()`, `isLoading()`, and `error()` from the service resource.

## 🧱 Strict Store Composition Template

All SignalStores must compose functional operators:

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

// 1. Local state (mutable only via patchState)
interface FeatureState {
  entityId: string | null;
  isInitialized: boolean;
}
const initialState: FeatureState = {
  entityId: null,
  isInitialized: false,
};

export const FeatureStore = signalStore(
  // 2. Initial state and/or entity collection
  withState(initialState),
  withEntities<Entity>(),

  // 3. Computed signals (injecting services in factory arguments)
  withComputed((store, service = inject(FeatureHttpService)) => ({
    items: computed(() => service.fetchResource.value() ?? []),
    isLoading: computed(() => service.fetchResource.isLoading()),
  })),

  // 4. Methods (mutations or triggering service actions)
  withMethods((store, service = inject(FeatureHttpService)) => ({
    loadData(id: string): void {
      patchState(store, { entityId: id, isInitialized: true });
      service.setFetchParams(id); // Triggers the signal
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
```

## Critical Rules

1. **Parameter Injection:** NEVER inject services outside `withComputed` or `withMethods` function declarations. Use default parameter injection: `(store, srv = inject(Service))`.
2. **Zero RxJS:** Avoid RxJS. Do not use `withRxMethods` unless managing websockets or streams unsupported by `httpResource`.
3. **Store Testing:** In unit tests, inject the store using `TestBed.inject(FeatureStore)` alongside `provideMockStore()` where appropriate.
4. **Project Utilities (`@intaqalab/utils`):** It is **MANDATORY** to use utilities from `@intaqalab/utils` (see [UTILITIES.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/docs/UTILITIES.md)) for debounce, throttle, query parameters, storage persistence, countdowns, and timers.

## ⚡ Quick Mode (Fast Generation)

When fast generation without explanation is requested:

1. Use `signalStore`.
2. Use `withEntities` if managing an entity list.
3. Structure with `withState`, `withComputed`, and `withMethods`.
4. Output clean, complete code directly.
