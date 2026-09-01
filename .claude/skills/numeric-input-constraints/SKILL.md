---
name: numeric-input-constraints
description: Expert in validating and constraining numeric inputs using Angular directives and context-aware min/max values from INTAQALAB functional specs (planning, execution, admin). Handles locale-aware decimals, leading zeros removal, and physics domain range validation.
argument-hint: "E.g. 'Create planning form with velocities and pressures' or 'Generate execution data inputs with coordinates and pressure gauges'."
user-invocable: true
---

# 🔢 Numeric Input Constraints Skill

**Expert in validating and constraining numeric inputs using Angular directives and context-aware min/max values from INTAQALAB functional specs.**

## 🎯 When to Use

- Creating numeric input fields in planning, execution, or admin modules
- Enforcing domain-specific constraints (e.g. percentages 0-100, positive days, decimal velocities)
- Building forms that reject invalid data at the input level (no backend round-trips)
- Applying locale-aware decimal inputs (`es-ES` uses `,` separator; `en-US` uses `.`)
- Preventing user errors: leading zeros, negative values, precision overflow

---

## 🚨 CRITICAL: Signal Forms + `[formField]` Directive

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

---

## 📦 Core Directives

Three production-ready directives live in `libs/shared/utils/src/lib/directives/`:

### 1️⃣ `NoNegativeValuesDirective`

**Purpose:** Block negative input on `type="number"` fields.
**What it does:** Blocks `-` and `+` key presses; strips `-`/`+` on paste.

```html
<input matInput type="number" libNoNegativeValues [formField]="form.daysForReport" />
```

---

### 2️⃣ `LocaleDecimalInputDirective`

**Purpose:** Accept decimal input with locale-specific separator (`,` for es-ES, `.` for en-US).
**What it does:**

- Changes `type="text"` + `inputMode="decimal"`
- On focus: displays raw editable numeric format
- On blur: parses locale string → JS `number` → formats with `Intl.NumberFormat`
- Enforces max decimal places (`[decimals]="2"`)

```html
<input matInput libLocalDecimal [decimals]="2" [minDecimals]="1" [formField]="form.initialVelocity" />
```

---

### 3️⃣ `NoLeadingZerosDirective`

**Purpose:** Strip leading zeros on integer inputs (e.g. `01` → `1`).

```html
<input matInput type="number" libNoLeadingZeros [formField]="form.daysUntilDeadline" />
```

---

## 📋 INTAQALAB Context: Input Constraints by Domain

### Planning (`libs/domain/trial/planning`)

| Field                             | Type    | Min | Max   | Directive                                              | Decimals | Example | Notes                          |
| --------------------------------- | ------- | --- | ----- | ------------------------------------------------------ | -------- | ------- | ------------------------------ |
| **Max days for report**           | integer | 1   | 120   | `NoNegativeValuesDirective`, `NoLeadingZerosDirective` | —        | 20      | Days until report delivery     |
| **Percentage for tech units**     | integer | 0   | 100   | `NoNegativeValuesDirective`                            | —        | 40      | % of time for unit validations |
| **Percentage for trial sign-off** | integer | 0   | 100   | `NoNegativeValuesDirective`                            | —        | 60      | % time to sign off             |
| **Days for report signature**     | integer | 0   | 30    | `NoNegativeValuesDirective`, `NoLeadingZerosDirective` | —        | 1       | Margin days for signature      |
| **V0c Min/Max Criteria**          | decimal | 0   | 2000  | `LocaleDecimalInputDirective`                          | 2        | 800.50  | Initial velocity range (m/s)   |
| **Pressure Min/Max Criteria**     | decimal | 0   | 50000 | `LocaleDecimalInputDirective`                          | 1        | 2500.5  | Pressure range (MPa/bar)       |

### Execution (`libs/domain/trial/execution`)

| Field                     | Type    | Min    | Max    | Directive                                              | Decimals | Example | Notes               |
| ------------------------- | ------- | ------ | ------ | ------------------------------------------------------ | -------- | ------- | ------------------- |
| **Initial Velocity (V0)** | decimal | 0      | 2000   | `LocaleDecimalInputDirective`                          | 2        | 850.75  | m/s, physics ≥ 0    |
| **Piezo Pressure**        | decimal | 0      | 50000  | `LocaleDecimalInputDirective`                          | 1        | 3200.4  | MPa or bar          |
| **Manometer Pressure**    | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                          | 2        | 2450.25 | Backup pressure     |
| **Projectile Weight**     | decimal | 0      | 100000 | `LocaleDecimalInputDirective`                          | 3        | 12.500  | grams               |
| **Fuze Weight**           | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                          | 3        | 125.750 | grams               |
| **Shot Number**           | integer | 1      | 999    | `NoNegativeValuesDirective`, `NoLeadingZerosDirective` | —        | 5       | Must be ≥ 1         |
| **Coordinate X/Y**        | decimal | -10000 | 10000  | `LocaleDecimalInputDirective`                          | 2        | 1250.75 | Can be negative     |
| **Height Z**              | decimal | 0      | 5000   | `LocaleDecimalInputDirective`                          | 2        | 450.50  | Height (always ≥ 0) |
