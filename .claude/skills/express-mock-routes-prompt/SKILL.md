---
name: express-mock-routes-prompt
description: 'Genera exclusivamente mocks en ExpressJS y fixtures JSON desde un Swagger.'
---

Genera exclusivamente las rutas Express.js y las fixtures JSON de mock a partir del JSON/Swagger proporcionado, siguiendo la arquitectura de `/mocks`.

REGLAS DE IMPLEMENTACIÓN:

1. **Rutas Existentes y Cambios Incrementales**:
   - Si las rutas o los ficheros de fixtures ya existen, no los crees desde cero. Aplica únicamente los cambios incrementales necesarios para añadir los nuevos endpoints o propiedades descritas en el Swagger.

2. **Ruta Express (`mocks/src/routes/[feature].routes.ts`)**:
   - Usa `Router` de `express`.
   - Define y exporta el router como `export const [feature]Router = Router();`.
   - Si el endpoint es paginado, extrae parámetros con `getPagination(req)` y responde usando la función helper `paginate(allData, params)` de `../utils`.
   - Si se requiere simular base de datos/estado persistente para mutations (POST/PUT/DELETE), genera un simple array o Store local en memoria en la fixture correspondiente.
   - Retorna respuestas exitosas con códigos HTTP adecuados (200 OK, 201 Created, 204 No Content).
   - Usa `getFixture('fixtures/[feature]', '[fixture-name].json')` de `../utils` para leer fixtures estáticos.

3. **Fixture JSON (`mocks/src/fixtures/[feature]/[name]-fixture.json`)**:
   - Genera datos JSON simulados, lógicos y realistas (mínimo 5-10 elementos si es listado).
   - Coherente con los modelos de datos del dominio Intaqalab (armamento, munición, pruebas de fuego, etc.).

4. **Registro (`mocks/src/routes/index.ts`)**:
   - Si la ruta es nueva, genera también los cambios necesarios para registrarla directamente en `mocks/src/routes/index.ts` (añadiendo el correspondiente `import` y `router.use(...)`).

No generes servicios de Angular, ni interfaces de frontend, ni explicaciones teóricas. Muestra únicamente los archivos de backend ExpressJS y los JSONs correspondientes.
