# ADR-010: Shell de ejecución con fachada scoped y componentes de presentación

**Estado:** Aceptado
**Fecha:** 2026-08-21
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

`execution.ts` reunía selección de ensayo, sincronización de ruta, polling, restauración y persistencia de preferencias, diálogos, mutaciones de widgets, estado local de UI y dos bloques de plantilla extensos. Cada cambio de un área exigía tocar el shell completo y los tests de interfaz conocían demasiados detalles de coordinación.

La instancia de `ExecutionStore` debe seguir siendo compartida por todos los widgets de la ruta. En cambio, coordinación de página y estado efímero no deben añadirse a esa store de dominio.

## Decisión

Separar pantalla en tres niveles:

- `Execution` es shell de ruta: obtiene `fireTrialId` mediante `injectParams`, abre selector si falta, expone señales a plantilla y conserva estado local de panel/editor.
- `ExecutionPageFacade` es servicio scoped al shell: concentra datos derivados del store, polling condicionado por `injectPageVisibility`, preferencias, diálogos y acciones de ejecución/guardado. No modifica API pública de `ExecutionStore`.
- `ExecutionHeader` y `WidgetLibrary` son componentes de presentación con signal inputs y outputs semánticos. No inyectan store ni conocen flujo de ejecución.

Contenido remoto de shell sigue patrón de tres estados: skeleton durante carga, `ui-error-state` ante error y grid real con datos válidos.

## Consecuencias

### Positivas

- `execution.ts` se limita a composición de UI y navegación.
- Lógica de coordinación puede probarse aislando fachada y sus dependencias.
- Header y biblioteca pueden evolucionar sin acoplarse a `ExecutionStore`.
- Polling se cancela con ciclo de vida de fachada y no continúa en pestañas ocultas.

### Negativas

- Añade una capa de inyección scoped y contratos de inputs/outputs entre shell y presentación.
- Acciones visibles requieren actualización coordinada de fachada y componente de presentación.

## Referencias

- ADR-003 (Signal Trigger Pattern)
- ADR-006 (Golden Path)
- ADR-007 (Descomposición de `ExecutionStore`)
- ADR-009 (Utilidades signals/router propias)
