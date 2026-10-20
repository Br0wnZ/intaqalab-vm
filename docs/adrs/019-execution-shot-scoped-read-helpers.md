# ADR-019: Execution Shot-Scoped Planning and Warehouse Read Helpers

**Estado:** Aceptado
**Fecha:** 2026-10-20
**Autores:** INTAQALAB Architecture Team

## Contexto

En el dominio de ejecución de ensayos de tiro (`libs/domain/trial/execution`), múltiples widgets (como `munition-introduction`, `trayectografia-introduction`, `piezo-pressure-introduction`, etc.) requieren consultar configuraciones planificadas para el disparo activo (por ejemplo componentes de munición, tipo de munición, espoletas, denominaciones) y cruzarlas con los catálogos de stock y denominaciones del almacén (`Warehouse API`).

Hasta el momento, estas consultas presentaban los siguientes retos:

1. **Respeto a ADR-017:** La lectura de datos de planificación (`/planning/...`) no debe declarar endpoints directos dentro de `trial/execution`, sino consumir exclusivamente `@intaqalab/data-access-planning` (`TrialsDataService`).
2. **Polimorfismo e inconsistencias de esquema:** Los payloads JSON de planificación y almacén pueden variar según el centro o versión (ej. `seriesId` vs `id`, `munitionType` como objeto con `{ id, name }` o `munitionTypeId` plano, `componentType` vs `munitionType`, `denomination` anidada o ID directo).
3. **Comportamiento reactivo por disparo:** Cada disparo de una serie puede tener componentes y denominaciones planificadas diferentes. Al cambiar el disparo o la serie seleccionada, las opciones de componentes, denominaciones y lotes deben actualizarse reactivamente sin estados residuales o efectos colaterales descontrolados.
4. **Respaldo de Almacén:** Cuando la planificación no fija una denominación o lote concreto, el widget debe listar todas las denominaciones y lotes disponibles en el almacén para el tipo de componente seleccionado, y si la planificación sí fijó un lote que no existe físicamente en stock, este debe seguir siendo visible como opción planificada fuera de stock (`inStock: false`).

## Decisión

Se ha implementado una capa desacoplada y fuertemente tipada de lectores defensivos y helpers reactivos (`inject*`) bajo `libs/domain/trial/execution/src/lib/data-access`:

1. **Lectores defensivos sin `any` (`unknown-readers.ts`):** Funciones puras con type-guards para leer cadenas, números, listas y registros polimórficos de forma segura (`readString`, `readNumber`, `readNestedId`, `readRecord`, `readArray`).
2. **Normalizadores y Selectores de Planificación (`planning-munition.normalizer.ts`, `shot-munition.selectors.ts`):** Normalizan los datos recibidos de `TrialsDataService.getMunitionsPlanning()` resolviendo discrepancias de nomenclatura (`seriesId`, `munitionTypeId`, `componentTypeId`, `isFuse`). Proporcionan selectores reactivos como `selectShotMunitionComponents()` y `selectPlannedMunitionForShot()`.
3. **Integración con Almacén (`warehouse.normalizers.ts`, `warehouse-endpoints.ts`):** Adaptan los catálogos y stock físico de `/centers/{centerId}/warehouse/...`, fusionando las opciones de almacén con las opciones planificadas.
4. **Helpers Reactivos basados en `httpResource` y Signals Angular 21:**
   - `injectMunitionTypes()`: Carga los tipos de munición del catálogo del almacén.
   - `injectShotMunitionComponents()`: Proporciona las opciones de componentes para el disparo seleccionado.
   - `injectComponentDenominations()`: Proporciona las denominaciones válidas del almacén para el componente activo, preservando la denominación planificada.
   - `injectDenominationBatches()`: Proporciona los lotes físicos disponibles para la denominación activa, manteniendo el lote planificado si procede.
5. **Adopción Piloto en `MunitionIntroduction`:**
   - Migración de `MunitionIdentificacionTabComponent`, `MunitionPesosTabComponent` y `MunitionAcondicionamientoTabComponent` para consumir `componenteOptions = input<ShotMunitionComponentOption[]>()`.
   - Vinculación reactiva de denominaciones y lotes sin dependencias acopladas ni `any`/`!`.

## Consecuencias

### Positivas

- **Cumplimiento estricto de ADR-017:** Cero URLs de `/planning/...` en `trial/execution`. Validado automáticamente por `npm run check:planning-urls`.
- **Reutilización transversal:** Cualquier widget en `execution/widgets` (`trayectografia`, `piezo-pressure`, etc.) puede inyectar `injectShotMunitionComponents` o `injectComponentDenominations` directamente.
- **Tipado estricto:** 100% libre de `any` y `!`.
- **Zoneless nativo:** Reactividad pura con `computed`, `input`, y `httpResource`.

### Negativas / Consideraciones

- Los tests unitarios con `httpResource` en entorno Zoneless requieren iteraciones asíncronas controladas (`await Promise.resolve()`, `TestBed.tick()`) y vaciado exhaustivo de peticiones pendientes en `HttpTestingController`.
