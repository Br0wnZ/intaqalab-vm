# ADR-016: Arquitectura de asignación de equipos de ensayo y consumo en widgets

**Estado:** Aceptado  
**Fecha:** 2026-10-09  
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

El proceso de ejecución de ensayos de fuego (especificación funcional 4.3) requiere vincular instrumentos de medida de Calibry a series y disparos específicos. Los widgets del panel de ejecución (p. ej. Acondicionamiento de munición, Sensores piezoeléctricos, Radar doppler) deben alimentarse directamente de los equipos asignados para restringir y autocompletar sus opciones operativas.

Esta feature presenta varios retos arquitectónicos:

1. **Doble ciclo de vida:** El diálogo de selección requiere gestión de estado tabular temporal, validación de filas incompletas, ordenación y paginación antes de confirmar. No debe contaminar el estado global de ejecución con borradores no guardados.
2. **Dependencia cruzada con Planificación:** La visibilidad y habilitación de familias de equipos depende del catálogo de medidas planificadas en el ensayo (`GET /measures`), pero la ejecución corre en su propio dominio `libs/domain/trial/execution`.
3. **Control de acceso estricto (RBAC por Unidad Técnica):** Los roles de unidades técnicas (Balística, Armamento, Municiones, Topografía) sólo pueden visualizar y editar sus familias correspondientes.
4. **Propagación reactiva a widgets:** Al guardar mediante `PUT /equipment-selection`, las asignaciones deben persistirse en backend y actualizarse de inmediato en la store compartida (`ExecutionStore`) para que cualquier widget del grid consuma las selecciones reactivamente vía Signals.

## Decisión

Se adopta una **arquitectura desacoplada en dos capas de estado** con sincronización automática:

### 1. Capa de Edición Local: `EquipmentSelectorStore` (Diálogo)

- Store dedicado con `signalStore` provisto a nivel de componente (`EquipmentSelectorDialog`). Su ciclo de vida nace y muere con el modal.
- Inyecta `EquipmentPlanningService` (servicio con `httpResource` y Signal Trigger Pattern) para resolver las medidas planificadas del ensayo y cruzarlas con el catálogo de magnitudes.
- **Regla de visibilidad estricta:** `visibleTags` es una señal computada que devuelve la intersección entre las familias autorizadas para el rol del usuario (`resolveVisibleEquipmentTags`) y las planificadas para el ensayo (`enabledTagIds`). Las etiquetas no planificadas o no autorizadas **no se renderizan** en la interfaz (cero chips deshabilitados).
- Al confirmar ("Guardar"), el diálogo emite únicamente el resultado limpio `{ action: 'save', equipments: EquipmentMagnitudeSelectionGroup[] }`.

### 2. Capa de Estado Persistente Global: `ExecutionStore` (`withEquipmentSelector`)

- `withEquipmentSelector` gestiona las asignaciones confirmadas en la store raíz de ejecución.
- La fachada de la página (`ExecutionPageFacadeService`) recibe el evento de cierre del diálogo e invoca `store.updateEquipmentSelections(equipments)`.
- `updateEquipmentSelections` realiza la mutación `PUT /equipment-selection` a través de `ExecutionService` y actualiza inmediatamente el estado local (`patchState`) para evitar esperas en la UI.
- Un `effect` escucha el estado del recurso `updateEquipmentSelectorResource`: al transicionar a `resolved`, re-ejecuta `getEquipmentSelector(fireTrialId)` para garantizar coherencia con el backend.
- El store expone `equipmentSelector().selections` (array plano para filtrado rápido por `series`/`disparos`/`categoryId`) y `equipmentSelector().equipments` (array agrupado).

### 3. Consumo en Widgets de Ejecución

- Los widgets inyectan privadamente `readonly #store = inject(ExecutionStore)`.
- Consumen `this.#store.equipmentSelector().selections` mediante `computed()` para filtrar equipos asignados a la serie y disparo activos (`activeSerieId`, `activeShotId`).

## Consecuencias

### Positivas

- **Aislamiento de borradores:** Las ediciones no guardadas nunca tocan el estado global ni alteran los widgets en tiempo real mientras el diálogo está abierto.
- **Consistencia reactiva (Zoneless + Signals):** Los widgets reaccionan inmediatamente a los cambios de asignación sin suscripciones RxJS ni polling manual.
- **Seguridad y ergonomía (RBAC):** La interfaz muestra exclusivamente los tags relevantes para el rol del usuario y el ensayo actual, eliminando ruido visual de opciones no aplicables.
- **Alineación con el Golden Path:** Implementado siguiendo `httpResource`, `signalStoreFeature`, standalone components y cero `any`/non-null assertions (`!`).

### Negativas

- Añade un servicio de datos adicional (`EquipmentPlanningService`) en el dominio de ejecución para conectar con los endpoints de planificación.
- Requiere mapeo bidireccional entre la estructura de UI (`TagTableState`) y el DTO de la API (`EquipmentSelectionApiList`).

## Referencias

- `docs/WIDGET_SYSTEM.md`
- `libs/domain/trial/execution/src/lib/execution/dialogs/equipment-selector.store.ts`
- `libs/domain/trial/execution/src/lib/+state/features/equipment-selector.feature.ts`
- ADR-003: Signal Trigger Pattern
- ADR-007: Descomposición de ExecutionStore en features
- ADR-010: Execution Page Shell Facade
