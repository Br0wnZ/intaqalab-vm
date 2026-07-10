---
name: angular-testing
description: Expert QA guide for Angular 22+, Vitest, and Angular Testing Library, focusing on behavior-driven testing, signal-based architecture, and Angular Material Component Harnesses.
user-invocable: true
---

# 🧪 Angular 22 Modern Testing Expert (Vitest + ATL + Signals)

Eres un experto en QA e Ingeniería de Software especializado en **Angular 22+**, **Vitest** y **Angular Testing Library (ATL)**. Tu objetivo es generar tests unitarios y de integración robustos, mantenibles y centrados en el comportamiento del usuario.

## ⚙️ Stack Tecnológico

- **Framework:** Angular 22 (Zoneless Change Detection, Signal-based components).
- **Test Runner:** Vitest (usa `vi` utilities, NO Jest).
- **Testing Utilities:** `@testing-library/angular` (`render`, `screen`) y `@testing-library/user-event`.
- **Component Harnesses:** `@angular/cdk/testing/testbed` + `@angular/material/*/testing`.
- **Project Utilities:** `@intaqalab/utils/testing/core` y `@intaqalab/config`. Read [project-utilities.md](references/project-utilities.md)

## 🛡️ Reglas de Oro

### 1. Filosofía de Testing 🧠

- **Testea Comportamiento, no Implementación:** Usa queries accesibles (`getByRole`, `getByLabelText`, `getByText`) en lugar de selectores CSS o IDs.
- **Usuario Primero:** Simula interacciones reales usando `userEvent` (siempre asíncrono).
- **Evita el Boilerplate:** Prefiere la función `render` de ATL sobre la configuración manual de `TestBed`.
- **Component Harnesses obligatorios:** SIEMPRE usa Component Harnesses de Angular Material (`@angular/material/*/testing`) para interactuar y testear componentes de Angular Material.
- **Evitar aserciones no nulas:** NUNCA uses aserciones no nulas (`!`, _non-null assertions_) en los archivos `.spec.ts` para evitar la advertencia de linter `Forbidden non-null assertion`. En su lugar, usa búsquedas semánticas exactas o comprobaciones condicionales explícitas.
- **Clean Code:** Tests descriptivos (`it('should save the form when...')`). Patrón AAA (Arrange, Act, Assert).

### 2. Zonaless & Signals ⚡

- La aplicación corre sin `zone.js`. Usa `await` para esperar que los Signals se propaguen tras un evento de usuario.
- **Mocking:** Usa `vi.fn()` para espías, `vi.mock()` para dependencias externas.
- **SIEMPRE** usa `createMockResource()` de `@intaqalab/utils/testing/core` para mockear resources.
- **SIEMPRE** incluye `provideTestingEnvironment()` de `@intaqalab/config` en los providers.
- **NUNCA uses `any`:** Tipa todos los mocks y generics con los tipos reales del dominio. Usa `type` imports del modelo correspondiente (e.g. `import type { DocumentDetail } from '../utils-models/...'`). Para recursos, usa `createMockResource<TipoReal>()`. Para mocks de servicio, define un tipo local o `ReturnType<typeof makeMockXxx>`.

### 3. Lifecycle Hooks de Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## 📋 Workflow: "Dame los tests de {{ componente }}"

Cuando el usuario pida tests de un componente, sigue estos pasos:

0. **⚠️ ANTES DE NADA — Lee los problemas conocidos:** Lee [known-issues.md](references/known-issues.md) completo y comprueba si alguno de los issues encaja con el componente/servicio que vas a testear. **Aplica la solución directamente sin necesidad de que falle el test primero.** Issues más frecuentes:
   - Servicio con `setTimeout` debounce → usar `tick(N)` no `tick()` (Issue #10)
   - Spec en librería `core` → no usar `provideTestingEnvironment()` (Issue #13)
   - Componente con `MatDialogModule` en imports → mock en `componentProviders` (Issue #9)
   - Store con `providedIn: null` → `NG0201` → usar `componentProviders` o `providers` (Issue #7)
   - Crash `ng2-pdf-viewer` → importar mock global en `test-setup.ts` de la librería (Issue #14)
   - Subcomponentes con `input.required` de Signal Forms → usar `TestWrapperComponent` local (Issue #16)

1. **Analiza el componente:** Lee el archivo `.ts` del componente para entender:
   - Tipo: componente, diálogo, servicio, store, interceptor, pipe
   - Dependencies inyectadas (servicios, stores, `MAT_DIALOG_DATA`, etc.)
   - Inputs/Outputs (signal-based)
   - Template: componentes Material usados, formularios, condicionales
   - Métodos públicos y comportamiento esperado

2. **Selecciona la reference correcta** según el tipo:
   - Componente estándar → [component-testing.md](references/component-testing.md) + [setup-patterns.md](references/setup-patterns.md)
   - Componente con Material → [material-harnesses.md](references/material-harnesses.md)
   - Diálogo → [dialog-testing.md](references/dialog-testing.md)
   - Servicio con HTTP → [service-testing.md](references/service-testing.md)
   - SignalStore → [store-testing.md](references/store-testing.md)
   - Signal Forms → [signal-forms-testing.md](references/signal-forms-testing.md)

3. **Lee las references** relevantes para aplicar los patrones exactos.

4. **Genera el archivo `.spec.ts`** siguiendo el patrón de setup y estructura docuementados.

5. **Ejecuta los tests** con `npx nx test <project-name>` para verificar que pasan.

## 📂 References por Tipo de Test

### Setup & Estructura Base

Patrones de `setup()` / `runSetup()`, providers comunes, estructura de archivos `.spec.ts`. Read [setup-patterns.md](references/setup-patterns.md)

### Testing de Componentes

Testing con ATL: queries accesibles, interacciones con `userEvent`, verificación de rendering, inputs/outputs con signals. Read [component-testing.md](references/component-testing.md)

### Material Component Harnesses

Interacción con componentes Angular Material usando harnesses estables y asíncronos. Read [material-harnesses.md](references/material-harnesses.md)

### Testing de Diálogos

Componentes abiertos con `MatDialog`: inyección de datos, mock de `MatDialogRef`, patrones de cierre. Read [dialog-testing.md](references/dialog-testing.md)

### Testing de Servicios

Servicios con `httpResource` y `HttpTestingController`: verificación de endpoints, params y métodos HTTP. Read [service-testing.md](references/service-testing.md)

### Testing de Stores

SignalStores con `TestBed.inject`: estado inicial, métodos, efectos y reseteo. Read [store-testing.md](references/store-testing.md)

### Signal Forms Testing

Testing de formularios Signal Forms: estados de validación, interacción con campos, modelo reactivo. Read [signal-forms-testing.md](references/signal-forms-testing.md)

### Utilidades del Proyecto

Documentación completa de `@intaqalab/utils/testing`: `createMockResource`, signal helpers, mocks de servicios. Read [project-utilities.md](references/project-utilities.md)

### Problemas Conocidos & Soluciones

Errores recurrentes detectados en tests del proyecto: Signal Forms, mocks incompletos, JSDOM + Angular Material, effects que no se disparan. Read [known-issues.md](references/known-issues.md)
