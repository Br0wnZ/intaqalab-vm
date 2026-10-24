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

## 4. Precisión de Mediciones

- Las mediciones conservan su valor durante carga, edición, pegado, pérdida de foco, guardado y configuración masiva. No usar `toFixed`, `toPrecision` ni redondeos explícitos en estas rutas, tampoco para presentar resultados.
- Usar `formatPreciseNumber` de `@intaqalab/utils` o el pipe `intaDecimal` para mostrar números con separadores locales sin reducir precisión. Los decimales mínimos pueden añadir ceros; nunca deben eliminar cifras existentes.
- `libLocalDecimal` conserva todos los decimales introducidos. Su input `decimals` se mantiene por compatibilidad, pero ya no limita ni trunca valores. `minDecimals` controla únicamente los ceros mínimos mostrados.
- Las conversiones de unidades conservan el resultado numérico completo. Cambiar solo la representación o la unidad visual no debe reescribir el valor base.
- El contrato numérico sigue siendo `number` de JavaScript: no recupera precisión ya perdida en backend ni ofrece aritmética decimal arbitraria. Los índices, descomposición de tiempos y porcentajes de progreso no son mediciones.

Regresión mínima: introducir `3,46`, perder foco y guardar debe enviar `3.46`, no `3.5`. Incluir también negativos, varios decimales y carga de valores existentes.
