---
name: numeric-input-constraints
description: Especialista en validación de inputs numéricos usando directivas Angular y constraints min/max contextuales extraídos de los specs funcionales (planning, execution, admin). Integra locale-aware decimals, no leading zeros, y validación de rangos por dominio.
argument-hint: "Ej: 'Crea el form de planificación con velocidades y presiones' o 'Genera inputs para entrada de datos de ejecución con coordenadas y presiones'."
user-invocable: true
---

# 🔢 Numeric Input Constraints Skill

**Expert in validating and constraining numeric inputs using Angular directives and context-aware min/max values from INTAQALAB functional specs.**

## 🎯 When to Use

- Creating numeric input fields in planning, execution, or admin modules
- Enforcing domain-specific constraints (e.g., percentages 0-100, positive days, decimal velocities)
- Building forms that reject invalid data at the input level (no backend round-trips)
- Applying locale-aware decimal inputs (es-ES uses `,` separator; en-US uses `.`)
- Preventing user errors: leading zeros, negative values, precision overflow

---

## � CRITICAL: Signal Forms + `[formField]` Directive

> ⚠️ **When using Angular Signal Forms with `[formField]` directive, HTML attributes `min` and `max` DO NOT WORK.**
>
> **Always apply min/max constraints using `Validators.min()` and `Validators.max()` in the form definition, NOT as HTML attributes.**

### Why?

The `[formField]` directive in Signal Forms manages validation through TypeScript validators, not HTML attributes. HTML `min/max` attributes are ignored and will not prevent invalid submissions.

### ✅ DO THIS:

```typescript
// TypeScript Component
protected readonly form = form<MyForm>({
  age: {
    initialValue: 0,
    validators: [Validators.required, Validators.min(1), Validators.max(150)],
  },
});
```

```html
<!-- HTML Template: NO min/max attributes -->
<input type="number" libNoNegativeValues [formField]="form.age" />
```

### ❌ DON'T DO THIS:

```html
<!-- WRONG: min/max attributes with [formField] directive are ignored -->
<input type="number" libNoNegativeValues min="1" max="150" [formField]="form.age" />
```

---

## �📦 Core Directives

Three production-ready directives live in `libs/shared/utils/src/lib/directives/`:

### 1️⃣ `NoNegativeValuesDirective`

**Purpose:** Block negative input on `type="number"` fields.

**What it does:**

- Blocks `-` and `+` key presses
- Strips `-`/`+` on paste
- Does NOT replace HTML `min` attribute (see note below)

**When to use:**

- Days (planning deadlines)
- Counts (shots, units)
- Percentages
- Weights, pressures, velocities (physics domain always ≥ 0)

**⚠️ Critical with `[formField]`:**

When using Signal Forms with `[formField]` directive, **do NOT use HTML `min` attribute**. Instead, apply `Validators.min(0)` in the form definition:

```typescript
// ✅ CORRECT
protected readonly form = form<YourForm>({
  fieldName: {
    initialValue: 0,
    validators: [Validators.min(0), Validators.max(100)],
  },
});
```

```html
<!-- ✅ CORRECT: No HTML min/max, directive alone with formField -->
<input type="number" matInput libNoNegativeValues [formField]="form.fieldName" />
```

```html
<!-- ❌ WRONG: HTML min/max with formField directive -->
<input type="number" matInput libNoNegativeValues min="0" max="100" [formField]="form.fieldName" />
```

**Example:**

```html
<input matInput type="number" libNoNegativeValues [formField]="form.daysForReport" />
```

---

### 2️⃣ `LocaleDecimalInputDirective`

**Purpose:** Accept decimal input with locale-specific separator (`,` for es-ES, `.` for en-US).

**What it does:**

- Changes `type="text"` + `inputMode="decimal"` (numeric keyboard on mobile)
- On focus: shows editable format without thousands separators
- On blur: parses locale string → JS `number` → formats with Intl.NumberFormat
- Enforces max decimal places (configurable via `[decimals]="4"`)
- Blocks extra precision at input time (never lets user type beyond limit)
- Implements `ControlValueAccessor` → works with `[formField]`, `ngModel`, `formControl`
- Reactive to `LOCALE_SIGNAL` (auto-updates when language changes)

**When to use:**

- Velocities (V0, Vc, Vc corregida) — 2–4 decimals
- Pressures (P, Pico) — 1–2 decimals
- Weights — 2–3 decimals
- Any **non-integer physics measurement**

**⚠️ Critical with `[formField]`:**

