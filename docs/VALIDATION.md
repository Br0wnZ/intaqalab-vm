# ✅ Validación y Continuous Integration

INTAQALAB dispone de pipelines automatizados (Lint, Format, Unit Tests y Coverage).
Es tu responsabilidad garantizar que las PRs cumplan localmente con el marco de validación antes de realizar push a la rama `master`.

## 1. Comandos de Verificación Locales

El repositorio incluye targets automatizados con dependencias caché (`nx affected`) que validan únicamente el código que has tocado:

- **Linting:** Verifica estilo, accesibilidad (a11y) y boundaries del monorepo Nx.
  ```bash
  npx nx affected --target=lint
  ```
- **Formateo:** Estandariza todo tu código contra Prettier.
  ```bash
  npm run format
  ```
- **Unit Testing (Vitest):** Valida assertions. Requerido mantener un 80% mínimo de cobertura configurado en `vitest.config.ts`.
  ```bash
  npx nx affected --target=test
  ```

## 2. Cobertura (Coverage)

La validación global o previa a una Release requiere generar un informe unificado de cobertura de todas las sub-librerías Nx en un único LCOV global.

```bash
npm run coverage:full
```

Este comando activa automáticamente el script `scripts/merge-coverage.js` volcando el resultado final en `coverage/merged/lcov.info`.

## 3. Hook Pre-Push

Por defecto, el repositorio debe protegerse. Si se activa Husky o si utilizas Nx Cloud, el pipeline bloqueará cualquier inserción de código a `master` si los tests en el scope alterado fallan local o remotamente.
