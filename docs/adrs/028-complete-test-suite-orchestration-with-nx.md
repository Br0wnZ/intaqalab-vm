# ADR-028: Complete Test Suite Orchestration with Nx

**Estado:** Aceptado
**Fecha:** 2026-11-18
**Autores:** Equipo INTAQALAB

## Contexto

La ejecución multiproyecto de Vitest presentó errores de carga de módulos (`Maximum call stack size exceeded`) al inicializar Angular y Analog. La misma spec de aplicación pasó al ejecutarse aislada. La instrumentación de `ModuleTransformService.fetch()` identificó el origen en `getCachedModule()` → `extractSourceMap()` → `RegExp.exec()` durante la precarga del módulo inline de `@angular/compiler`. El módulo cacheado ocupa aproximadamente 5,7 MB e incluye un sourcemap de aproximadamente 4,47 MB. También se observaron imports de estilos virtuales JIT inválidos en la ruta de recuperación de módulos cacheados. El consumo de memoria observado no se considera prueba de la causa de ese desbordamiento de pila.

El script `test:all` mantenía una lista parcial de proyectos. La configuración de inferencia de Nx no incluía todos los directorios registrados en la configuración multiproyecto. Además, los jobs `unit-test-*` de GitLab ejecutaban builds, pero no invocaban tests.

## Decisión

1. Utilizar `npm run test:all` como entrada de la suite completa: `npx nx run-many --target=test --all --parallel=1 --run --maxWorkers=2 --output-style=static`.
2. Descubrir los targets de test mediante `@nx/vitest` bajo `apps/**/*`, `libs/**/*` y `mocks/**/*`, sin una lista fija de dominios en el comando.
3. Ejecutar los proyectos secuencialmente. Cada proyecto inicia su propio proceso de Vitest y utiliza como máximo dos workers. No se excluyen specs ni se modifican assertions.
4. Utilizar `npm run test:ci` para ejecutar la misma suite con `--skipNxCache`. Los tres jobs `unit-test-*` instalan con `npm ci` y ejecutan la suite antes del build existente.
5. Declarar `passWithNoTests: true` únicamente en `demos`, `models` y `shared-theme`, que actualmente no contienen specs. Los restantes proyectos mantienen el error por ausencia inesperada de tests.
6. Usar `vitest.config.mts` para que la configuración raíz sea ESM explícito. Este cambio elimina el aviso de compatibilidad ESM/CommonJS; no se presenta como reparación del error del cargador multiproyecto.
7. Declarar `test.fsModuleCache: false` tanto en la raíz como en las 20 configuraciones de proyecto. Se comprobó que configurar únicamente la raíz deja activa esa caché en los proyectos separados. Mantener el registro original de archivos de configuración, sus nombres, roots, plugins, pools y cobertura.
8. Limitar los scripts de UI global a dos workers para reducir contención de memoria durante la compilación y cobertura multiproyecto, sin aumentar timeouts ni añadir reintentos de tests.

## Consecuencias

- La suite de CI deja de depender de una única instancia multiproyecto de Vitest y libera el estado de cada proyecto al finalizar su proceso.
- Los nuevos proyectos con configuración de test dentro de los directorios registrados se incorporan automáticamente a `test:all`.
- La ejecución secuencial prioriza un consumo de memoria predecible frente al máximo paralelismo entre proyectos.
- Un fallo de tests devuelve un código de salida no cero y bloquea el job de CI; no se utilizan `allow_failure`, exclusiones de dominios ni desactivaciones globales de validación.
- `npm run vitest:ui` mantiene su alcance multiproyecto y su cobertura. La desactivación explícita de la caché de módulos en disco evita la ruta defectuosa de recuperación de sourcemaps; no depende de filtrar proyectos ni de modificar specs.
- No se cambia el compilador de Angular, no se reintroduce `zone.js` ni se desactivan comprobaciones de tipos en los tsconfig.
