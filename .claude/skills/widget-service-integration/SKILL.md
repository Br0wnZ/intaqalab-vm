---
name: widget-service-integration
version: 1.4.0
last-updated: 2026-11-05
description: Integrates INTAQALAB execution widgets with APIs and stores, including series and shot selectors and load/save flows.
argument-hint: "Número de widget y nombre (ej: '20 — Munition Introduction'). Opcionalmente, ruta del JSON de Swagger."
tools: [read, edit, search, execute, todo, agent]
---

# Widget Service Integration — Intaqalab Standard

Patrón canónico para conectar un widget del execution grid a sus endpoints GET y PUT de la API.
Referencia de producción: **Widget 20 — `MunitionIntroduction`**.

> [!IMPORTANT]
>
> - **Lee la skill `execution-domain-expert`** antes de empezar para dominar la arquitectura del grid y ADR-025.
> - **Lee `signal-trigger-pattern`** para el patrón `httpResource` + trigger privado en lecturas.
> - **Separación CQS (ADR-020):** `httpResource` solo para queries (GET); `HttpClient` directo para mutaciones (PUT/POST).
> - **Descomposición de Servicios (ADR-025):** `ExecutionService` está `@deprecated` (fachada temporal con 0 consumidores en producción). **PROHIBIDO** inyectarlo o añadirle métodos. Todo acceso a datos de disparo pertenece a servicios dedicados en `libs/domain/trial/execution/src/lib/data-access/execution/shot/` (`ShotVelocitiesService`, `ShotMunitionService`, etc.), exportados en `data-access/index.ts`.
> - **URLs y Await Puros:** Construir URLs con `executionTrialUrl` (`data-access/execution/shared/execution-endpoints.ts`) y fetch imperativo con `awaitResourceValue` (`data-access/execution/shared/resource-await.ts`).
> - **PROHIBIDO EL USO DE `any` y `!`:** Todo debe estar tipado estrictamente con enums (`DistanceUnitEnum`, `TimeUnitEnum`). Prohibido `as any` o non-null assertions (`!`).

---

## 🗺️ Rutas Clave

| Artefacto                     | Ruta                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| Swagger API                   | `apis/execution-api.json`                                              |
| Domain Data-Access Services   | `libs/domain/trial/execution/src/lib/data-access/execution/`           |
| Shot Services                 | `libs/domain/trial/execution/src/lib/data-access/execution/shot/`      |
| Data-Access Index             | `libs/domain/trial/execution/src/lib/data-access/index.ts`             |
| ExecutionService (DEPRECATED) | `libs/domain/trial/execution/src/lib/services/execution.service.ts`    |
| ExecutionStore                | `libs/domain/trial/execution/src/lib/+state/execution.store.ts`        |
| State models                  | `libs/domain/trial/execution/src/lib/+state/execution-state.models.ts` |
| Modelos de dominio            | `libs/domain/trial/execution/src/lib/execution/models/`                |
| Widget dir                    | `libs/domain/trial/execution/src/lib/execution/widgets/<widget-name>/` |
| Mock server store             | `mocks/src/fixtures/execution/execution-store.ts`                      |
| Mock fixture JSON             | `mocks/src/fixtures/execution/<fixture-name>.json`                     |
| Mock routes                   | `mocks/src/routes/execution/`                                          |
| i18n ES                       | `apps/intaqalab/public/i18n/es.json`                                   |

---

## 📋 Checklist de Implementación Progresiva

Sigue cada paso consultando su guía de referencia correspondiente:

