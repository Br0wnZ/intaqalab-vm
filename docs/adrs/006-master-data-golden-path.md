# ADR-006: `libs/domain/master-data` como Golden Path

**Estado:** Aceptado
**Fecha:** 2026-07-10 (retroactivo — decisión ya implementada)
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

El repo tiene dominios de distinta antigüedad y calidad (planning, execution, trial-management, warehouse, master-data…) con patrones no siempre homogéneos — código legacy con RxJS/`.subscribe()`, `FormBuilder` clásico, o estructura de carpetas distinta según cuándo se escribió. Un agente o desarrollador nuevo necesita un único punto de referencia inequívoco para saber "cómo se hace aquí", sin tener que inferir el patrón correcto comparando varios dominios y arriesgarse a copiar deuda técnica.

## Decisión

`libs/domain/master-data` es el **Golden Path** oficial del repositorio (declarado en su propio `README.md` y en `AGENTS.md`). Todo dominio nuevo, feature async, uso de `httpResource` o `SignalStore` debe tomar ese código como plantilla y leer su README antes de empezar. No se debe usar código de otros dominios como referencia si contradice los patrones de `master-data`.

Patrones que demuestra y que son obligatorios en todo el repo:

- Cero RxJS en componentes UI (`await firstValueFrom(...)` en vez de `.subscribe()`).
- Signal Trigger Pattern + `httpResource` para todo fetching (ver ADR-003).

**Alternativa rechazada:** Documentar el patrón solo en prosa (`docs/*.md`) sin código de referencia ejecutable — descartado porque un ejemplo real compilable, testeado y en producción es más difícil de malinterpretar que una descripción abstracta, y se mantiene sincronizado con el compilador/linter en vez de quedar obsoleto.

## Consecuencias

### Positivas

- Onboarding más rápido: un solo lugar que leer para replicar el patrón correcto end-to-end (data-access → store → componente).
- El código de referencia se valida solo (build/lint/test) — no puede quedar obsoleto sin que falle CI.

### Negativas

- Requiere disciplina para mantener `master-data` libre de deuda técnica indefinidamente — cualquier atajo tomado ahí se propaga como "patrón oficial" a todo dominio nuevo.
- Dominios existentes anteriores a esta decisión (planning, execution, trial-management) no están retroactivamente alineados — conviven patrones legacy y patrón golden path en el mismo repo hasta que se migren.

## Referencias

- `libs/domain/master-data/README.md`
- `AGENTS.md` (sección Golden Path)
- ADR-003 (Signal Trigger Pattern)
