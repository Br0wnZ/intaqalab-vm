# ADR-029: Query param `revision` en los GET de planning

**Estado:** Aceptado
**Fecha:** 2026-11-20
**Autores:** Equipo INTAQALAB

## Contexto

El backend expone `?revision=baseline|execution` en los GET `planning/info`, `planning/series`, `planning/conditions`, `planning/munitions`, `planning/armament` y `planning/measures` (ver `apis/planning-changes-openapi.json`). `baseline` (valor por defecto del backend) devuelve la planificación base sin cambios; `execution` devuelve la base más los cambios `ACCEPTED` aplicados desde ejecución. Todos los GET de planning lanzados desde Execution deben pedir `execution`. La vista de planificación normal pide `baseline`.

Los servicios de la lib `planning` y de `@intaqalab/data-access-planning` son `@Service()` root: un provider de ruta o de componente (p. ej. el diálogo "Modificar planificación") no los alcanza.

## Decisión

1. Tipo único `PlanningRevision` (`'baseline' | 'execution'`) y helper puro `planningRevisionParams(revision)` en `@intaqalab/data-access-planning`; los GET usan la opción `params` de `httpResource` (sin concatenar querystring).
2. **`data-access-planning`** (capa de lectura de Execution, ADR-017): token `PLANNING_REVISION` (`providedIn: 'root'`, valor por defecto `'execution'`). Todas sus queries envían `revision` explícito. Un consumidor distinto sobrescribe el token.
3. **Lib `planning`**: la revisión es estado de `PlanningGeneralDataStore` (`revision`, `setRevision`), derivada del modo del shell (`PLANNING_REVISION_BY_SHELL_MODE`: `planning → baseline`, `execution-modification → execution`). Los stores secundarios la leen del store padre y los servicios la reciben como argumento obligatorio, de modo que toda llamada declara su origen (trazabilidad y testeo). El shell fija la revisión antes de la primera carga.
4. `PlanningModificationsService`: `currentConditionsResource` → `execution`; `baselineConditionsResource` → `baseline`.
5. Mocks: `resolveRevision(req)` (fallback a `baseline` ante un valor ausente o inválido) y proyectores puros que aplican los cambios `ACCEPTED` del `planning-changes-store` sobre una copia del dato baseline. `series` y `measures` no tienen cambios asociados y devuelven lo mismo en ambas revisiones.
6. `scripts/check-planning-urls.mjs` valida que toda query de `data-access-planning` sobre estos endpoints use `planningRevisionParams`.

Las mutaciones (PUT/POST/PATCH/DELETE) no llevan `revision` (ADR-020).

## Consecuencias

**Positivas**

- Revisión explícita y testeable en cada petición; ningún GET de planning puede omitirla sin que falle el guardia.
- Sin estado global oculto en los servicios root de la lib `planning`.

**Negativas / Riesgos**

- Dos mecanismos (token en `data-access-planning`, estado de store en `planning`) según el scope de DI de cada lib.
- El default `'execution'` del token es implícito; está documentado en su JSDoc y cubierto por tests.
- Fuera de alcance: `target-conditions` y `propelling-charge-parameters` no reciben `revision`.
