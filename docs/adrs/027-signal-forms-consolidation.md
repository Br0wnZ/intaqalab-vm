# ADR-027: Consolidación 100% Signal Forms (@angular/forms/signals 22.2)

**Estado:** Aceptado
**Fecha:** 2026-11-17
**Autores:** Equipo INTAQALAB

---

## Contexto

Tras completar la migración a Angular `22.2.6` (ADR-026) y las fases de optimización de skills, higiene de animaciones, primitivas reactivas y testing Zoneless, Signal Forms (`@angular/forms/signals`) ya gobernaba los formularios activos del monorepo, pero persistía deuda residual y capacidades de Angular 22.2 sin explotar:

1. **Restos legacy de `@angular/forms`:** 14 archivos de producción mantenían imports muertos de `ReactiveFormsModule`, 5 archivos de modelos conservaban tipos sin consumidor basados en `ControlsOf<T>` (`libs/shared/models/src/lib/form/types.ts` y 4 alias `*FormControls`) con `eslint-disable @typescript-eslint/no-explicit-any`, y 1 spec (`mat-select-clearable.spec.ts`) utilizaba `FormControl`.
2. **Envío manual sin `FormRoot` ni `submission`:** Los formularios y diálogos no empleaban `<form [formRoot]="...">` ni la opción `submission` de `form()`, impidiendo el envío nativo con `Enter`, el atributo `novalidate` automático, la protección integrada contra doble envío concurrente (`submitting()`) y el revelado automático de errores (`markAllAsTouched()`). Además, `<ui-save-button>` renderizaba siempre `type="button"`.
3. **Validaciones numéricas duplicadas:** Reglas idénticas de porcentajes (`0..100`), valores no negativos (`>= 0`) y rangos acotados se repetían manualmente con `min()`/`max()` en `planning`, `execution` y `warehouse-management`.
4. **Ausencia de guardas estáticas:** `eslint.base.config.mjs` no restringía la reintroducción de `ReactiveFormsModule`, `FormBuilder`, `FormGroup`, `FormControl`, `FormArray`, `AbstractControl` o `Validators`.

## Decisión

Se ejecuta la **Fase 4 (Consolidación 100% Signal Forms)** sobre `apps/` y `libs/` con las siguientes medidas:

1. **Eliminación total de deuda legacy Reactive Forms:**
   - Se eliminan los 14 imports muertos de `ReactiveFormsModule` en producción (`core`, `event-log`, `master-data`, `trial-management`, `warehouse-management`).
   - Se elimina `libs/shared/models/src/lib/form/types.ts` (`ControlsOf<T>`) junto con su re-export en `libs/shared/models/src/index.ts` y los 4 alias sin uso (`TrialDocsFilterFormControls`, `AssociatedTrialFormControls`, `TrialSearchFiltersFormControls`, `TriaUpsertFormControls`).
   - Se migra `libs/shared/ui/src/lib/mat-select-clearable/mat-select-clearable.spec.ts` a Signal Forms (`form()` + `[formField]`) y se actualiza el JSDoc de `mat-select-clearable.ts`.
   - No se adopta `compatForm()` (`@angular/forms/signals/compat`) al existir 0 componentes activos con `FormGroup`/`FormBuilder`.

2. **Soporte `submit` en `SaveButton` y adopción de `[formRoot]` + `submission`:**
   - `SaveButton` (`libs/shared/ui/src/lib/save-button/save-button.ts`) incorpora `buttonType = input<'button' | 'submit'>('button')` enlazado a `[attr.type]="buttonType()"`, preservando 100 % de compatibilidad con `(save)` cuando `buttonType` es `'button'` y habilitando envío nativo dentro de `<form [formRoot]>`.
   - **29 componentes de producción** adoptan `<form [formRoot]="...">` con `submission: { action: ... }` (y `submit()` en reenvíos explícitos donde aplica):
     - `event-log` (4 filtros): `documents-filter`, `general-data-filter`, `measures-filters`, `series-and-shoots-filter`.
     - `master-data` (6 diálogos upsert): `default-upsert-dialog`, `dimensions-upsert-dialog`, `document-type-upsert-dialog`, `loading-zone-upsert-dialog`, `measures-dialog`, `stanag-upsert-dialog`.
     - `execution` (5 diálogos): `cancel-execution-dialog`, `interrupt-execution-dialog`, `armament-introduction-mass-config-dialog`, `jlt-mao-mass-config-dialog`, `mao-topography-mass-config-dialog`.
     - `planning` (4 diálogos): `upsert-serie-dialog`, `update-armament-dialog`, `massive-shots-configuration-dialog`, `massive-configuration-dialog`.
     - `warehouse-management` (7 diálogos y 3 filtros): `denominations-dialog`, `munition-component-dialog`, `upsert-dialog`, `link-certificate-dialog`, `retire-dialog`, `munitions-dumps-dialog`, `transfer-dialog`, `denominations-filter`, `movements-filter`, `stock-list-filter`.
   - **Excepción documentada (`specimens-managment-dialog.ts`):** `libs/domain/trial/planning/src/lib/components/specimens-managment-dialog/specimens-managment-dialog.ts` mantiene un flujo bimodal en el que `onAdd()` ejecuta `submit(this.specimenForm, ...)` para añadir elementos a la lista local `selectedSpecimens` y `onSave()` (fuera del `<form>`) confirma y cierra el diálogo. No se envuelve con `[formRoot]` ni `buttonType="submit"` para evitar colisión entre la adición parcial y el cierre del modal.

