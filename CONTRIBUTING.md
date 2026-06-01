# 🏗️ Guía Oficial de Estilo de Código: Frontend (Angular & Nx)

Esta guía establece los estándares de desarrollo para todo el monorepo. Nuestro objetivo es garantizar que el código sea predecible, escalable, y que aproveche al máximo las nuevas características de **Angular 21+** y la arquitectura **Zoneless**, fomentando el cumplimiento innegociable de los **principios SOLID**.

---

## 📑 Tabla de Contenidos (Índice)

1. [Reactividad y Componentes (Signals-First)](#1-reactividad-y-componentes-signals-first)
2. [Template Control Flow (Control de Flujo Nativo)](#2-template-control-flow-control-de-flujo-nativo)
3. [Formularios (Signal Forms)](#3-formularios-signal-forms)
4. [HTTP Resource y Manejo del Éxito / Feedback](#4-http-resource-y-manejo-del-éxito--feedback)
5. [Single Source of Truth: NgRx SignalStore](#5-single-source-of-truth-ngrx-signalstore)
6. [Maquetación Transversal (UI, a11y & Tailwind)](#6-maquetación-transversal-ui-a11y--tailwind)
7. [Testing Estratégico y Calidad (Vitest + ATL)](#7-testing-estratégico-y-calidad-vitest--atl)
8. [Estructura del Proyecto y Naming](#8-estructura-del-proyecto-y-naming)
9. [Modelos y Tipos](#9-modelos-y-tipos)
10. [Inyección de Entorno y Rutas](#10-inyección-de-entorno-y-rutas)
11. [Patrones de Diálogos (Material Dialog)](#11-patrones-de-diálogos-material-dialog)
12. [Internacionalización (i18n)](#12-internacionalización-i18n)
13. [Convenciones Generales y Checklist PR](#13-convenciones-generales-y-checklist-pr)
14. [Generación de Código con Nx (Workspace & Tags)](#14-generación-de-código-con-nx-workspace--tags)

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

---

## 4. 💾 HTTP Resource y Manejo del Éxito / Feedback

Implementación basada en la separación de responsabilidades (SOLID): las llamadas ocurren de forma aislada e idempotente en los `Services`, las dispara el Store.

### Reglas:

- Las llamadas a `HttpClient.get().subscribe()` se desestiman. Se debe utilizar la API **`httpResource()`**.
- **Seguimiento del Feedback**: Escuchamos en un `effect()` del componente el `status` computado desde el SignalStore (`'resolved'` o `'rejected'`).

```typescript
// A. Capa de data-access
export class FeatureHttpService {
  readonly #params = signal<{ id: string } | null>(null);

  readonly fetchResource = httpResource<FeatureEntity>(() => {
    const p = this.#params();
    if (!p) return undefined;
    return { url: \`\${this.apiUrl}/\${p.id}\`, method: 'GET' };
  });

  setFetchParams(id: string) {
    this.#params.set({ id });
  }
}

// B. Component UI: Feedback local puro a través de efecto de store
export class BaseFeatureComponent {
  protected readonly store = inject(FeatureStore);

  constructor() {
    effect(() => {
      const status = this.store.saveActionStatus();
      if (status === 'resolved') {
        this.dialogRef.close();
        this.toastService.success('Operación exitosa');
      } else if (status === 'rejected') {
        this.toastService.error('Hubo un error');
      }
    });
  }
}
```

---

## 5. 🗃️ Single Source of Truth: NgRx SignalStore

**El estado no vivirá fragmentado**. Adoptamos como **Única Fuente de la Verdad** a NgRx SignalStore. Los componentes UI solo leen este store y despachan solicitudes a sus métodos.

### Reglas:

- Los componentes visuales asumen su estado central mediante `store.xxxx()`.
- Integra el servicio de `httpResource` en el Store mediante un `withComputed` para que el componente asimile estados limpios.

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const FeatureStore = signalStore(
  withState({ entityId: null }),

  withComputed((store, service = inject(FeatureHttpService)) => ({
    items: computed(() => service.fetchResource.value() ?? []),
    isLoading: computed(() => service.fetchResource.isLoading()),
    saveActionStatus: computed(() => service.saveResource.status()),
  })),

  withMethods((store, service = inject(FeatureHttpService)) => ({
    loadData(id: string): void {
      patchState(store, { entityId: id });
      service.setFetchParams(id);
    },
  })),
);
```

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

---

## 7. 🧪 Testing Estratégico y Calidad (Vitest + ATL)

El testado de UI debe ser puramente comportamental (testing-library) guiándose por los roles del dom tal y como los percibe el usuario.

### 7.1. Filosofía de Testing

- **Testea Comportamiento, no Implementación:** Usa queries accesibles (`getByRole`, `getByLabelText`, `getByText`) en lugar de selectores CSS o IDs.
- **Usuario Primero:** Simula interacciones reales usando `userEvent` (siempre asíncrono).
- **Evita el Boilerplate:** Prefiere la función `render` de ATL sobre la configuración manual de `TestBed`.
- **Clean Code:** Tests descriptivos (`it('should save the form when...')`). Patrón AAA (Arrange, Act, Assert).

### 7.2. Entorno Mandatory & Setup

- Entorno Mandatory: **Vitest** con **Angular Testing Library (ATL)**.
- Emplea `provideMockStore()` y la directiva `provideTestingEnvironment()` en los tests que consuman tokens de entorno.
- **IMPORTANTE:** Para que los tests funcionen correctamente (especialmente con componentes que usan `httpResource` o interactúan con Angular Material), es obligatorio añadir `provideHttpClient()`, `provideHttpClientTesting()` y se recomienda `provideNoopAnimations()`.

### 7.3. Manejo de Angular 21 & Signals

- **Zonaless:** Asume que la aplicación corre sin `zone.js`. Usa `await` para esperar que los Signals se propaguen tras un evento de usuario.
- **Mocking:** Usa `vi.fn()` para espías y evita mocks pesados de componentes (prefiere el shallow rendering implícito de ATL).
- **Signal Forms:** Al testear formularios, verifica que el estado del Signal subyacente cambie correctamente tras el input del usuario.

### 7.4. Component Harnesses (Angular Material)

Usa **Component Harnesses** de Angular Material para interactuar con componentes Material en tests, esto abstrae el DOM interno y da una API estable.

- **Siempre usa harnesses** (`MatExpansionPanelHarness`, `MatSelectHarness`, `MatInputHarness`, etc.) en lugar de `querySelector` o selectores de CSS.
- **Crea el `HarnessLoader`** desde el fixture de ATL usando `TestbedHarnessEnvironment.loader(view.fixture)`.
- Todos los métodos de harness son asíncronos (e.g. `await harness.expand()`).
- Usa `Harness.with({ ... })` para filtrar elementos si es necesario.

### 7.5. Ejemplo Completo de Setup de Prueba

```typescript
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('FeatureForm Dialog', () => {
  const setup = async () => {
    const user = userEvent.setup();
    const saveSpy = vi.fn();

    const view = await render(FeatureFormComponent, {
      componentInputs: { title: 'Test Form' },
      on: { save: saveSpy },
      providers: [
        provideMockStore(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    return { user, view, loader, saveSpy };
  };

  it('should disable submit button when form status is invalid', async () => {
    await setup();
    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    expect(submitBtn).toBeDisabled();
  });
});
```

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

---

## 10. 🌐 Inyección de Entorno y Rutas

- Nunca _hardcodees_ URLs. Se deben usar las funciones `inject*Endpoint()` provenientes del paquete core `@intaqalab/config` (ej: `injectApiUrl()`, `injectFireTrialsEndpoint()`).
- **Lazy Loading**: Todo subsistema debe usar `loadComponent` dentro de `<domain>.data.routes.ts`.

---

## 11. 💬 Patrones de Diálogos (Material Dialog)

Para los modales:

- Inyecta directamente `#dialogRef = inject(MatDialogRef<MiDialog>)` en la clase del componente.
- Finaliza el ciclo y devuelve datos llamando a `this.#dialogRef.close(data)`.
- En el padre que hace la apertura, subscríbete empleando `dialogRef.afterClosed().subscribe((result) => ...)`.

---

## 12. 🌍 Internacionalización (i18n)

Para cualquier etiqueta de la interfaz de usuario:

- Interpola empleando el pipe visual `{{ 'NAMESPACE.SECTION.KEY' | translate }}` o desde properties directas `[placeholder]="'NAMESPACE.KEY' | translate"`.
- Los nombres de las dependencias deben regirse bajo la sintaxis `<DOMAIN>.<SECTION>.<ELEMENT>.<PROPERTY>`.

---

## 13. ✅ Convenciones Generales y Checklist PR

### Modificadores de Acceso Exigidos

- **`#` (Private Native)**: Para TODO lo interno de la clase incl. stores inyectados que no usas en la vista (`readonly #service = inject(Service)`).
- **`protected`**: Único medio aceptado para inyecciones / signals que necesites exponer al `@Component` Template: `protected readonly store = inject(Store);`.
- Cero uso de `private` tradicional.

### Antes de enviar una PR (Checklist)

| ✅ SÍ Es Obligatorio                             | ❌ NO Está Permitido                           |
| ------------------------------------------------ | ---------------------------------------------- |
| `inject()` para resolver dependencias            | Constructor injection `constructor(private s)` |
| `ChangeDetectionStrategy.OnPush` en UI           | Default Change Detection / NgZone              |
| Signal API Pura (`signal`, `computed`, `effect`) | RxJS BehaviorSubject para manejo de vistas     |
| Block Syntax `@if`, `@for`, `@switch`            | Directivas anticuadas `*ngIf`, `*ngFor`        |
| NgRx SignalStore como root para vista            | NgRx Redux Store Clásico                       |
| Accesibilidad: `<label>` por cada `matInput`     | Inputs mudos / sin ids                         |
| Privacidad Nativa `#`                            | Keyword `private`                              |

---

## 14. 🤖 Generación de Código con Nx (Workspace & Tags)

Para garantizar que el Monorepo permanezca escalable, predecible y estricto, **todas las librerías, componentes y servicios deben generarse utilizando las herramientas de Nx CLI**. El archivo `nx.json` ya preconfigura los patrones para Angular 21 (Standalone, OnPush, Vitest inlineTemplates/Styles, ESLint), por lo que simplifica enormemente los comandos.

### 14.1. Importancia Crítica de los Tags

Nx pre-inyecta configuraciones de dependencias basadas en "Tags" (por ejemplo: `scope:domain` o `type:feature`), las cuales se usan para verificar reglas perimetrales en los lintados y evitar que librerías estáticas dependan de subdominios aislados (Ej., prohibiendo que un módulo `ui` importe a `feature`).
**ES OBLIGATORIO** incluir explícitamente `--tags=scope:...,type:...` cada vez que se genera una librería, pues de lo contrario quedará con el placeholder literal provisto en nx.json (`scope:(scope-name|shared)`), silenciando la protección estática de los límites de cada proyecto.

### 14.2. Cheat Sheet de Generación

#### A) Creación de Librerías (Arquitectura en Capas)

En la capa Domain (Data-Access, Feature, UI, Utils), debe especificarse tanto `--directory` (path en el disco) como `--tags`.

- **Feature** (Componentes Inteligentes e integración de Stores):
  ```bash
  nx g @nx/angular:library feature-[feature-name] --directory="libs/domain/[domain-name]/feature-[feature-name]" --tags="scope:[domain-name],type:feature"
  ```
- **UI** (Componentes puros/presentacionales orientados a Tailwind inline):
  ```bash
  nx g @nx/angular:library ui-[ui-name] --directory="libs/domain/[domain-name]/ui-[ui-name]" --tags="scope:[domain-name],type:ui"
  ```
- **Data Access** (Servicios, NgRx, y manejos de side effects aislados):
  ```bash
  nx g @nx/angular:library data-access-[entity-name] --directory="libs/domain/[domain-name]/data-access-[entity-name]" --tags="scope:[domain-name],type:data-access"
  ```
- **Util** (Helpers, tipos, interfaces puras sin responsabilidades dependientes de Angular):
  ```bash
  nx g @nx/angular:library util-[util-name] --directory="libs/domain/[domain-name]/util-[util-name]" --tags="scope:[domain-name],type:util"
  ```

#### B) Creación de Componentes e Inyectables (Aislados)

Estos comandos heredan automáticamente las buenas prácticas (Standalone, OnPush, Tailwind inlineStyles) dictaminadas por default en el `nx.json`.

- **Componentes**:
  ```bash
  nx g @nx/angular:component [component-name] --project=[project-name-in-workspace]
  ```
- **Servicios / Stores / Utils**:
  ```bash
  nx g @nx/angular:service [service-name] --project=[project-name-in-workspace]
  ```
