# 🏗️ Guía Oficial de Estilo de Código: Frontend (Angular & Nx)

Esta guía establece los estándares de desarrollo para todo el monorepo. Nuestro objetivo es garantizar que el código sea predecible, escalable y que aproveche al máximo las capacidades de **Angular 21+** y la arquitectura **Zoneless**, fomentando el cumplimiento estricto de los **principios SOLID**.

---

## 📑 Tabla de Contenidos (Índice)

1. [Golden Path de Referencia](#golden-path-de-referencia)
2. [Stack Tecnológico Mandatorio](#️-stack-tecnológico-mandatory)
3. [Reactividad y Componentes (Signals-First)](#1--reactividad-y-componentes-signals-first)
4. [Control de Flujo Nativo (Control Flow)](#2--template-control-flow-control-de-flujo-nativo)
5. [Formularios Reactivos (Signal Forms Estables)](#3-️-formularios-signal-forms)
6. [Patrones de Diálogos (Material Dialog)](#4--patrones-de-diálogos-material-dialog)
7. [Maquetación Transversal (UI, a11y & Tailwind)](#5--maquetación-transversal-ui-a11y--tailwind)
8. [Estructura del Proyecto, Mappers y Naming](#6--estructura-del-proyecto-mappers-y-naming)
9. [Modelos, Tipos y Factory Patterns](#7--modelos-y-tipos)
10. [Testing con Vitest y ATL](#8--estrategia-de-testing-vitest--atl)

> **Nota para Desarrolladores y Agentes IA:** Consulta la documentación complementaria en `docs/`:
>
> - Arquitectura y Capas (`docs/ARCHITECTURE.md`)
> - SignalStore y HTTP (`docs/STATE_MANAGEMENT.md`)
> - Catálogo de Utilidades Reactivas (`docs/UTILITIES.md`)
> - Testing con Vitest y ATL (`docs/TESTING.md`)
> - Glosario de Dominio (`docs/DOMAIN_LANGUAGE.md`)
> - Convenciones de Nx (`docs/NX.md`)
> - Internacionalización (`docs/I18N.md`)
> - Restricciones Numéricas y Validaciones (`docs/VALIDATION.md`)

---

## 🌟 Golden Path de Referencia

> [!IMPORTANT]
> La librería `libs/domain/master-data` es el **Golden Path** oficial del repositorio INTAQALAB.
> Cualquier implementación de nuevos dominios, integración de `httpResource`, servicios de mapeo o tiendas `SignalStore` debe tomar como plantilla canónica el código de `libs/domain/master-data` y su `README.md`.

---

## 🛠️ Stack Tecnológico Mandatory

- **Framework:** Angular 21+ (Ejecución **Zoneless** por defecto, standalone components).
- **Fuente de la Verdad:** **NgRx SignalStore** (`@ngrx/signals`) para el estado global y de dominio.
- **Inyección de Dependencias (SOLID):** Inyección funcional mediante `inject()` y miembros privados `#`. Prohibida la inyección por constructor.
- **Servicios Singleton:** Decorador `@Service()` de `@angular/core` en lugar del legacy `@Injectable({ providedIn: 'root' })`.
- **Reactividad de UI:** **Signals-first** (`signal`, `computed`, `linkedSignal`, `effect`). Prohibido RxJS para el estado local o de vista.
- **Formularios:** **Angular Signal Forms** (`form()`, `control()`, directiva `[formField]`).
- **Data Fetching:** **`httpResource`** nativo de Angular con el **Signal Trigger Pattern**.
- **Utilidades del Proyecto:** Uso mandatorio de `@intaqalab/utils` (debounce, throttle, storage, params, countdown).
- **UI & Layout:** **Angular Material** (Aria/Headless) + **Tailwind CSS** (clases inline, cero SCSS).
- **Testing:** **Vitest** + **Angular Testing Library (ATL)** + **Component Harnesses**.

---

## 1. ⚡ Reactividad y Componentes (Signals-First)

Confía exclusivamente en la reactividad basada en Signals. No uses `ChangeDetectorRef`, `NgZone`, ni decoradores antiguos (`@Input()`, `@Output()`, `@ViewChild()`).

### Reglas:

- **Inputs/Outputs/Models**: Usa las funciones reactivas `input()`, `output()`, y `model()`.
- **Signal Queries**: Usa `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`.
- **Estado Derivado Writable (`linkedSignal`)**: Para estado que depende de una señal fuente pero puede ser modificado por el usuario, usa `linkedSignal()` en lugar del antipatrón `signal + effect`.
- **Inyección Privada del Store**: Prohibido acceder directamente al store en la plantilla HTML (`store.isLoading()`). Inyecta el store de forma privada (`readonly #store = inject(Store)`) y expón señales computadas (`readonly isLoading = computed(() => this.#store.isLoading());`).
- **Clonado Profundo**: Prohibido `JSON.parse(JSON.stringify(obj))`. Usa siempre la API nativa `structuredClone(obj)`.
- **Comparaciones Estrictas**: Todas las comparaciones deben ser estrictas (`===` o `!==`).

```typescript
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { FeatureStore } from './+state/feature.store';

@Component({
  selector: 'inta-feature-example',
  template: `
    @if (isLoading()) {
      <ui-skeleton />
    } @else {
      <div class="flex flex-col gap-4 p-4">
        <h2>{{ selectedItem()?.name }}</h2>
      </div>
    }
  `,
})
export class FeatureExample {
  // ✅ Inyección funcional con campo privado nativo
  readonly #store = inject(FeatureStore);

  // ✅ Señales computadas expuestas para la vista
  protected readonly isLoading = computed(() => this.#store.isLoading());
  protected readonly items = computed(() => this.#store.items());

  // ✅ Estado derivado writable con linkedSignal
  protected readonly selectedItem = linkedSignal(() => this.items()[0] ?? null);
}
```

---

## 2. 🔀 Template Control Flow (Control de Flujo Nativo)

El uso de directivas estructurales clásicas (`*ngIf`, `*ngFor`, `*ngSwitch`) y la importación de `CommonModule` están **estrictamente prohibidos**.

### Reglas:

- **Control Flow**: Usa `@if`, `@for`, `@switch` y `@empty`.
- **Track Obligatorio**: Todo bucle `@for` debe incluir `track item.id` (o identificador único inmutable).
- **Carga Perezosa con `@defer`**: Implementa `@defer` con sub-bloques `@placeholder` y `@loading` para diferir la carga de componentes pesados o por debajo del scroll.

```html
@if (isLoading()) {
<ui-skeleton-card />
} @else if (hasError()) {
<div class="text-client-error">{{ 'ERRORS.LOADING_ERROR' | translate }}</div>
} @else {
<ul class="flex flex-col gap-2">
  @for (item of items(); track item.id) {
  <li class="p-3 rounded-lg border bg-client-surface">{{ item.name }}</li>
  } @empty {
  <li class="text-gray-500">{{ 'COMMONS.NO_RESULTS' | translate }}</li>
  }
</ul>
}
```

---

## 3. 🛡️ Formularios (Signal Forms)

Los formularios se gestionan mediante la API moderna `form()` de `@angular/forms/signals`. Quedan eliminados `ReactiveFormsModule`, `FormBuilder`, `FormGroup` y el bidireccional clásico `[(ngModel)]`.

### Reglas:

- **Fuente de Verdad en el Modelo**: El modelo (`signal`) es la única fuente de verdad. La lectura y el reseteo se realizan directamente sobre el modelo (`this.model()`, `this.model.set(initial)`), nunca sobre `form().reset()`.
- **Configuración de Estados**: Es obligatorio usar el objeto de configuración `{ when: () => condition }` para `disabled`, `readonly` y `hidden`.
- **Directiva `[formField]`**: Vincula los campos con `[formField]="myForm.property"`.
- **Botón de Guardado `<ui-save-button>`**: Es **MANDATORIO** usar `<ui-save-button>` (`SaveButton` de `@intaqalab/ui`) con `[isSaving]="isSaving()"` para cualquier acción de guardado o submit. Prohibido usar `mat-flat-button` plano para guardar formularios.

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SaveButton } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'inta-munition-form',
  imports: [MatFormFieldModule, MatInputModule, FormField, SaveButton, TranslateModule],
  template: `
    <div class="flex flex-col gap-4 p-4">
      <mat-form-field floatLabel="always" class="w-full">
        <mat-label>{{ 'WAREHOUSE.FIELDS.DENOMINATION' | translate }}</mat-label>
        <input
          matInput
          [placeholder]="'WAREHOUSE.FIELDS.DENOMINATION_PLACEHOLDER' | translate"
          [formField]="form.denomination"
        />
      </mat-form-field>

      <div class="flex justify-end">
        <ui-save-button [isSaving]="isSaving()" [disabled]="form().invalid()" (save)="onSave()" />
      </div>
    </div>
  `,
})
export class MunitionForm {
  readonly #store = inject(MunitionStore);
  protected readonly isSaving = computed(() => this.#store.isSaving());

  // El modelo es la fuente de verdad
  protected readonly model = signal<MunitionDto>({ denomination: '' });

  protected readonly form = form(this.model, (schema) => {
    schema.denomination.required();
    schema.denomination.disabled({ when: () => this.isSaving() });
  });

  async onSave(): Promise<void> {
    if (this.form().invalid()) return;
    await this.#store.saveMunition(this.model());
  }
}
```

---

## 4. 🪟 Patrones de Diálogos (Material Dialog)

Los modales y diálogos de confirmación o formulario basados en `MatDialog` siguen este estándar estricto:

### Reglas:

- **Tipado Explícito**: Tipar siempre los datos de entrada (`MAT_DIALOG_DATA`) y el resultado de retorno como discriminated union (`{ action: 'confirm'; id: string } | { action: 'cancel' }`).
- **Apertura Asíncrona**: Consumir `afterClosed()` mediante `await firstValueFrom(dialogRef.afterClosed())` en lugar de suscripciones anidadas.
- **Acciones**: Botón de cancelar con `[mat-dialog-close]="{ action: 'cancel' }"` y botón de confirmación con `<ui-save-button>` si realiza mutaciones.

---

## 5. 🎨 Maquetación Transversal (UI, a11y & Tailwind)

- **Angular Material Obligatorio**: Si necesitas un input, selector, switch, tabla, modal, tabs o panel expansible, usa la versión nativa de `@angular/material`.
- **Inline Tailwind (Cero SCSS)**: Toda utilidad de layout (flex, grid, gap, padding, color, tipografía) debe declararse inline en el atributo `class=""` del HTML. Prohibido crear archivos SCSS por componente.
- **Tokens de Diseño**: Usa la paleta semántica del proyecto (`text-client-primary`, `bg-client-button`, `text-client-error`, `bg-client-surface`).
- **Labels Flotantes y Placeholders OBLIGATORIOS**: Todos los controles de formulario (`matInput`, `mat-select`) DEBEN incluir `<mat-label>{{ '...' | translate }}</mat-label>` con `floatLabel="always"` dentro de `<mat-form-field>` y placeholder i18n (`[placeholder]="'...' | translate"`). Prohibidas etiquetas `<label>` o `<span>` externas.
- **Vistas de 3 Estados**: Toda pantalla o componente que cargue datos remotos debe implementar estados explícitos de `isLoading()` (con `ui-skeleton`), `error()` (con mensaje traducido) y estado de éxito con datos.

---

## 6. 📁 Estructura del Proyecto, Mappers y Naming

Alineado con la guía de estilo oficial de Angular (2025/2026):

### Convenciones de Nombres:

- **Archivos de Componentes/Directivas/Pipes**: Omitir el sufijo técnico del archivo (ej. `munition-form.ts` en vez de `munition-form.component.ts`, `status-badge.pipe.ts` -> `status-badge.ts`).
- **Clases de Componentes/Directivas/Pipes**: Omitir el sufijo técnico en el nombre de la clase (ej. `MunitionForm` en lugar de `MunitionFormComponent`).
- **Servicios**: Mantienen obligatoriamente el sufijo técnico (ej. `munition.service.ts` y clase `MunitionService`).
- **Mappers Dedicados (`<feature>-mapper.service.ts`)**: Toda lógica de transformación pesada backend ↔ frontend, cruce de catálogos o adaptaciones de DTO debe extraerse a un servicio mapper dedicado (ej. `ArmamentMapperService`). Los componentes deben mantenerse delgados y enfocados únicamente en la interacción y la vista.

```
libs/domain/[dominio]/src/lib/
├── +state/                    # Stores NgRx SignalStore ([entidad].store.ts)
├── components/                # Componentes presentacionales o widgets ([nombre].ts)
├── services/                  # Servicios de datos httpResource ([entidad].service.ts)
├── mappers/                   # Servicios de transformación ([entidad]-mapper.service.ts)
├── models/ o utils-models/    # Tipos TypeScript, DTOs y factories ([entidad].models.ts)
└── [dominio].routes.ts        # Enrutamiento lazy
```

---

## 7. 🧩 Modelos y Tipos

- **Únicamente `type`**: Usa `type` en lugar de `interface` para definir modelos de datos por su previsibilidad y composibilidad.
- **Ubicación Estricta**: Todos los tipos, interfaces y enums DEBEN declararse en la carpeta `models` o `utils-models` de la librería correspondiente. Prohibido declarar tipos inline en componentes o servicios.
- **Separación de Tráfico**: Diferencia explícitamente DTOs de petición y respuesta (`XxxRequest` vs `XxxResponse`).
- **Funciones Factory**: Exporta funciones factory `createEmptyEntity()` para inicializar modelos y señales con estados limpios.

---

## 8. 🧪 Estrategia de Testing (Vitest + ATL)

- **Test Runner**: Vitest (usa utilidades `vi`, nunca Jest).
- **Testing Comportamental**: Evalúa interacciones simulando al usuario con `@testing-library/angular` (`render`, `screen`) y `@testing-library/user-event`.
- **Component Harnesses Obligatorios**: Usa siempre `@angular/material/*/testing` para interactuar con componentes Material en los specs.
- **Mocks Tipados**: Usa `createMockResource()` de `@intaqalab/utils/testing/core` y `provideTestingEnvironment()` de `@intaqalab/config`.
- **Idioma de Tests**: Todas las descripciones de casos de prueba (`it('should...')`) DEBEN estar redactadas obligatoriamente en **inglés**.
- **Sin Aserciones No Nulas**: Prohibido usar `!` (non-null assertions) en los tests para evitar alertas de linter (`Forbidden non-null assertion`).

---

## 📋 Checklist Obligatorio para Pull Requests

Antes de solicitar revisión o dar por finalizada una tarea, verifica:

- [ ] Cero errores de compilación y linter (`npx nx run-many -t lint`).
- [ ] Todos los tests unitarios pasan en verde (`npx nx test <proyecto>`).
- [ ] Todo el código nuevo sigue el estándar Signals-first y Zoneless.
- [ ] Los textos visibles usan `@ngx-translate` con claves en `es.json`, `en.json` y `de.json`.
- [ ] Los formularios usan Signal Forms y `<ui-save-button>`.
- [ ] No existen archivos SCSS dedicados a layouts resueltos por Tailwind.
- [ ] Todos los archivos y comentarios técnicos están en UTF-8 estricto.
