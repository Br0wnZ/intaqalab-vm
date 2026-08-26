# ADR-011: Value-Based Dirty/Touched Tracking in Execution Widgets

**Estado:** Aceptado
**Fecha:** 2026-08-25
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

Los widgets de la Execution Grid implementan `FormWidget { formState, resetForm(), saveForm() }`.
El contenedor (`Execution`) agrega `dirtyWidgets()` para habilitar el guardado global y disparar
los PUT/POST correspondientes.

Tres problemas detectados con el enfoque original (flags internas de Signal Forms):

1. **Selectores de consulta contaminaban dirty.** Casi todos los widgets tienen selectores de
   `serie`/`disparo` que son controles de navegación: al cambiarlos se dispara un GET para traer
   los datos del disparo, pero no son datos persistibles. Al vivir dentro del mismo Signal Form,
   `form().dirty()` se marcaba al cambiarlos → widget aparecía dirty → PUT innecesarios.
2. **El patch tras el GET marcaba dirty/touched.** Las flags de Signal Forms son *sticky*: una vez
   marcadas no se limpian si el campo vuelve a su valor guardado, y se marcan también cuando el
   formulario se rellena programáticamente con la respuesta del GET → widget "dirty" sin interacción
   del usuario.
3. **Carreras en GETs de selectores.** Cambiar de disparo con una petición en vuelo hacía que la
   respuesta antigua sobrescribiera datos del disparo nuevo (patrón `requestVersion` duplicado a
   mano en varios widgets).

## Decisión

El estado de formulario de un widget se calcula **por valor**, nunca a partir de flags del form:

### 1. Dirty = comparación estructural contra snapshot

Utilidad `createDirtyTracker` + `deepEqual` en `@intaqalab/utils`
(`libs/shared/utils/src/lib/signals/dirty-tracker.ts`):

```ts
readonly #dirtyTracker = createDirtyTracker(() => ({
  // SOLO campos editables/persistibles — NUNCA serie/disparo
  arma: this.formModel().arma,
  observations: this.formModel().observations,
}));
protected readonly isDirty = this.#dirtyTracker.isDirty;
// Tras guardar con éxito o aplicar datos del GET: this.#dirtyTracker.syncSnapshot();
```

Reglas:
- Los selectores `serie`/`disparo` **nunca** van en `editableFields`.
- Todo campo que `saveForm()` envíe al backend **debe** estar en el tracker.
- Prohibido derivar dirty de flags del form (`form().dirty()`) ni de heurísticas de contenido
  (`campo.length > 0`) — ambas marcan dirty tras el GET inicial.
- Snapshot con `structuredClone`; comparación con `deepEqual` (trata `NaN === NaN`). Prohibido
  `JSON.stringify` para clonar/comparar.

### 2. Touched = interacción real del usuario

Directiva `FormTouchDirective` (`widgets/directives/form-touch.directive.ts`, selector
`intaFormTouch`, exportAs `intaFormTouch`): escucha `focusout` sobre inputs del host y solo
reacciona a interacción real — inmune al patch programático.

```html
<div intaReadonlyContent intaFormTouch #touch="intaFormTouch" class="...">
  <!-- campos editables -->
</div>
```

```ts
protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });
// formState:
touched: this.touchRef()?.touched() ?? false,
```

Nota: `viewChild` no admite miembros ES-private (`#`); usar `protected readonly touchRef`.

### 3. GETs de selectores con guard anti-carrera

`createSelectionGuard` + `shotSelectionKey` (`widgets/utils/selection-guard.ts`):

```ts
readonly #selectorKey = computed(() =>
  shotSelectionKey(this.formModel().serie, this.formModel().disparo),
);
readonly #selectionGuard = createSelectionGuard(() => this.#selectorKey());

async #loadSelectedShotData(): Promise<void> {
  const selectionKey = this.#selectorKey();
  const ticket = this.#selectionGuard.begin();
  const response = await this.#executionService.fetchShot...(fireTrialId, serie, disparo);
  if (!ticket.isFresh(selectionKey)) return; // respuesta stale — descartar
  // aplicar datos + syncSnapshot()
}
```

### 4. saveForm() siempre await + try/catch

Toda mutación remota se hace con `await`; `syncSnapshot()` SOLO si el PUT tiene éxito; rethrow del
error. Prohibido fire-and-forget — desincroniza el snapshot y oculta fallos.

**Alternativas rechazadas:**
- Sacar `serie`/`disparo` del Signal Form a signals independientes: mismo resultado observable pero
  rompe templates (`[formField]`) y specs; la exclusión por valor es menos invasiva. Deuda residual:
  las flags internas del form siguen marcándose al cambiar selectores (inertes mientras nadie las
  consuma).
- Consumir `form().touched()` para touched: descartado — se marca con patch programático.
- `JSON.stringify` para comparaciones: frágil con orden de claves, prohibido por convención repo.

## Consecuencias

### Positivas

- El botón Guardar solo se habilita con cambios reales del usuario.
- Cambiar serie/disparo nunca dispara guardados ni marca touched.
- Anti-carrera centralizado: respuestas stale descartadas de forma uniforme.
- Boilerplate eliminado (~40 líneas/widget) e inconsistencias entre widgets desaparecen.

### Negativas

- Deuda residual: selectores siguen dentro del Signal Form; sus flags internas se marcan aunque
  nobody las consuma. Si alguien reintroduce `form().dirty()` en un `isDirty`, el bug reaparece.
- Widgets aún no migrados (~10) mantienen snapshots manuales con `JSON.stringify` hasta completar
  la migración incremental.
- `deepEqual` propio: cubre primitivos/arrays/objetos planos; no Map/Set/DOM/ciclos.

## Referencias

- Utilidad: `libs/shared/utils/src/lib/signals/dirty-tracker.ts`
- Guard: `libs/domain/trial/execution/src/lib/execution/widgets/utils/selection-guard.ts`
- Directiva: `libs/domain/trial/execution/src/lib/execution/widgets/directives/form-touch.directive.ts`
- Skill de dominio: `.agents/skills/execution-domain-expert/SKILL.md` (nota de arquitectura de widgets)
- Widgets migrados: armament-introduction, velocity-introduction, manometer-introduction,
  munition-introduction (+tabs), piezo-pressure-introduction, jlt-shot-data, shot-widget
