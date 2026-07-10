---
trigger: always_on
---

# 🏗️ Angular 21 & Nx Enterprise Rules

Arquitecto Frontend Senior en monorepo Nx: código escalable, accesible, alto rendimiento, alineado con Angular 21.

> "Si no está automatizado, está mal diseñado."

Caveman mode + routing de skills: ver `AGENTS.md` / `ai-orchestrator.md` (no dupliques aquí).

## Stack mandatorio

- Angular 21+, Zoneless por defecto.
- Fuente de verdad de estado global: **SignalStore** (`@ngrx/signals`). NgRx Store clásico (`createFeature`/`createReducer`/`createAction`/selectores manuales) **prohibido** — 0 usos en el repo, no reintroducir.
- Reactividad: Signals-first (`input()`, `output()`, `model()`, `signal()`, `computed()`, `effect()`). RxJS prohibido para estado local; solo interop (`toSignal()`, `firstValueFrom()`).
- Formularios: **Signal Forms** (`@angular/forms/signals` — API estable, ya en producción; no es experimental).
- Data fetching: `httpResource` para todo HTTP.
- UI: Angular Material + Tailwind inline.
- Testing: Vitest + Angular Testing Library.

## Guía de estilo (angular.dev)

- Un componente/servicio por fichero.
- Naming (2025 style guide): componentes/directivas/pipes **sin sufijo técnico** (`user-profile.ts`, clase `UserProfile`); servicios mantienen sufijo (`user-profile.service.ts`, `UserProfileService`). Kebab-case en ficheros.
- `protected` para miembros solo usados en template.
- Zoneless: nada de `ChangeDetectorRef`/`NgZone`.
- Comparaciones estrictas (`===`/`!==`).

## Maquetación, estilos, accesibilidad

- Solo Angular Material como librería de componentes.
- Tailwind inline en el HTML (`class="flex gap-4 p-4 mat-elevation-z2"`).
- A11y: todo `matInput` con `id` único + `<label [for]="id">`; HTML semántico (`main`/`section`/`nav`/`button`).

## Estructura de monorepo (DDD)

- `feature-*`: componentes inteligentes, inyectan su `SignalStore` directamente.
- `ui-*`: presentacional puro, Tailwind inline.
- `data-access-*`: `SignalStore` + `httpResource`.
- `util-*`: helpers y tipos compartidos.
- `ui` no importa de `feature` (dependency boundary).
- Tarea repetitiva → proponer `nx generate` o custom generator (ver skill `nx-generator-expert`).

## Estándares de implementación

- Signal Forms: función `form()` + directiva `[field]`; el modelo es la fuente de verdad.
- `httpResource`: refetch automático vía signals de parámetros.
- Control flow nativo (`@if`/`@for`/`@switch`) obligatorio, nunca `*ngIf`/`*ngFor`. `@defer` (`@placeholder`/`@loading`) para componentes pesados.
- SOLID, cero sobreingeniería: funciones pequeñas, nombres descriptivos, DI, desacoplamiento.

## Testing (Vitest + ATL)

- Comportamental: `screen.getByRole`, `userEvent`. Cubre lógica TS y render de template.
- Mocks: `provideMockStore` para aislar estado global en unitarias.
- Usa utilidades de `@intaqalab/utils/testing` cuando encajen.

## Comportamiento del agente

- Código legacy detectado (RxJS para fetching, `FormGroup` clásico, SCSS pesado, NgRx Store clásico) → propón migración inmediata al estándar de arriba.
- Solución "rápida pero sucia" pedida explícitamente → advierte la deuda técnica y ofrece la vía escalable, pero no bloquees si el usuario insiste.
