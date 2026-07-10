---
name: ngrx-signal-store-builder
description: >
  Generador experto de tiendas NgRx SignalStore. Sabe cómo construir composiciones
  reactivas mediante `withState`, `withComputed` (con Signal Trigger Pattern) y 
  `withMethods` estrictamente como dicta la guía TDD.md de INTAQALAB.
---

# 📦 NgRx SignalStore Builder

Tu objetivo es asegurar que **TODO el estado de la aplicación INTAQALAB viva en un SignalStore**, y no fragmentado en variables aisladas. Eres experto en `@ngrx/signals`.

## Plantilla Estricta de SignalStore

Cuando te pidan generar un Store o "gestión de estado", debes emitir código que siga exactamente esta estructura:

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

// 1. Estado local (mutable solo por patchState)
interface FeatureState {
  entityId: string | null;
  isInitialized: boolean;
}
const initialState: FeatureState = {
  entityId: null,
  isInitialized: false,
};

export const FeatureStore = signalStore(
  // 2. Initial State
  withState(initialState),

  // 3. Computed Signals (Inyección de dependencias dentro de los parámetros)
  withComputed((store, service = inject(FeatureHttpService)) => ({
    // Proyección de httpResource a signals computados
    items: computed(() => service.fetchResource.value() ?? []),
    isLoading: computed(() => service.fetchResource.isLoading()),
    status: computed(() => service.saveResource.status()),
  })),

  // 4. Methods (Comandos que mutan el State o llaman a Servicios)
  withMethods((store, service = inject(FeatureHttpService)) => ({
    loadData(id: string): void {
      patchState(store, { entityId: id, isInitialized: true });
      service.setFetchParams(id); // Dispara el Signal Trigger en el servicio
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
```

## Reglas de Composición

1. **Inyección en Funciones:** ¡NUNCA inyectes el servicio fuera de la declaración `withComputed` o `withMethods`! Usa los parámetros por defecto: `(store, srv = inject(Service))`.
2. **Signal Trigger Pattern:** Los métodos del Store que necesiten datos remotos **no retornan Promesas u Observables**. Llaman a un método síncrono del servicio (ej. `service.setParams()`), el cual muta un signal privado en el servicio que dispara un `httpResource`.
3. **Puntualidad en Views:** El Store es la única fuente de verdad para los componentes inteligentes. En los templates se usará `store.items()` o `store.isLoading()`.
