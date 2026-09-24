# ADR-012: Migración Nx 22.1.3 → 23.2.1 (manteniendo Angular 21)

**Estado:** Aceptado  
**Fecha:** 2026-09-23  
**Autores:** Javier Moreno Valle

---

## Contexto

El proyecto usaba `nx@22.1.3` con `@angular/*@21.1.x`. Esta combinación requería un bloque `"overrides"` en `package.json` para forzar que `@nx/angular@22` usara las versiones de `@angular-devkit/*@21` en lugar de las que pedía como peer deps (`>= 18.0.0 < 21.0.0`).

## Decisión

Actualizar **Nx de 22.1.3 a 23.2.1** manteniendo **Angular 21.1.x**. No se actualiza Angular 22.

### Razones

- Nx 23 amplía el rango de compatibilidad de `@nx/angular` a `>= 20.0.0 < 23.0.0`, que incluye Angular 21 de forma nativa.
- Elimina el bloque `"overrides"` del `package.json` que era un workaround temporal.
- Las vulnerabilidades de npm se reducen de **95 a 23** tras la migración limpia.
- Angular 22 requeriría TypeScript 6 y Vite 8, cambios que suponen un scope mayor y riesgo adicional.

## Cambios aplicados

### package.json

| Paquete              | Antes     | Después       |
| -------------------- | --------- | ------------- |
| `nx` + todos `@nx/*` | `22.1.3`  | `23.2.1`      |
| `@swc-node/register` | `~1.9.1`  | `~1.11.1`     |
| `@swc/core`          | `~1.5.7`  | `~1.15.8`     |
| `@swc/helpers`       | `~0.5.11` | `~0.5.23`     |
| `angular-eslint`     | `20.7.0`  | `21.4.0`      |
| `postcss`            | `^8.5.6`  | `^8.5.28`     |
| bloque `"overrides"` | presente  | **eliminado** |

### Migraciones automáticas aplicadas (38 de 45)

- `@nx/vitest`: `__dirname` → `import.meta.dirname` en 19 ficheros `vite.config.mts`
- `@nx/eslint`: rewrite subpath imports, update executor lint inputs
- `@nx/js`: rewrite subpath imports, migrate create-nodes v2
- `@nx/angular`: rewrite angular internal subpath imports, update module resolution, update SSR webpack config, set isolated modules
- `nx`: añadidos `.claude/worktrees`, `.nx/polygraph`, `.nx/self-healing` a `.gitignore`

### Migraciones descartadas (7 prompt migrations + 16 Angular v22)

- Las 16 migraciones de `@angular/material`, `@angular/cdk`, `@angular/core` v22 se eliminaron de `migrations.json` por no ser aplicables con Angular 21.
- Las 7 "prompt migrations" (`ai-instructions-for-vite-8`, `convert-to-flat-config`, `migrate-ban-types-rule`, etc.) son sugerencias para actualizaciones futuras y se conservan en `tools/ai-migrations/` para revisión posterior.

### Corrección post-migración

La migración `@nx/js:23-1-0-add-ignore-deprecations-for-ts6` añadió `"ignoreDeprecations": "6.0"` en 21 tsconfigs — opción solo válida en TypeScript 6. Se eliminó de todos los ficheros afectados al mantener TypeScript `~5.9.2`.

## Consecuencias

### Positivas

- Sin bloque `"overrides"` en `package.json` — dependencias resueltas limpiamente
- Vulnerabilidades npm: 95 → 23
- `@nx/eslint:lint` deprecated en v23 — advertencia de que en Nx 24 habrá que migrar a inferred targets
- Todas las rutas internas de `@nx/*` subpath actualizadas automáticamente

### A vigilar

- Nx 24 eliminará el executor `@nx/eslint:lint`. Cuando llegue esa versión, ejecutar: `nx g @nx/eslint:convert-to-inferred`
- Las 7 prompt migrations en `tools/ai-migrations/` representan trabajo futuro para adoptar Vite 8, Vitest 3/4 y flat ESLint config completa
- `angular-eslint@21.4.0` tiene `@angular-devkit/core >= 21.0.0 < 22.0.0` como dep interna — seguirá alineado mientras Angular se mantenga en 21.x

## Alternativas consideradas

**Angular 22 + Nx 23**: Descartado. Requiere TypeScript 6, Vite 8, zone.js `~0.16`, y migraciones de componentes Angular Material v22. Scope mayor; se pospone para una iteración futura dedicada.