When using Signal Forms with `[formField]` directive, **do NOT use HTML `min/max` attributes**. Instead, apply min/max validators in the form definition:

```typescript
// ✅ CORRECT
protected readonly form = form<YourForm>({
  velocity: {
    initialValue: null,
    validators: [Validators.required, Validators.min(0), Validators.max(2000)],
  },
});
```

```html
<!-- ✅ CORRECT: No HTML min/max, use validators in component instead -->
<input matInput libLocalDecimal [decimals]="2" [minDecimals]="1" [formField]="form.velocity" />
```

```html
<!-- ❌ WRONG: HTML min/max with formField directive -->
<input matInput libLocalDecimal min="0" max="2000" [decimals]="2" [formField]="form.velocity" />
```

**Example:**

```html
<input matInput libLocalDecimal [decimals]="2" [minDecimals]="1" [formField]="form.initialVelocity" />
```

---

### 3️⃣ `NoLeadingZerosDirective`

**Purpose:** Strip leading zeros on integer inputs (e.g., `01` → `1`).

**What it does:**

- On input: removes leading zeros unless the value is just `0`
- Handles negative numbers: `-01` → `-1`
- Non-destructive: only modifies if zeros present

**When to use:**

- Integers: days, counts, series numbers, years
- **NOT for:** client numbers, codes, or fields where `01 ≠ 1`

**⚠️ Critical with `[formField]`:**

When using Signal Forms with `[formField]` directive, **do NOT use HTML `min/max` attributes**. Apply validators in the form definition instead:

```typescript
// ✅ CORRECT
protected readonly form = form<YourForm>({
  daysForReport: {
    initialValue: 20,
    validators: [Validators.min(1), Validators.max(120)],
  },
});
```

```html
<!-- ✅ CORRECT: No HTML min/max, use validators in component -->
<input matInput type="number" libNoLeadingZeros libNoNegativeValues [formField]="form.daysForReport" />
```

```html
<!-- ❌ WRONG: HTML min/max with formField directive -->
<input
  matInput
  type="number"
  libNoLeadingZeros
  libNoNegativeValues
  min="1"
  max="120"
  [formField]="form.daysForReport"
/>
```

**Example:**

```html
<input matInput type="number" libNoLeadingZeros [formField]="form.daysUntilDeadline" />
```

---

## 📋 INTAQALAB Context: Input Constraints by Domain

### Planning (libs/domain/trial/planning)

| Field                                    | Type    | Min | Max   | Directive                                             | Decimals | Example | Notes                          |
| ---------------------------------------- | ------- | --- | ----- | ----------------------------------------------------- | -------- | ------- | ------------------------------ |
| **Máximos días para emisión de informe** | integer | 1   | 120   | `NoNegativeValuesDirective` `NoLeadingZerosDirective` | —        | 20      | Days until report delivery     |
| **Porcentaje para unidades técnicas**    | integer | 0   | 100   | `NoNegativeValuesDirective`                           | —        | 40      | % of time for unit validations |
| **Porcentaje para fin de prueba**        | integer | 0   | 100   | `NoNegativeValuesDirective`                           | —        | 60      | % time to sign off             |
| **Días para firma del informe**          | integer | 0   | 30    | `NoNegativeValuesDirective` `NoLeadingZerosDirective` | —        | 1       | Margin days for signature      |
| **Criterios V0c Min/Máx**                | decimal | 0   | 2000  | `LocaleDecimalInputDirective`                         | 2        | 800.50  | Initial velocity range         |
| **Criterios P Min/Máx**                  | decimal | 0   | 50000 | `LocaleDecimalInputDirective`                         | 1        | 2500.5  | Pressure range (MPa/bar)       |
| **Criterios σV0c**                       | decimal | 0   | 500   | `LocaleDecimalInputDirective`                         | 2        | 12.45   | Std dev of V0c                 |

### Execution (libs/domain/trial/execution)

