# Signal Forms — Limpieza de Legacy

## El Problema

El proyecto usa correctamente `form()` de `@angular/forms/signals` pero mantiene imports de
`ReactiveFormsModule`/`FormsModule` que son innecesarios y añaden peso al bundle.

---

## Regla General

```typescript
// ❌ ELIMINAR cuando el componente usa form() de signals:
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// ✅ MANTENER solo las imports necesarias:
import { FormField, form } from '@angular/forms/signals';
```

---

## Checklist de limpieza por componente

### Paso 1: Verificar si el componente usa form() de signals

```typescript
// Si el componente tiene esto → es Signal Forms
import { form } from '@angular/forms/signals';
readonly myForm = form(this.formModel);
```

### Paso 2: Eliminar ReactiveFormsModule del array imports

```typescript
// Antes ❌
@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,  // ← ELIMINAR
    FormsModule,          // ← ELIMINAR (si no se usa ngModel)
    MatInputModule,
    // ...
  ],
})

// Después ✅
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormField,   // ← Solo si se usan directivas de signal forms en template
    MatInputModule,
    // ...
  ],
})
```

### Paso 3: Verificar que no quedan usos de FormBuilder

```typescript
// ❌ Si aún hay FormBuilder, NgForm, FormControl viejos → NO eliminar ReactiveFormsModule todavía
// Migrar primero esos controles a signal forms
```

---

## Archivos específicos del proyecto con este problema

### `munitions-shell.component.ts`

```typescript
// Línea 13 — ELIMINAR estas importaciones:
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Línea 47 en el array imports — ELIMINAR:
ReactiveFormsModule,
```

### `trial-docs.ts`

```typescript
// Eliminar ReactiveFormsModule del import y del array imports[]
// Este archivo YA usa form() correctamente
```

### `trial-scheduler-inline.component.ts`

```typescript
// Mismo patrón — eliminar imports legacy
```

---

## Directivas disponibles en Signal Forms

```typescript
import {
  FormField, // Directiva para vincular campos en el template
  form, // Factory para crear el formulario
} from '@angular/forms/signals';

// Uso en template:
// [formField]="myForm().fields.name"  ← vincula un campo del form
// [disabled]="!myForm().valid()"      ← estados del form como señales
// (click)="myForm().reset()"          ← métodos del form
```

---

## API completa de form() — referencia rápida

```typescript
const myForm = form(model, schema?);

// Acceso al form actual (es un signal → llamar como función)
myForm()

// Estado
myForm().valid()          // boolean signal
myForm().invalid()        // boolean signal
myForm().dirty()          // boolean signal
myForm().pristine()       // boolean signal
myForm().touched()        // boolean signal
myForm().untouched()      // boolean signal

// Valores y errores
myForm().value()          // T — valor actual del formulario
myForm().errors()         // ValidationErrors | null
myForm().errorSummary()   // string[] — array de mensajes de error

// Acceso a campos individuales
myForm().fields.myField   // Signal del campo

// Métodos
myForm().reset()                          // resetear a valores iniciales
myForm().reset({ field: value })          // resetear con valores específicos
myForm().markAsTouched()                  // marcar como tocado
myForm().markAllAsTouched()               // marcar todos los campos
myForm().setValue({ ... })                // establecer valor completo
```

---

## Validación con Zod (patrón del proyecto)

```typescript
import { form } from '@angular/forms/signals';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  quantity: z.number().min(0, 'Cantidad no puede ser negativa'),
});

// Pasar el schema como segundo argumento
readonly myForm = form(this.formModel, schema);

// En template:
// @if (myForm().fields.name.errors()) { ... }
```
