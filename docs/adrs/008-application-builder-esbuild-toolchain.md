# ADR-008: Migración a `@angular/build:application` y eliminación de la cadena webpack

**Estado:** Aceptado
**Fecha:** 2026-07-12
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

La app `intaqalab` compilaba con el executor `@nx/angular:browser-esbuild`, un builder puente pensado para facilitar la migración desde webpack, no como destino final. Además convivían tres piezas de tooling redundantes o muertas:

- `targetDefaults` en `nx.json` para `@angular-devkit/build-angular:browser` (ningún proyecto lo usaba) junto a otro para `@angular/build:application` (tampoco usado). El target `build` real (`browser-esbuild`) no casaba con ninguno, por lo que **el build de la app no se cacheaba en Nx**.
- El plugin `@nx/webpack/plugin` registrado en `nx.json` solo servía para inferir el target `build` del mock server (`mocks/webpack.config.js` con `NxAppWebpackPlugin`). Un servidor Express de desarrollo no justifica arrastrar toda la cadena webpack.
- `apps/intaqalab/src/app/webpack.config.js` era un fichero identidad (`(config) => config`) sin ninguna referencia: código muerto.
- `webpack-cli` figuraba en `devDependencies` sin ningún consumidor (ni scripts ni executors lo invocan).

Restricción dura: el `Dockerfile` copia `dist/intaqalab` plano a nginx y los jobs de GitLab CI cachean/publican `dist/`. El builder `application` emite por defecto en un subdirectorio `browser/`, lo que rompería despliegue y pipeline.

## Decisión

1. **App → `@angular/build:application`** (builder oficial esbuild de Angular):
   - `main` pasa a ser la opción `browser`.
   - `outputPath` usa la forma objeto `{ "base": "dist/intaqalab", "browser": "" }` para mantener la **salida plana** y no tocar `Dockerfile`, `nginx.conf` ni `.gitlab-ci.yml`.
   - El resto de opciones (assets, styles, `stylePreprocessorOptions`, budgets, `fileReplacements` por entorno) son compatibles sin cambios.
   - `serve` sigue en `@nx/angular:dev-server` (soporta builds de `@angular/build` y conserva `proxyConfig`).
2. **Mock server → `@nx/esbuild:esbuild`** con target `build` explícito en `mocks/project.json`: `platform: node`, `format: cjs`, `generatePackageJson: true`, assets (`assets/`, `fixtures/`, `db/`) y `outExtension .js` para que `serve` (`node dist/mocks/main.js`) no cambie. `mocks/webpack.config.js` eliminado.
3. **Limpieza de `nx.json`:** fuera el plugin `@nx/webpack/plugin` y el `targetDefault` de `@angular-devkit/build-angular:browser`; se añade `targetDefault` para `@nx/esbuild:esbuild`. Con esto el build de la app y el del mock quedan cacheados por Nx.
4. **Dependencias:** `@nx/webpack` y `webpack-cli` fuera de `devDependencies`; entra `@nx/esbuild`. `express` y `json-server` se mueven de `devDependencies` a `dependencies`: son dependencias de runtime del artefacto `dist/mocks` y `generatePackageJson` solo las incluye si están declaradas como tales (con webpack el `package.json` generado también las omitía).

## Consecuencias

### Positivas

- Toolchain único esbuild para app y mock server; builder puente eliminado.
- Build de la app y del mock ahora **cacheados por Nx** (antes no casaban con ningún `targetDefault`).
- `Dockerfile`, `nginx.conf` y `.gitlab-ci.yml` intactos gracias a la salida plana.
- `dist/mocks/package.json` generado ahora es correcto (incluye `express` y `json-server`), lo que hace viables los targets `prune`/`prune-lockfile` para desplegar el mock.
- `webpack-cli` y ficheros webpack muertos eliminados del repo.

### Negativas / limitaciones

- `@nx/webpack` sigue instalándose como **dependencia transitiva dura de `@nx/angular` 22.x**; solo desaparece del manifest directo, no de `node_modules`.
- La salida plana (`browser: ""`) es incompatible con SSR/prerender; si algún día se adopta SSR habrá que volver al subdirectorio `browser/` y actualizar `Dockerfile` + CI en el mismo cambio.
- `@angular-devkit/build-angular` permanece en `devDependencies` (lo referencian los `overrides` de npm y el ecosistema CLI); su eliminación queda fuera de este cambio.

### Verificación realizada

- `nx build intaqalab` (production) y `-c des`: OK, salida plana con `index.html` en `dist/intaqalab/`.
- `nx serve intaqalab -c development`: HTTP 200 en `localhost:4200` con proxy cargado.
- `nx build mock-data` + arranque de `dist/mocks/main.js`: servidor responde y resuelve `db.json` y assets.

## Referencias

- `apps/intaqalab/project.json` (target `build`)
- `mocks/project.json` (target `build`)
- `nx.json` (plugins y `targetDefaults`)
- [Angular — application builder options](https://angular.dev/reference/configs/workspace-config#application-builder-options)
- ADR-005 (Express Mock Server)