| Field                         | Type    | Min    | Max    | Directive                                             | Decimals | Example | Notes                                                                    |
| ----------------------------- | ------- | ------ | ------ | ----------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| **Velocidad inicial**         | decimal | 0      | 2000   | `LocaleDecimalInputDirective`                         | 2        | 850.75  | m/s, physics ≥ 0                                                         |
| **Presión (Sensores)**        | decimal | 0      | 50000  | `LocaleDecimalInputDirective`                         | 1        | 3200.4  | MPa or bar                                                               |
| **Presión (Manómetro)**       | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                         | 2        | 2450.25 | Backup pressure                                                          |
| **Peso proyectil**            | decimal | 0      | 100000 | `LocaleDecimalInputDirective`                         | 3        | 12.500  | grams                                                                    |
| **Peso espoleta**             | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                         | 3        | 125.750 | grams                                                                    |
| **Peso carga explosiva**      | decimal | 0      | 50000  | `LocaleDecimalInputDirective`                         | 3        | 850.125 | grams                                                                    |
| **Nº de serie (weapon)**      | integer | —      | —      | `NoLeadingZerosDirective`                             | —        | 2850    | **Can have leading zeros if part of alphanumeric code** → omit directive |
| **Nº disparo**                | integer | 1      | 999    | `NoNegativeValuesDirective` `NoLeadingZerosDirective` | —        | 5       | Must be ≥ 1                                                              |
| **Coordenada X (trajectory)** | decimal | −10000 | 10000  | `LocaleDecimalInputDirective`                         | 2        | 1250.75 | Can be negative                                                          |
| **Coordenada Y (trajectory)** | decimal | −10000 | 10000  | `LocaleDecimalInputDirective`                         | 2        | −850.25 | Can be negative                                                          |
| **Coordenada Z (trajectory)** | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                         | 2        | 450.50  | Height (always ≥ 0)                                                      |
| **Nivel acústico**            | decimal | 0      | 200    | `LocaleDecimalInputDirective`                         | 1        | 167.3   | dB                                                                       |

### Admin / Master Data

| Field                   | Type    | Min  | Max    | Directive                                             | Decimals | Example      | Notes                      |
| ----------------------- | ------- | ---- | ------ | ----------------------------------------------------- | -------- | ------------ | -------------------------- |
| **Año de fabricación**  | integer | 1900 | 2100   | `NoNegativeValuesDirective` `NoLeadingZerosDirective` | —        | 2020         | Weapon year                |
| **Número de serie**     | —       | —    | —      | **Omit directives**                                   | —        | A-2850-B     | Client/alphanumeric format |
| **Lote munición**       | —       | —    | —      | **Omit directives**                                   | —        | LOT-2025-001 | Alphanumeric lot code      |
| **Cantidad disponible** | integer | 0    | 999999 | `NoNegativeValuesDirective` `NoLeadingZerosDirective` | —        | 150          | Stock count                |

---

## 🛠️ Implementation Patterns

> ⚠️ **CRITICAL:** When using `[formField]` directive with Signal Forms, **HTML attributes `min/max` CANNOT be used**. Instead, apply min/max constraints using **`Validators.min()` and `Validators.max()`** in the form definition.

### Pattern 1: Integer with Range (Days, Counts, Percentages)

**TypeScript Component:**

```typescript
import { Validators } from '@angular/forms';

export class PlanningFormComponent {
  protected readonly form = form<PlanningForm>({
    daysForReport: {
      initialValue: 20,
      validators: [Validators.required, Validators.min(1), Validators.max(120)],
    },
    techUnitPercentage: {
      initialValue: 40,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    },
  });
}
```

**HTML Template:**

```html
<mat-form-field>
  <mat-label i18n="PLANNING.DAYS_FOR_REPORT">Max days for report</mat-label>
  <input matInput type="number" libNoNegativeValues libNoLeadingZeros [formField]="form.daysForReport" />
  @if (form.daysForReport().touched() && form.daysForReport().errors()) { @for (error of form.daysForReport().errors();
  track error.kind) {
  <mat-error>
    @switch (error.kind) { @case ('required') {
    <span i18n="COMMON.FIELD_REQUIRED">Required</span>
    } @case ('min') {
    <span>Minimum value is 1</span>
    } @case ('max') {
    <span>Maximum value is 120</span>
    } }
  </mat-error>
  } }
</mat-form-field>
```

---

### Pattern 2: Decimal with Locale (Physics Measurements)

**TypeScript Component:**

```typescript
import { Validators } from '@angular/forms';

export class ExecutionFormComponent {
  protected readonly form = form<ExecutionForm>({
    initialVelocity: {
      initialValue: null,
      validators: [Validators.required, Validators.min(0), Validators.max(2000)],
    },
    pressurePiezo: {
      initialValue: null,
      validators: [Validators.required, Validators.min(0), Validators.max(50000)],
    },
  });
}
```

**HTML Template:**

