# ADR-018: Explicit @oxc-project/runtime Dependency for Angular Vitest Toolchain

**Estado:** Aceptado  
**Fecha:** 2026-10-19  
**Autores:** Javier Moreno Valle

---

## Contexto

En el monorepo INTAQALAB, la ejecución de tests unitarios se realiza mediante **Vitest** gestionado por `@nx/vitest` y el compilador `@analogjs/vite-plugin-angular`.

Durante la migración a **Nx 23 y Vite**, los tests unitarios de proyectos Angular que utilizan `@nx/vitest:test` experimentaron fallos de resolución de módulos con el siguiente error en `vite:import-analysis`:

```text
Failed to resolve import "@oxc-project/runtime/helpers/..." from "node_modules/@angular/..."
```

### Origen técnico

1. **Downleveling de sintaxis para Zone.js:** `@analogjs/vite-plugin-angular` registra internamente el plugin `angularVitestPlugin`. En modo test, este plugin intercepta los módulos `fesm2022` de `@angular/*` y `@angular/cdk` que contienen funciones `async`.
2. Zone.js depende de interceptar (monkey-patch) el ciclo de planificación de microtareas y promesas (imprescindible para utilidades como `fakeAsync` y `tick`). Zone.js no puede interceptar la sintaxis nativa de `async/await` implementada a nivel de motor JavaScript, por lo que el plugin transfigura deliberadamente el target a `es2016` mediante `vite.transformWithOxc(code, id, { target: 'es2016', ... })`.
3. **Emisión de helpers de OXC:** Al compilar hacia `es2016`, el transformador OXC utiliza por defecto `HelperMode = 'Runtime'`. En lugar de incrustar funciones auxiliares repetidas en cada fichero, emite sentencias de importación externas hacia `@oxc-project/runtime/helpers/*`.
4. **Falta de resolución upstream:** Ningún paquete de la cadena upstream (`@analogjs/vite-plugin-angular`, `@angular/core`, `vite`, `rolldown`) declara `@oxc-project/runtime` como dependencia directa resoluble en el workspace consumidor. Por tanto, el análisis de imports de Vite falla salvo que la librería esté declarada explícitamente en el proyecto.

## Decisión

Añadir explícitamente `@oxc-project/runtime` (versión `^0.115.0`) a la sección `devDependencies` del `package.json` raíz del workspace.

### Justificación de devDependencies

- Esta dependencia se ejecuta y resuelve **únicamente durante la fase de testing** con Vitest (`npx nx test <project>`).
- No interviene en las compilaciones de producción (`build`), los bundles de navegador generados por Angular CLI / esbuild, ni en la entrega al usuario final.

## Consecuencias

### Positivas

- Resolución exitosa y sin fricción de todos los helpers de transpilación emitidos por OXC durante la ejecución de Vitest.
- Compatibilidad garantizada de `fakeAsync` y fixtures de Angular CDK en el entorno de pruebas unitarias.
- Cumplimiento de la guía de migración interna (`tools/ai-migrations/@nx/vite/23.2.1/ai-instructions-for-vite-8.md`).

### Negativas / Mantenimiento

- Se añade una dependencia directa en `package.json` para solventar una carencia de empaquetado upstream de la integración Analog / Vite.
- Requiere monitorización en futuras actualizaciones mayores de `@analogjs/vite-plugin-angular` o Vite para verificar si upstream encapsula o absorbe dicha dependencia.