3. **Esquemas compartidos `schema<T>()` en `@intaqalab/utils`:**
   - Se crea `libs/shared/utils/src/lib/forms/domain-schemas.ts` (exportado desde `libs/shared/utils/src/index.ts`) con `percentageSchema` (`[0, 100]`), `nonNegativeSchema` (`>= 0`) y `boundedNumberSchema(minVal, maxVal)` sobre `schema<number | null>`, junto con sus pruebas en `domain-schemas.spec.ts`.
   - Se aplican mediante `apply()` en **14 componentes de producción**:
     - `execution` (3): `ipg-pressure-measurements.ts`, `identificacion-tab.component.ts`, `overpressure-info.ts`.
     - `planning` (8): `armament.ts`, `update-armament-dialog.ts`, `carga-detail-form.component.ts`, `component-detail-form.component.ts`, `espoleta-detail-form.component.ts`, `suplemento-detail-form.component.ts`, `configuration-form.component.ts`, `shooting-conditions.ts`.
     - `warehouse-management` (3): `retire-dialog.component.ts`, `munitions-shell.component.ts`, `transfer-dialog.component.ts`.
   - En campos legacy de `planning` tipados como unión `string | number`, se mantienen `numericMin` y `numericMax` (`libs/domain/trial/planning/src/lib/utils/numeric-validators.ts`), dado que `min()`/`max()` nativos requieren `SchemaPath<number | null>`.

4. **Blindaje ESLint contra Reactive Forms (`eslint.base.config.mjs`):**
   - Se añade en `no-restricted-imports` una restricción por `importNames` sobre `'@angular/forms'` que bloquea `ReactiveFormsModule`, `FormBuilder`, `UntypedFormBuilder`, `FormGroup`, `UntypedFormGroup`, `FormControl`, `UntypedFormControl`, `FormArray`, `UntypedFormArray`, `AbstractControl` y `Validators`.
   - Se mantienen permitidos explícitamente `ControlValueAccessor` / `NG_VALUE_ACCESSOR` (usado por `LocaleDecimalInputDirective`) y `FormsModule` (usado puntualmente en `[(ngModel)]` aislados como `ordered-table.ts`, `calendar-trials-header.component.ts`, `master-data-list.component.ts`, `trial-selector-dialog.ts`, `dialog-input.component.ts`, `component-munition.component.ts` y `location.component.ts`).

## Consecuencias

- **Positivas:**
  - `0` importaciones ni referencias a símbolos de Reactive Forms en `apps/` y `libs/`, protegido automáticamente por ESLint en cada commit y pipeline CI.
  - Formularios y diálogos de envío explícito estandarizados con `<form [formRoot]>`, `submission`, protección nativa frente a envíos concurrentes y soporte completo de tecla `Enter`.
  - Reducción de duplicación de reglas numéricas gracias a `percentageSchema`, `nonNegativeSchema` y `boundedNumberSchema` en `@intaqalab/utils`.
- **Compromisos y mantenimiento:**
  - `LocaleDecimalInputDirective` y los usos aislados de `FormsModule` (`[(ngModel)]`) continúan permitidos fuera del ámbito de Reactive Forms; cualquier nuevo formulario complejo debe usar `form()`, `[formField]`, `[formRoot]` y `schema()` de `@angular/forms/signals`.
  - Si en el futuro los modelos `string | number` de `planning` se tipan estrictamente como `number | null`, podrán sustituir `numericMin`/`numericMax` por los esquemas compartidos de `@intaqalab/utils`.
