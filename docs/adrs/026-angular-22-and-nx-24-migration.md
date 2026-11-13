# ADR-026: Migración del monorepo a Angular 22.2.6 y Nx 24.0.6

**Estado:** Aceptado
**Fecha:** 2026-11-12
**Autores:** Equipo INTAQALAB

---

## Contexto

El monorepo INTAQALAB operaba sobre Angular 21 y Nx 23. Para adoptar las capacidades de Angular 22 (detección de cambios `OnPush` por defecto, decorador `@Service()`, Signal Forms estabilizados, tipado estricto en plantillas y mejoras en `httpResource`), Nx 24, TypeScript 6.0, Vite 8, Vitest 5 y ESLint 10, era necesario ejecutar una actualización coordinada de todo el stack frontend y de testing manteniendo la estabilidad de producción, sin introducir regresiones en los 17 proyectos Nx y manteniendo Express en `4.x` (`^4.22.3`) en esta fase.

Restricciones y requisitos del proyecto:

1. Conservar la arquitectura **Zoneless + Signals-first** y el estándar **CQS** (ADR-003 y ADR-020).
2. Evitar migraciones automáticas contrarias a la arquitectura del repositorio (`change-detection-eager` y `http-xhr-backend`).
3. Actualizar `@ngx-translate/core` v18 (`TranslatePipe` y `provideTranslateService`) y ESLint 10 flat config (`@eslint/js` `^10.0.1`, `angular-eslint` `22.6.0`).
4. Mantener **Express 4.x** (`^4.22.3`, `@types/express` `^4.17.21`) para el servidor mock.
5. Mantener cero errores de lint (`bash tools/verify/verify.sh`), `check:planning-urls`, build de producción (`intaqalab:build --configuration=production`) y el 100 % de las pruebas en Vitest 5.

## Decisión

Se ejecuta la migración completa del monorepo a **Angular 22.2.6** (`@angular/material` y `@angular/cdk` `22.2.7`), **Nx 24.0.6**, **TypeScript ~6.0.3**, **Vite ^8.3.8**, **Vitest ^5.1.0**, **`@analogjs/vite-plugin-angular` / `@analogjs/vitest-angular` 2.9.7**, **`@ngrx/signals` ^22.0.1**, **`@ngx-translate/core` ^18.1.0**, **ESLint ^10.14.0** y **`chart.js` ^4.6.1**:

1. **Dependencias y curación de `migrations.json`:** Se aplica el guion de actualización con `nx migrate`, agregando `overrides` para `ngx-toastr` (`@angular/core`, `@angular/common`) y omitiendo explícitamente `change-detection-eager` y `http-xhr-backend`.
2. **Estándar Angular 22:**
   - Todos los servicios inyectables migran a `@Service()` mediante `@angular/core:service-migration`.
   - Se elimina la propiedad redundante `changeDetection: ChangeDetectionStrategy.OnPush` en componentes y en `nx.json` al pasar `OnPush` a ser el valor por defecto en Angular 22.
   - Se adoptan `@ngx-translate/core` v18 (`TranslatePipe` en componentes y `provideTranslateService()` en configuración/tests), `CanMatchFn` en rutas protegidas y comprobaciones estrictas de plantilla.
   - En controles Signal Forms (`FormUiControl`, p. ej. `NumericRangeInput`), se expone `touch = output<void>()` junto al input `touched` y se sincroniza el contrato con `controlValue`.
   - En tests de `httpResource` con progreso de descarga, se verifica `reportDownloadProgress` (sustituyendo `reportProgress` en la normalización de `HttpRequest` de Angular 22).
3. **Vite 8, TypeScript 6 y Vitest 5:**
   - `tsconfig.base.json` conserva `moduleResolution: "bundler"` y `module: "preserve"`.
   - Cada `vite.config.mts` sustituye `nxViteTsPaths()` por el soporte nativo `resolve: { tsconfigPaths: true }` de Vite 8 y `plugins: [angular({ tsconfig: './tsconfig.spec.json' })]`.
   - En `libs/domain/trial/execution/src/test-setup.ts`, se registra `localeEs` (`registerLocaleData(localeEs)`) para el formato `'es-ES'` y `getTestBed().resetTestingModule()` en `afterEach` global.
4. **Alineación de specs tras refactorizaciones previas en `main`:** Se actualizan los tests de `execution` afectados por la descomposición de servicios (ADR-025: `EquipmentSelectionService`, `ExecutionStateService`, `ShotRadarOrientationService`), políticas de edición por estado (`dc88599`), consultas de stock de prueba (`ed0f99d`), unidad `MeasureUnitEnum.MILS` (`'°°'`), `InputSelect` canónico (`f3cf66f`) y mock de `chart.js` en entorno jsdom.

## Consecuencias

- **Positivas:**
  - Monorepo completamente alineado con Angular 22.2.6, Nx 24.0.6, TypeScript 6.0, Vite 8, Vitest 5 y ESLint 10 sin deuda técnica de migración pendiente.
  - Componentes y servicios más limpios (`@Service()`, sin `ChangeDetectionStrategy.OnPush` repetitivo ni plugins redundantes en Vite 8).
  - Cobertura de pruebas al 100 % en los 17 proyectos Nx con aislamiento limpio de `TestBed` y locale español registrado.
- **Compromisos y mantenimiento:**
  - Las guías (`AGENTS.md`) y skills afectadas deben mantener actualizados los ejemplos de Angular 22, `@Service()`, `OnPush` por defecto, `TranslatePipe` y `resolve: { tsconfigPaths: true }`.
  - Express permanece en `4.22.3`; su salto a `5.x` queda diferido a una fase posterior dedicada al servidor mock.
