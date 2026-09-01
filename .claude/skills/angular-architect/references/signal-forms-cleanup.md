# Signal Forms — Legacy Cleanup

## The Problem

Components adopting modern `form()` from `@angular/forms/signals` frequently keep legacy imports of `ReactiveFormsModule`/`FormsModule` or `FormBuilder`, adding unnecessary bundle overhead.

---

## General Rule

```typescript
// ❌ REMOVE when component uses signal-based form():
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// ✅ KEEP only required signal forms imports:
import { FormField, form } from '@angular/forms/signals';
```

---

## Component Cleanup Checklist

### Step 1: Verify Signal Forms Usage

```typescript
import { form } from '@angular/forms/signals';
readonly myForm = form(this.formModel);
```

### Step 2: Remove Legacy Modules from `imports`

```typescript
// Before ❌
@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,  // ← REMOVE
    FormsModule,          // ← REMOVE (if ngModel not used)
    MatInputModule,
  ]
})

// After ✅
@Component({
  imports: [
    FormField,
    MatInputModule,
  ]
})
```

### Step 3: Enforce State Configuration

Use the configuration object `{ when: () => condition }` for `disabled`, `readonly`, and `hidden` properties:

```typescript
// ✅ CORRECT
disabled: {
  when: () => this.isReadonly();
}
```
