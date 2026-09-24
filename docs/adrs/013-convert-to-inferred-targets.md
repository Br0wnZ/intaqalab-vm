# ADR-013: Migración a Inferred Targets (Project Crystal) en ESLint y Vitest

**Estado:** Aceptado  
**Fecha:** 2026-09-23  
**Autores:** Javier Moreno Valle

---

## Contexto

Con la llegada de Nx 23.2.1, los executors tradicionales `@nx/eslint:lint` y `@nx/vitest:test` han sido marcados como deprecados y serán eliminados definitivamente en Nx v24. En el workspace existían 19 proyectos con definiciones explícitas de targets en `project.json` que generaban advertencias continuas en cada ejecución de lint o test.

Adicionalmente, `shared-theme:build` (`@nx/angular:package`) y `intaqalab:extract-i18n` carecían de configuración de caché en `nx.json`, obligando a reconstruir la librería temática en cada build de la aplicación.

## Decisión

1. **Adopción de Inferred Targets (Project Crystal)**:
   - Migración de ESLint mediante `@nx/eslint:convert-to-inferred`, configurando `@nx/eslint/plugin` en `nx.json` y eliminando los 19 targets manuales en los archivos `project.json`.
   - Migración de Vitest mediante `@nx/vitest:convert-to-inferred`, configurando `@nx/vitest` plugin en `nx.json` para inferir los targets `test` a partir de `vite.config.mts`.
2. **Caché en librerías buildables e i18n**:
   - Registro en `targetDefaults` de `nx.json` para `@nx/angular:package` (`cache: true`, `dependsOn: ["^build"]`) y `@angular/build:extract-i18n`.
3. **Unificación de configuración Vitest**:
   - Inclusión de `libs/demos/vite.config.mts` y `libs/pruebas/vite.config.mts` en la propiedad `projects` de `vitest.config.ts`.
   - Eliminación del archivo obsoleto `vitest.workspace.ts` (descontinuado en Vitest 4).

## Consecuencias

### Positivas

- Cero advertencias de deprecación en la ejecución de lint y test.
- `shared-theme` se cachea correctamente; builds incrementales de la app no recompilan la librería si no ha sufrido cambios.
- Eliminación de deuda técnica previa a Nx v24.
- Salida limpia y reducción de sobrecarga en `project.json`.

### A vigilar

- Sustitución de `nxViteTsPaths`: se mantiene temporalmente en `vite.config.mts` hasta que Nx v24 estandarice la resolución de paths monorepo nativa, ya que `vite-tsconfig-paths` estándar requiere rutas absolutas para no romper la resolución de submódulos en librerías secundarias.