```html
<mat-form-field>
  <mat-label i18n="EXECUTION.INITIAL_VELOCITY">Initial velocity (m/s)</mat-label>
  <input matInput libLocalDecimal [decimals]="2" [minDecimals]="1" [formField]="form.initialVelocity" />
  @if (form.initialVelocity().touched() && form.initialVelocity().errors()) { @for (error of
  form.initialVelocity().errors(); track error.kind) {
  <mat-error>
    @switch (error.kind) { @case ('required') {
    <span i18n="COMMON.FIELD_REQUIRED">Required</span>
    } @case ('min') {
    <span>Must be ≥ 0 m/s</span>
    } @case ('max') {
    <span>Cannot exceed 2000 m/s</span>
    } }
  </mat-error>
  } }
</mat-form-field>
```

---

### Pattern 3: Coordinate Input (Can Be Negative)

**TypeScript Component:**

```typescript
import { Validators } from '@angular/forms';

export class TrajectoryFormComponent {
  protected readonly form = form<TrajectoryForm>({
    trajectoryX: {
      initialValue: null,
      validators: [Validators.required, Validators.min(-10000), Validators.max(10000)],
    },
    trajectoryZ: {
      initialValue: null,
      validators: [Validators.required, Validators.min(0), Validators.max(5000)],
    },
  });
}
```

**HTML Template:**

```html
<!-- Coordinate X: allows negative values -->
<mat-form-field>
  <mat-label i18n="EXECUTION.COORD_X">Coordinate X (m)</mat-label>
  <input matInput libLocalDecimal [decimals]="2" [minDecimals]="1" [formField]="form.trajectoryX" />
  @if (form.trajectoryX().touched() && form.trajectoryX().errors()) { @for (error of form.trajectoryX().errors(); track
  error.kind) {
  <mat-error>
    @switch (error.kind) { @case ('required') {
    <span i18n="COMMON.FIELD_REQUIRED">Required</span>
    } @case ('min') {
    <span>Must be ≥ -10000 m</span>
    } @case ('max') {
    <span>Cannot exceed 10000 m</span>
    } }
  </mat-error>
  } }
</mat-form-field>

<!-- Height Z: no negative values -->
<mat-form-field>
  <mat-label i18n="EXECUTION.COORD_Z">Height Z (m)</mat-label>
  <input matInput libLocalDecimal libNoNegativeValues [decimals]="2" [minDecimals]="1" [formField]="form.trajectoryZ" />
  @if (form.trajectoryZ().touched() && form.trajectoryZ().errors()) { @for (error of form.trajectoryZ().errors(); track
  error.kind) {
  <mat-error>
    @switch (error.kind) { @case ('required') {
    <span i18n="COMMON.FIELD_REQUIRED">Required</span>
    } @case ('min') {
    <span>Must be ≥ 0 m</span>
    } @case ('max') {
    <span>Cannot exceed 5000 m</span>
    } }
  </mat-error>
  } }
</mat-form-field>
```

---

### Pattern 4: Alphanumeric Field (No Directives)

```html
<!-- Nº de serie, lote, etc. can have leading zeros, special chars -->
<mat-form-field>
  <mat-label i18n="MASTER_DATA.LOT_NUMBER">Lot number</mat-label>
  <input placeholder="e.g. LOT-2025-001" matInput [formField]="form.lotNumber" />
</mat-form-field>
```

---

## 🌍 Locale Integration

`LocaleDecimalInputDirective` reacts to `LOCALE_SIGNAL` token (injected from `@intaqalab/shared/config`):

- **es-ES:** Uses `,` as decimal separator (e.g., `1.234,56`)
- **en-US, de-DE:** Use `.` as decimal separator (e.g., `1,234.56`)

**No manual config needed** — the directive auto-updates when language changes.

```typescript
// Inside LocaleDecimalInputDirective
readonly #localeSignal = inject(LOCALE_SIGNAL);
readonly #decimalSeparator = computed(() =>
  this.#localeSignal() === 'es-ES' ? ',' : '.'
);
```

---

## ✅ Quick Checklist

Before applying directives to an input field:

- [ ] **Negative values allowed?** → Use `libLocalDecimal` (no block) or omit `libNoNegativeValuesDirective`
- [ ] **Integer only?** → `type="number"` + `libNoLeadingZeros` (if not alphanumeric code)
- [ ] **Decimal input?** → `libLocalDecimal` with appropriate `[decimals]`
- [ ] **Zero-indexed or alphanumeric?** → Omit `libNoLeadingZeros`
- [ ] **Always ≥ 0?** → Add `libNoNegativeValuesDirective` + `min="0"` HTML attr
- [ ] **HTML min/max match domain?** → Cross-check functional specs (planning.md, execution.md)
- [ ] **i18n labels and errors?** → Use i18n keys from INTAQALAB namespaces

---

## 📚 Reference: Functional Specs

