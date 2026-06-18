# 🏗️ Guía Oficial de Estilo de Código: Frontend (Angular & Nx)

Esta guía establece los estándares de desarrollo para todo el monorepo. Nuestro objetivo es garantizar que el código sea predecible, escalable, y que aproveche al máximo las nuevas características de **Angular 21+** y la arquitectura **Zoneless**, fomentando el cumplimiento innegociable de los **principios SOLID**.

---

## 📑 Tabla de Contenidos (Índice)

1. [Reactividad y Componentes (Signals-First)](#1-reactividad-y-componentes-signals-first)
2. [Template Control Flow (Control de Flujo Nativo)](#2-template-control-flow-control-de-flujo-nativo)
3. [Formularios (Signal Forms)](#3-formularios-signal-forms)
4. [Patrones de Diálogos (Material Dialog)](#4-patrones-de-dialogos-material-dialog)
5. [Maquetación Transversal (UI, a11y & Tailwind)](#5-maquetacion-transversal-ui-a11y--tailwind)
6. [Estructura del Proyecto y Naming](#6-estructura-del-proyecto-y-naming)
7. [Convenciones Generales y Checklist PR](#7-convenciones-generales-y-checklist-pr)

> **Nota para Agentes IA y Desarrolladores:** Gran parte de la arquitectura del repositorio se ha modularizado. Por favor, consulta la carpeta `docs/` para detalles de:
> - Arquitectura y Capas (`docs/ARCHITECTURE.md`)
> - SignalStore y HTTP (`docs/STATE_MANAGEMENT.md`)
> - Testing con Vitest y ATL (`docs/TESTING.md`)
> - Glosario de Negocio (`docs/DOMAIN_LANGUAGE.md`)
> - Configuración de Nx (`docs/NX.md`)
> - Internacionalización (`docs/I18N.md`)
> - Validaciones (`docs/VALIDATION.md`)

---

## 🛠️ Stack Tecnológico Mandatory

- **Framework:** Angular 21+ (Ejecución **Zoneless** por defecto).
- **Control de Flujo de Datos:** **Principios SOLID** implementados. Servicios delegados (Single Responsibility Principle) e inversión de dependencias usando `inject()`.
- **Fuente de la Verdad:** **NgRx SignalStore** (`@ngrx/signals`) actúa siempre como la **Única Fuente de la Verdad**.
- **Reactividad de UI:** **Signals-first**. Prohibido el uso de RxJS para el estado local.
- **Formularios:** **Angular Signal Forms** (`@angular/forms/signals`).
- **Data Fetching:** **`httpResource`** nativo de Angular.
- **UI & Layout:** **Angular Material** + **Tailwind CSS** (Clases utilitarias en el template).
- **Testing:** **Vitest** + **Angular Testing Library (ATL)**.

---

## 1. ⚡ Reactividad y Componentes (Signals-First)

Confía puramente en la reactividad basada en Signals. No uses `ChangeDetectorRef`, `NgZone`, ni decoradores antiguos (`@Input()`, `@Output()`).

### Reglas:

- **Inputs/Outputs/Models**: Usa las funciones reactivas `input()`, `output()`, y `model()`.
- **Efectos**: Usa `effect()` en el `constructor()` para reaccionar a cambios en el Store, actualizaciones HTTP o sincronización local.
- **Inyección de Dependencias (SOLID - DIP)**: Usa la función `inject()` explícitamente y evita inyectar por parámetro de constructor.

```typescript
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

@Component({
  selector: 'inta-feature-example',
  template: `
    ...
  `,
})
export class FeatureExampleComponent {
  // ✅ Usa inject() y campos privados nativos de JS (#)
  protected readonly store = inject(FeatureStore);

  // ✅ Signals locales privados
  readonly #cachedItems = signal<Item[]>([]);

  constructor() {
    // ✅ Reacciona siempre a signals sin romper el ciclo de ejecución
    effect(() => {
      const items = this.store.items() ?? [];
      if (items.length) {
        this.#cachedItems.set(items);
      }
    });
  }
}
```

---

## 2. 🔀 Template Control Flow (Control de Flujo Nativo)

A partir de Angular 17+, el control de flujo forma parte del motor propio del compilador de plantillas, siendo mucho más rápido, conciso y tipado. **El uso de directivas estructurales clásicas queda estrictamente prohibido.**

### Reglas Innegociables:

- **NADA DE `*ngIf`, `*ngFor` O `*ngSwitch`**: Prohibido importar el `CommonModule`. Usa la sintaxis de bloque nativa `@if`, `@for` y `@switch`.
- **Atributo `track` obligatorio**: Todo bucle `@for` debe poseer un trackeador único de su identidad. Prohibido usar el `$index` nativo si la entidad tiene un ID (usa siempre `track item.id` o propiedad inmutable).
- **Comodidad del `@empty`**: Utiliza el bloque `@empty` incluido dentro del bucle `@for` para el caso en el que la colección esté vacía.

```html
<!-- ❌ PROHIBIDO -->
<div *ngIf="isLoading()">Cargando...</div>
<div *ngFor="let item of items()">{{ item.name }}</div>

<!-- ✅ ESTÁNDAR OBLIGATORIO -->
@if (store.isLoading()) {
<div>Cargando...</div>
} @else if (store.hasError()) {
<div>Error cargando datos...</div>
} @else {
<ul>
  @for (item of store.items(); track item.id) {
  <li>{{ item.name }}</li>
  } @empty {
  <li>No se encontraron resultados.</li>
  }
</ul>
}
```

---

## 3. 🛡️ Formularios (Signal Forms)

Abandonamos el uso clásico de `FormBuilder`, `FormGroup`, intermediarios (`patchValue()`) y el **totalmente prohibido bidireccional puro clásico `[(ngModel)]`**. El control reactivo del input UI se realiza siempre de manera unidireccional y robusta con Forms reactivos.

### Reglas:

- **PROHIBIDO `[(ngModel)]`**: Nunca utilices el módulo `FormsModule` antiguo.
- **Actualización Intuitiva**: ¡Para actualizar un formulario basta con **actualizar el modelo (signal) subyacente**! `this.formModel.set(data)` provocará la repoblación de toda la vista.
- **Validación Angular Signal Forms**: Construimos el árbol del form conectándolo en el template con `[formField]="myForm.property"`.
- **Deshabilitado Visual Rápido**: Para bloquear un botón submit comprueba `[disabled]="myForm().invalid()"`.
- Usa la acción asíncrona de `submit()` nativa.

```typescript
import { Component, signal } from '@angular/core';
import { FormField, disabled, form, required, submit, validate } from '@angular/forms/signals';

@Component({
  selector: 'inta-my-form',
  template: `
    <form (ngSubmit)="onSave()">
      <mat-form-field appearance="outline">
        <input matInput [formField]="myForm.title" />
      </mat-form-field>
      <button mat-flat-button type="submit" [disabled]="myForm().invalid()">Guardar</button>
    </form>
  `,
})
export class MyFormComponent {
  readonly formModel = signal<FeatureData>({ title: '', status: 'DRAFT' });

  readonly myForm = form(this.formModel, (f) => {
    required(f.title);
    disabled(f.status, () => this.store.isLoadingStore());
  });

  populateFormFromBackend(data: FeatureData) {
    this.formModel.set(data);
  }

  async onSave() {
    await submit(this.myForm, async () => {
      const data = this.myForm().value();
      this.store.saveData(data); // Delega la mutación al store
    });
  }
}
```

<!-- Section HTTP Resource and Store were moved to docs/STATE_MANAGEMENT.md -->

---

## 6. 🎨 Maquetación Transversal (UI, a11y & Tailwind)

Unificar la interfaz minimizando abstracciones CSS obsoletas garantiza escalabilidad.

- **Material Components Extensivos**: Usa `Angular Material` para controles interactivos y modales como prioridad cero.
- **Tailwind CSS Utility First**: Emplea utilidades tailwind (`flex`, `grid`, `gap`, paddings) embebidas en el atributo de clase para la estructura del template.
- **Prohibido Scss de Layout**: No está permitido crear archivos scss/css de componente para alterar layouts resueltos por Tailwind.
- **Accesibilidad (a11y)**: Todo `<mat-form-field>` moderno DEBE forzosamente tener una etiqueta vinculada `<label [for]="mi-input">` al lado de un `<input id="mi-input">`.

```html
<main class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
  <div class="flex flex-col">
    <label for="search-input" class="block text-sm font-medium text-gray-700 mb-2">Término de Búsqueda</label>
    <mat-form-field appearance="outline" class="w-full">
      <input id="search-input" matInput type="text" [formField]="form.search" />
    </mat-form-field>
  </div>
</main>
```

<!-- Section Testing was moved to docs/TESTING.md -->

---

## 8. 📁 Estructura del Proyecto y Naming

Aseguramos un layout claro para cada dominio/feature dentro de la arquitectura de Nx:

```
libs/domain/<domain>/src/lib/
├── +state/                    # Stores NgRx signalStore (<entity>.store.ts)
├── components/                # Componentes UI organizados por vistas
├── services/                  # Servicios HTTP Delegados y features globales (<entity>-service.ts)
├── models/                    # Modelos DTOs de transacciones API backend (<entity>.model.ts)
├── utils-models/              # Modelos locales, funciones de factories o mapeos (<entity>.model.ts)
└── <domain>.data.routes.ts    # Lazy routes
```

### Naming Conventions:

- **Store**: `PascalCase` + `Store` (e.g. `FeatureStore`)
- **Service**: `PascalCase` + `Service` (e.g. `FeatureService`)
- **Component**: `PascalCase` (sin sufijo de feature) (e.g. `FeaturePanelComponent`)
- **Private Fields**: `camelCase` precedidos por `#` (e.g. `#service = inject(Service)`)

---

## 9. 🧩 Modelos y Tipos

- **Únicamente `type`**: Usa `type` en lugar de `interface` para definir modelos de datos por su previsibilidad.
- **Separación de Tráfico**: Diferencia explícitamente DTOs en `XxxRequest` y `XxxResponse`.
- **Funciones Factory**: Emplea funciones de factory del tipo `createEmptyEntity()` devolviendo objetos vacíos inicializados para que los `signal()` de modelos partan de contextos limpios.

```typescript
export type EntityResponse = {
  id: string;
  denomination: string;
  batch?: string;
  observations?: string;
};

export function createEmptyEntity(): EntityResponse {
  return { id: '', denomination: '' };
}
```

<!-- Nx rules moved to docs/NX.md -->
