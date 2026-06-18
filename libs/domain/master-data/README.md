# INTAQALAB Golden Path: Master Data

> [!IMPORTANT]
> **ATENCIÓN AGENTES IA Y DESARROLLADORES:** Esta carpeta (`libs/domain/master-data`) es la **implementación de referencia (Golden Path)** del repositorio INTAQALAB.
> 
> Todo nuevo código, módulo o refactorización que construyas debe usar **estrictamente** los mismos patrones arquitectónicos que se demuestran aquí. No importes código de otros módulos como referencia si contradice lo que está aquí.

## Patrones Aprobados (Cero Deuda Técnica)

### 1. Zero RxJS en Componentes UI
- **Regla:** Queda **PROHIBIDO** el uso de `.subscribe()` dentro de componentes Angular 21+. 
- **Patrón:** Para flujos asíncronos como el cierre de un MatDialog, se utiliza `await firstValueFrom(...)` en funciones marcadas como `async`.
- **Referencia:** Ver `createRecord()` en `master-data-list.component.ts`.

### 2. Signal Trigger Pattern + httpResource
- **Regla:** Nada de `HttpClient` tradicional ni RxJS `switchMap` en los Stores para obtener datos.
- **Patrón:** Todo el fetching de datos se delega a una factoría pura basada en señales inyectables (`httpResource`), que reactiva automáticamente las peticiones ante el cambio de variables derivadas.
- **Referencia:** Ver `injectMasterDataResource` en `master-data-resource.factory.ts`.

### 3. NgRx SignalStore
- **Regla:** El estado global / de feature se maneja exclusivamente con `@ngrx/signals`.
- **Patrón:** Evitamos RxJS puro, usamos `withState`, `withComputed` y `withMethods`. Mantenemos los stores limpios y sin inyecciones innecesarias (las dependencias se inyectan en los argumentos de las funciones del store).
- **Referencia:** Ver `master-data.store.ts`.

### 4. Component Harnesses para Testing
- **Regla:** Queda **PROHIBIDO** realizar aserciones de testing basadas en el DOM profundo de Angular Material (`querySelector('.mat-row')`, etc).
- **Patrón:** Se usa `TestbedHarnessEnvironment` junto a los Component Harnesses oficiales (ej: `MatTableHarness`, `MatButtonHarness`) para aserciones semánticas robustas.
- **Referencia:** Ver `master-data-list.component.spec.ts`.

---
*Este documento y su implementación están alineados 100% con el `TDD.md` y `AGENTS.md` del repositorio para Angular 21 (Zoneless, Signals-first).*
