# ADR-007: Descomposición de `ExecutionStore` en features de SignalStore

**Estado:** Aceptado
**Fecha:** 2026-07-10
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

`libs/domain/trial/execution/src/lib/+state/execution.store.ts` había crecido hasta ~3.100 líneas: 35 slices de estado (una por widget del panel de ejecución), 51 computeds, 74 métodos y todo el mock data inicial en un único fichero. Era difícil de navegar, imposible de testear por partes y cualquier cambio en un widget tocaba el mismo fichero gigante, generando conflictos y riesgo de regresión.

Restricción dura: ~40 componentes inyectan `ExecutionStore` (provisto a nivel de ruta en `execution.routes.ts`) y dependen de que **todos los widgets compartan una única instancia** para sincronizarse entre sí (p. ej. MAO Topografía empuja datos a Radar Trayectografía, Información Sobrepresión alimenta la Gráfica Sobrepresión). El refactor no podía cambiar la API pública ni la semántica de instancia única.

## Decisión

Descomponer la store usando **custom SignalStore features** (`signalStoreFeature` de `@ngrx/signals`), el mecanismo oficial de NgRx para trocear stores densas:

- Una feature por widget (o clúster funcional pequeño) en `+state/features/*.feature.ts`, cada una con su slice de estado (`withState`), sus computeds y sus métodos. Ficheros de ~50–150 líneas, testables de forma aislada componiéndolos en una store mínima de test.
- Las interfaces de estado viven en `+state/execution-state.models.ts` y se re-exportan desde `execution.store.ts`, de modo que los imports existentes de tipos en componentes no cambian.
- `execution.store.ts` queda reducido a la composición (~30 líneas): `signalStore(withGeneralData(), withReadiness(), withEquipmentSelector(), withOrientationWidgets(), withDataIntroductionWidgets(), withFieldDataWidgets(), withAnalysisWidgets())`.
- Las dependencias entre slices se declaran explícitamente con constraints tipados: p. ej. `withJltMao()` exige `{ state: type<{ maoTopography: MaoTopographyState }>() }` y `withEquipmentSelector()` exige `fireTrialId`. El compilador garantiza el orden de composición correcto.
- `signalStore`/`signalStoreFeature` aceptan como máximo 11 features por llamada, por lo que las features de widget se agrupan en features intermedias (`orientation-widgets`, `data-introduction-widgets`, `field-data-widgets`, `analysis-widgets`).

**Alternativa rechazada:** dividir en múltiples `signalStore` independientes (uno por widget) inyectados directamente por cada componente. Es el objetivo a largo plazo según la jerarquía de estado de `AGENTS.md`, pero exigía reescribir ~40 componentes y ~35 specs de golpe, y re-resolver la sincronización cross-widget (inyección de stores hermanas vía `withProps`). Se descartó como paso único por riesgo; la descomposición en features deja cada slice ya aislado en su fichero, de modo que la promoción de una feature a store independiente puede hacerse widget a widget en el futuro.

## Consecuencias

### Positivas

- API pública de `ExecutionStore` y semántica de instancia única **idénticas**: cero cambios en componentes, dialogs o rutas.
- Cada widget tiene su fichero de estado propio: revisiones y diffs localizados, sin conflictos en un fichero monolítico.
- Las features son unidades de test: se puede componer `signalStore(withJltMao(), …)` en un spec sin levantar la store completa.
- Las dependencias entre widgets, antes implícitas dentro del monolito, ahora son constraints de tipo explícitos y verificados por el compilador.

### Negativas

- Un nivel más de indirección (features agrupadoras) impuesto por el límite de aridad de `@ngrx/signals`.
- El estado sigue siendo una única instancia global del dominio: una feature mal escrita puede seguir tocando slices ajenos vía `patchState` (mitigado por revisión: cada feature solo debe parchear su slice).
- La migración final a stores por widget inyectadas por componente (jerarquía de `AGENTS.md`) queda pendiente como trabajo incremental.

## Referencias

- `libs/domain/trial/execution/src/lib/+state/execution.store.ts` (composición)
- `libs/domain/trial/execution/src/lib/+state/features/` (features por widget)
- [NgRx — Custom Store Features](https://ngrx.io/guide/signals/signal-store/custom-store-features)
- ADR-003 (Signal Trigger Pattern), ADR-006 (Golden Path)
