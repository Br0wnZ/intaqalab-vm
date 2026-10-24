---
name: numeric-input-constraints
version: 1.1.0
last-updated: 2026-10-24
description: Use when creating or changing decimal inputs, localized numeric display, precision, unit conversions, numeric mappers or backend payloads. Defines the no-rounding contract for multilingual views, LOCALE_SIGNAL, libLocalDecimal, InputSelect, SoundLevelMeterInput and JSON numbers, plus domain min/max validation.
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
- Preventing user errors: leading zeros, invalid signs, out-of-range values, and precision loss

---

## Decimal Contract: View, State, Backend (Mandatory)

This skill owns the numeric contract. UI, i18n, API, charts and testing skills must reuse it instead of defining different precision rules.

1. **State and HTTP:** Keep measurements as finite `number | null` wherever the API contract is numeric. Localized strings belong only to editing/display. JSON must contain `3.46`, never `"3,46"`, `"3.46"` or a grouped string. Preserve `null`, zero, optional/omitted fields and PATCH semantics according to the endpoint schema; never turn empty input into zero automatically.
2. **No rounding or truncation:** Never apply `toFixed`, `toPrecision`, `Math.round`, `Math.ceil`, `Math.floor`, fractional slicing or a fixed `maximumFractionDigits` to measurements, mapper results, derived values, chart statistics or tooltips. Integer fields must reject non-integers, not silently round them. Index calculations, time decomposition and progress indicators are not measurements.
3. **Display:** Reuse `formatPreciseNumber(value, locale, minimumFractionDigits)` from `@intaqalab/utils`, or the `intaDecimal` pipe. The helper selects sufficient precision for the existing numeric value, including scientific notation. `minDecimals` and the minimum fraction part of `digitsInfo` may add trailing zeros; they must never remove existing digits. Do not use Angular `number`/`DecimalPipe` or plain `toLocaleString()` defaults for measurements: their default maximum precision can round values.
4. **Editing:** Reuse `libLocalDecimal`, `ui-input-select` or `ui-sound-level-meter-input`. Preserve all digits while typing, pasting, loading external values, switching units, focusing and blurring repeatedly. The legacy `decimals` input is compatibility-only, NOT a precision limit. Do not recreate decimal parsers or clipboard sanitizers in widgets.
5. **Locale:** Consume reactive `LOCALE_SIGNAL`, not hardcoded `es-ES`, browser language or translation text. Inspect `AppLocale`, `LanguageService` and `provideLocaleSignal()` before claiming support. Current numeric locales are `es-ES` and `en-US`; translation catalogs alone do not enable `de-DE`. A newly enabled locale requires coordinated token/provider/input separator handling and tests; derive separators with `Intl.NumberFormat(...).formatToParts()` when extending support.
6. **Parsing boundary:** Normalize localized input exactly once in the shared control. Backend numeric values and canonical decimal strings are not localized input. Never parse `String(3.46)` with an ES parser that treats `.` as a grouping separator. `parseFloat('3,46')` is invalid for this contract because it yields `3`; a comma replacement alone is insufficient for grouped input. Reuse the owning mapper/control appropriate to the source format.
7. **Units and derived values:** Keep the full arithmetic result; do not round to hide floating-point artifacts. A display/locale/unit change must not write a converted-and-reconverted value back to the base state. Read-only or disabled fields must not be parsed and overwritten on focus/blur. A save without edits must preserve values loaded from the API.
8. **Limits:** JavaScript `number` remains IEEE-754, not arbitrary decimal arithmetic. This policy removes intentional precision loss; it cannot restore backend precision or represent arbitrary decimal strings exactly. Do not change API numeric types, introduce decimal libraries or promise lossless arbitrary precision without an agreed contract change.

```typescript
import { formatPreciseNumber } from '@intaqalab/utils';

const coordinate: number = 3.46;
formatPreciseNumber(coordinate, 'es-ES'); // '3,46'
formatPreciseNumber(coordinate, 'en-US'); // '3.46'
const request = { pieceX: coordinate }; // JSON number, independent of UI language
```

## Required Regression Checks

- Parameterize editing/display tests with actual supported `AppLocale` values. For ES enter `3,46`; for EN enter `3.46`; both must save numeric `3.46` with exact `toBe`/payload assertions, not only `toBeCloseTo`.
- Cover API load -> render -> focus -> blur twice -> save, both changed and unchanged; verify display, store, payload and clean/dirty tracking.
- Cover typing and pasting extra decimal digits, zero, negative values where allowed, empty/null, grouped display, very small numbers/scientific notation, external value updates and locale changes.
- Cover internal and projected inputs in `InputSelect`, all X/Y/Z axes in `SoundLevelMeterInput`, individual saves and bulk configuration. Test readonly/disabled fields and unit changes without edits.
- Assert values are finite numbers or schema-appropriate null/omitted fields, never localized strings, `NaN`, infinity or accidental zero.
- Reuse existing specs: shared `locale-decimal-input.directive`, `inta-decimal.pipe`, `input-select`, `sound-level-meter-input`, and the touched widget/mapper/service. Run focused Nx tests and lint; changing shared behavior requires checking its consumers.

Implementation policy and numeric limits are also documented in [VALIDATION.md](../../../docs/VALIDATION.md).

---

## 🚨 CRITICAL: Signal Forms + `[formField]` Directive

> ⚠️ **When using Angular Signal Forms with `[formField]` directive, HTML attributes `min` and `max` DO NOT WORK.**
>
> **Apply `min()` and `max()` from `@angular/forms/signals` in the form schema. HTML attributes alone are not a validation policy.**

### Why?

The `[formField]` directive in Signal Forms manages validation through TypeScript validators, not HTML attributes. HTML `min/max` attributes are ignored and will not prevent invalid submissions.

### ✅ DO THIS:

```typescript
import { signal } from '@angular/core';
import { form, max, min } from '@angular/forms/signals';

protected readonly model = signal({ age: 1 });
protected readonly ageForm = form(this.model, (fields) => {
  min(fields.age, 1);
  max(fields.age, 150);
});
```

```html
<!-- HTML Template: NO min/max attributes -->
<input type="number" libNoNegativeValues [formField]="ageForm.age" />
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
- On blur: parses supported locale input to JS `number`, then displays it through `formatPreciseNumber`
- Preserves existing, typed and pasted digits; `decimals` does not cap precision
- Uses `minDecimals` only to pad trailing zeros; `numericSign` expresses allowed signs

```html
<input matInput libLocalDecimal [minDecimals]="1" [formField]="form.initialVelocity" />
```

---

### 3️⃣ `NoLeadingZerosDirective`

**Purpose:** Strip leading zeros on integer inputs (e.g. `01` → `1`).

```html
<input matInput type="number" libNoLeadingZeros [formField]="form.daysUntilDeadline" />
```

---

## 📋 INTAQALAB Context: Input Constraints by Domain

The `Decimals` column below describes examples, NOT maximum precision or rounding instructions. Verify min/max and sign constraints against the current functional/API contract; never infer decimal limits from examples.

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