- **Planning constraints:** [functionals/planning.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/functionals/planning.md) — Sections 3.1–3.2 (Parámetros de control de fechas, Criterios de Calificación)
- **Execution constraints:** [functionals/execution.md](file:///Users/pw-jmoreno/Projects/personal/intaqalab-vm/functionals/execution.md) — Sections 5.1–5.6 (Introducción de datos por familia)
- **Directive implementations:** `libs/shared/utils/src/lib/directives/`
  - `no-negative-values.directive.ts`
  - `locale-decimal-input.directive.ts`
  - `no-leading-zeros.directive.ts`

---

## 🎓 Example: Complete Planning Form with All Constraints

```typescript
// planning-form.component.ts
import { Component } from '@angular/core';
import { Validators, form } from '@angular/forms/signals';

type PlanningForm = {
  daysForReport: number;
  techUnitPercentage: number;
  completionPercentage: number;
  daysForSignature: number;
  v0cMinVelocity: number | null;
  v0cMaxVelocity: number | null;
  pressureMin: number | null;
  pressureMax: number | null;
};

@Component({
  selector: 'app-planning-form',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, NgIf, NgFor, TranslateModule],
  templateUrl: './planning-form.component.html',
})
export class PlanningFormComponent {
  protected readonly form = form<PlanningForm>({
    daysForReport: {
      initialValue: 20,
      validators: [Validators.required, Validators.min(1), Validators.max(120)],
    },
    techUnitPercentage: {
      initialValue: 40,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    },
    completionPercentage: {
      initialValue: 60,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    },
    daysForSignature: {
      initialValue: 1,
      validators: [Validators.required, Validators.min(0), Validators.max(30)],
    },
    v0cMinVelocity: {
      initialValue: null,
      validators: [Validators.min(0), Validators.max(2000)],
    },
    v0cMaxVelocity: {
      initialValue: null,
      validators: [Validators.min(0), Validators.max(2000)],
    },
    pressureMin: {
      initialValue: null,
      validators: [Validators.min(0), Validators.max(50000)],
    },
    pressureMax: {
      initialValue: null,
      validators: [Validators.min(0), Validators.max(50000)],
    },
  });

  onSubmit() {
    if (this.form.valid()) {
      console.log('Form values:', this.form.value());
    }
  }
}
```

```html
<!-- planning-form.component.html -->
<form [formGroup]="form">
  <mat-form-field>
    <mat-label i18n="PLANNING.DAYS_FOR_REPORT">Max days for report</mat-label>
    <input
      matInput
      type="number"
      libNoNegativeValues
      libNoLeadingZeros
      min="1"
      max="120"
      [formField]="form.daysForReport"
    />
    @if (form.daysForReport.touched && form.daysForReport.invalid) {
    <mat-error i18n="COMMON.INVALID">Invalid value</mat-error>
    }
  </mat-form-field>

  <mat-form-field>
    <mat-label i18n="PLANNING.TECH_PERCENTAGE">% for tech units</mat-label>
    <input matInput type="number" libNoNegativeValues min="0" max="100" [formField]="form.techUnitPercentage" />
    @if (form.techUnitPercentage.touched && form.techUnitPercentage.invalid) {
    <mat-error i18n="COMMON.PERCENTAGE_RANGE">Must be 0–100%</mat-error>
    }
  </mat-form-field>

  <mat-form-field>
    <mat-label i18n="PLANNING.V0C_MIN">Min V0c (m/s)</mat-label>
    <input matInput libLocalDecimal min="0" max="2000" [decimals]="2" [formField]="form.v0cMinVelocity" />
  </mat-form-field>

  <mat-form-field>
    <mat-label i18n="PLANNING.PRESSURE_MIN">Min Pressure (bar)</mat-label>
    <input matInput libLocalDecimal min="0" max="50000" [decimals]="1" [formField]="form.pressureMin" />
  </mat-form-field>

  <button mat-raised-button color="primary" (click)="onSubmit()">
    <span i18n="COMMON.SAVE">Save</span>
  </button>
</form>
```

---

## 🔗 Related Skills / Agents

- **`signal-trigger-pattern`** — How to fetch planning/execution data from API via `httpResource`
- **`signalstore-expert`** — Managing form state with `SignalStore`
- **`i18n-expert`** — Adding error messages and labels to i18n files
- **`angular-testing-expert`** — Unit testing forms with decimal inputs and locale changes

---

**Authored:** 2025-07 | **Version:** 1.0 | **Scope:** INTAQALAB numeric inputs (planning, execution, admin)