- [ ] **Paso 0 — Verificar datos de planificación/almacén por disparo (ADR-019)**: Si el widget requiere munición o componentes planificados, consulta [references/07-domain-integration.md](references/07-domain-integration.md).
- [ ] **Paso 1 — Leer Swagger e identificar endpoints**: Localiza `GET` y `PUT` de serie/disparo en `apis/execution-api.json`. Guía: [references/01-service-and-models.md](references/01-service-and-models.md).
- [ ] **Paso 2 — Modelos TypeScript de Request/Response**: Define DTOs en `execution/models/<widget-resource>.models.ts` y expórtalos en `execution/models/index.ts`. Guía: [references/01-service-and-models.md](references/01-service-and-models.md).
- [ ] **Paso 3 — Servicio de Dominio en `data-access/execution/` (ADR-025)**: Crear o extender `shot/shot-<resource>.service.ts` con URLs puras (`executionTrialUrl`), `httpResource` para GET, `awaitResourceValue` para fetch imperativo, y `HttpClient` + `firstValueFrom` para PUT (ADR-020). Re-exportar en `data-access/index.ts`. PROHIBIDO añadir métodos a `ExecutionService`. Guía: [references/01-service-and-models.md](references/01-service-and-models.md).
- [ ] **Paso 4 — Feature Store NgRx**: Define estados en `execution-state.models.ts` y crea `features/with-<widget>.ts`. Guía: [references/02-feature-store.md](references/02-feature-store.md).
- [ ] **Paso 5 — Mapper bidireccional**: Crea `<widget>.mapper.ts` resolviendo IDs Calibry (número ↔ string UI). Guía: [references/03-bidirectional-mapper.md](references/03-bidirectional-mapper.md).
- [ ] **Paso 6 — Widget Padre**: Extiende `BaseFormWidgetComponent`, inyecta el servicio de dominio específico (`Shot<Resource>Service`), implementa `saveForm()`, selection guard y dirty tracking compuesto. Guía: [references/04-parent-widget-and-tabs.md](references/04-parent-widget-and-tabs.md).
- [ ] **Paso 7 — Tabs Hijas**: Implementa contrato `{ isDirty, isValid, getFormUpdates(), applyData(), save(), reset() }` con `createDirtyTracker`. Guía: [references/04-parent-widget-and-tabs.md](references/04-parent-widget-and-tabs.md).
- [ ] **Paso 8 — Mocks Express Coherentes**: Actualiza fixtures JSON y rutas en mock server aceptando estados `['PENDING', 'ACTIVE', 'FIRED']`. Guía: [references/05-mock-server-fixtures.md](references/05-mock-server-fixtures.md).
- [ ] **Paso 9 — Tests Vitest + ATL**: Verifica el widget padre con testing harness mockeando `Shot<Resource>Service` (NUNCA `ExecutionService`). Guía: [references/06-vitest-testing.md](references/06-vitest-testing.md).

---

## 🚫 Anti-patrones Críticos

| ❌ NUNCA                                                          | ✅ SIEMPRE                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `inject(ExecutionService)` o añadir métodos a `ExecutionService`  | Inyectar servicio específico (`Shot<Family>Service`) desde `data-access`       |
| Construir URLs con strings manuales (`${executionUrl}/...`)       | Usar `executionTrialUrl` de `data-access/execution/shared/execution-endpoints` |
| `TestBed.inject(ExecutionService)` en specs de widgets o features | Mockear e inyectar el servicio específico (`Shot<Family>Service`)              |
| `override ngOnInit()` en el widget padre                          | `BaseFormWidgetComponent.ngOnInit()` ya registra la instancia                  |
| `effect(() => signal.set(...))` sin `untracked()`                 | `effect(() => { untracked(() => signal.set(...)) })`                           |
| `applyData()` sin `#dirtyTracker.syncSnapshot()`                  | Sincronizar snapshot al final de `applyData()` (evita dirty espurio)           |
| `save()` en tab sin `#dirtyTracker.syncSnapshot()`                | Sincronizar snapshot al final de `save()`                                      |
| Fixture JSON con IDs de balanza/cámara desconocidos               | Usar `21031`/`21032`/`21045`/`21046` según el mapeo bidireccional              |
| Mock PUT que rechaza status `PENDING`                             | Aceptar `['PENDING', 'ACTIVE', 'FIRED']`                                       |
| `isDirty` basado en los selectores de serie/disparo               | `isDirty` = OR de los `isDirty()` de las tabs de datos                         |
| `this.#service.fetch<Resource>()` directo en constructor          | Usar `effect()` con `#lastLoadedActiveSelection` para idempotencia             |
| Opciones del store con IDs numéricos                              | Opciones con strings descriptivos (`'bal-01'`); mapper hace la conversión      |
| Tabs con `@if`/`@switch`                                          | Tabs con `[class.hidden]` para preservar el estado interno                     |

---

## 🔄 Flujo E2E Sintético

```
[Usuario selecciona disparo] → onDisparoSelected() → Shot<Resource>Service.fetch<Resource>()
   ↓
#applyRemoteShotData(response) → mapper.mapRemoteToState() → tabs.applyData() + syncSnapshot()
   ↓
[Usuario edita campos en tabs] → isDirty() === true → WidgetStateService detecta widget dirty
   ↓
[Usuario pulsa Guardar] → saveAllDirtyForms() → <Widget>.saveForm()
   ↓
mapper.mapStateToRequest() → Shot<Resource>Service.update<Resource>() (PUT) → tabs.save() + syncSnapshot()
```
