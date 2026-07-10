---
name: swagger-to-service-agent
description: Describe what this custom agent does and when to use it.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---

<!-- Tip: Use /create-agent in chat to generate content with agent assistance -->

## Referencias de Implementación API (Swagger → Service)

### 1. Configuración de Endpoints

# Configuración de Endpoints

Cada API del backend tiene su propia configuración de endpoint. Cuando implementes una API nueva, verifica si ya existe un endpoint registrado o si necesitas crear uno.

#### Endpoints Existentes

Archivo: `libs/shared/config/src/lib/environment.types.ts`
...ver contenido original en referencia...

#### Funciones de Inyección

Archivo: `libs/shared/config/src/lib/config.functions.ts`
...ver contenido original en referencia...

#### Cómo Registrar una Nueva API

...ver contenido original en referencia...

---

### 2. Mock Fixtures y Dispatchers

# Mock Fixtures y Dispatchers (`mocks/src/fixtures/`)

Los fixtures son datos estáticos en JSON y los dispatchers son funciones TypeScript que encapsulan lógica dinámica sobre esos datos (filtrado, paginación, mutación in-memory).

#### Estructura de Directorio

...ver contenido original en referencia...

#### Utilidades Compartidas

Archivo: `mocks/src/utils.ts`
...ver contenido original en referencia...

#### Ejemplo Real: Dispatcher Simple (Fixture Estático)

...ver contenido original en referencia...

#### Ejemplo Real: Dispatcher con Filtrado y Paginación

...ver contenido original en referencia...

#### Ejemplo Real: Dispatcher con Store In-Memory Mutable

...ver contenido original en referencia...

#### Ejemplo Real: Fixture JSON

...ver contenido original en referencia...

#### Cuándo Usar Cada Patrón

...ver contenido original en referencia...

#### Reglas Clave

1. **JSON fixtures en la ruta correcta** — `mocks/src/fixtures/<domain>/<entity>-fixture.json`
2. **Dispatchers junto al fixture** — Si el fixture necesita lógica, crea un `*-dispatcher.ts` al lado
3. **Clonar antes de mutar** — `JSON.parse(JSON.stringify(fixture))` para evitar corromper el original
4. **Datos realistas** — Usar ejemplos del Swagger y UUIDs reales
5. **Mínimo 3-5 items** — En listas paginadas

---

### 3. Mock Routes

# Mock Routes (`mocks/src/routes/`)

Las rutas mock simulan la API en el servidor Express local. Se usan para desarrollo sin depender del backend real.

#### Arquitectura del Mock Server

...ver contenido original en referencia...

#### Registro Central de Routers

Archivo: `mocks/src/routes/index.ts`
...ver contenido original en referencia...

#### Ejemplo Real: Route con Dispatchers

...ver contenido original en referencia...

#### Ejemplo Real: Route con CRUD In-line

...ver contenido original en referencia...

#### Ejemplo Real: Route con Catálogos Simples (fixture directo)

...ver contenido original en referencia...

#### HTTP Status Codes Utilizados

...ver contenido original en referencia...

#### Reglas Clave

1. **`mergeParams: true`** — Usar cuando el router se monta bajo un path con params
2. **`getFixture(path, filename)`** — Para datos estáticos desde JSON
3. **`getPagination(req)`** — Extrae `page` y `pageSize` de query params
4. **Registrar en `index.ts`** — Nunca olvidar el `router.use()`
5. **Usar `crypto.randomUUID()`** — Para generar IDs en POST
6. **Siempre devolver paginated response para listas** — `{ page, pageSize, totalElements, items }`

---

### 4. Capa de Modelos

# Capa de Modelos (`utils-models/`)

Los modelos TypeScript se generan a partir de la sección `components.schemas` del Swagger. Son tipos puros sin lógica, usados tanto por los servicios como por los stores.

#### Convenciones de Nomenclatura

...ver contenido original en referencia...

#### Mapeo de Tipos Swagger → TypeScript

...ver contenido original en referencia...

#### Ejemplo Real: Armament Models

...ver contenido original en referencia...

#### Ejemplo Real: Catalog Models (Compartidos)

...ver contenido original en referencia...

#### Ejemplo Real: Measures Models

...ver contenido original en referencia...

#### Reglas Clave

1. Los campos listados en `required` del Swagger son propiedades normales en TS
2. Los campos NO required son `?` (optional)
3. Si un schema usa `$ref`, importar el tipo del archivo correspondiente
4. Si un schema usa `allOf`, hacer merge de propiedades en un solo type
5. No generar tipos para `ProblemDetail` (es transversal y ya existe)

---

### 5. Capa de Servicios

# Capa de Servicios (`services/`)

Los servicios encapsulan las llamadas HTTP usando `httpResource` de Angular y `signal` como mecanismo de trigger. Son `@Injectable({ providedIn: 'root' })` y NUNCA contienen lógica de negocio ni estado de UI.

#### Patrón Arquitectónico

...ver contenido original en referencia...

#### Ejemplo Real: Servicio Simple (GET + PUT)

...ver contenido original en referencia...

#### Ejemplo Real: Servicio con CRUD Completo

...ver contenido original en referencia...

#### Ejemplo Real: Servicio con Múltiples Entidades Anidadas

...ver contenido original en referencia...

#### Ejemplo Real: Servicio con HttpParams (Warehouse)

...ver contenido original en referencia...

#### Inyección del Endpoint Base

...ver contenido original en referencia...

#### Reglas Clave

1. **Un signal privado por operación** — Nunca reutilizar el mismo signal para GET y PUT
2. **httpResource retorna `undefined` si el signal es `null`** — Esto evita disparar la petición
3. **Métodos `reset*()`** — Obligatorios para POST/PUT/DELETE (vuelven el signal a `null`)
4. **URL base inyectada** — Nunca hardcodear URLs
5. **Query params** — Usar `URLSearchParams` o `HttpParams` según la complejidad
6. **`providedIn: 'root'`** — Siempre singleton
7. **Re-export de types** — Usar `export type { ... }` para re-exportar modelos que usan los consumidores

---

### 6. Capa de SignalStore

# Capa de SignalStore (`+state/`)

Los stores son la fuente de verdad para los componentes. Usan `signalStore` de `@ngrx/signals` y NUNCA hacen peticiones HTTP directamente — siempre delegan al servicio correspondiente.

#### Patrón Arquitectónico

...ver contenido original en referencia...

#### Estructura Base

...ver contenido original en referencia...

#### Ejemplo Real: Store Simple (GET + PUT)

...ver contenido original en referencia...

#### Ejemplo Real: Store con Búsqueda y Paginación (Warehouse)

...ver contenido original en referencia...

#### Computed Signals: Qué Exponer

...ver contenido original en referencia...

#### Reglas Clave

1. **El Store NUNCA hace HTTP** — Siempre delega al Service
2. **`withState`** — Solo estado local (isInitialized, currentSearch, flags de UI)
3. **`withComputed`** — Expone signals derivados del servicio con `computed()`
4. **`withMethods`** — Llama a métodos públicos del servicio + `patchState` para estado local
5. **`withHooks`** — Siempre implementar `onDestroy` → `store.reset()`
6. **`patchState(store, initialState)`** — Limpieza de estado en el reset
7. **Dependencias entre stores** — Si necesitas datos de otro store (ej: `fireTrialId`), inyéctalo como parámetro extra en `withComputed` y `withMethods`
8. **Type alias** — Siempre exportar `export type <Store>Type = InstanceType<typeof <Store>>;`

---

### 7. Parsing del Swagger JSON

# Parsing del Swagger JSON

Guía para extraer y mapear la información del Swagger/OpenAPI 3.x a los artefactos de código.

#### Estructura del Swagger

...ver contenido original en referencia...

#### Mapeo: Swagger Path → Service Method

...ver contenido original en referencia...

#### Mapeo: Path Parameters → Signal Shape

...ver contenido original en referencia...

#### Mapeo: Query Parameters → URLSearchParams

...ver contenido original en referencia...

#### Mapeo: Request Body → Service Signal

...ver contenido original en referencia...

#### Mapeo: Response Schema → httpResource Generic

...ver contenido original en referencia...

#### Agrupación por Tags

...ver contenido original en referencia...

#### Manejo de `$ref` (Schema References)

...ver contenido original en referencia...

#### Schemas con `allOf` (Herencia/Composición)

...ver contenido original en referencia...

---

### 8. Actualización de Versión en Environments

Cuando se implemente una nueva versión del Swagger/OpenAPI, **siempre actualizar la versión del endpoint correspondiente** en el archivo base de environments:

- Archivo: `apps/intaqalab/src/environments/environment.base.ts`
- El campo `endpoints.<apiKey>` incluye la versión en la URL (ej: `'planning-api/1.2.0'`)
- La versión debe coincidir exactamente con el campo `info.version` del Swagger y con la URL del servidor (`servers[0].url`)
- El resto de environments (`.dev.ts`, `.pre.ts`, `.prod.ts`) heredan de `environment.base.ts`, por lo que **sólo hay que cambiar un fichero** salvo que alguno lo sobreescriba explícitamente.

**Regla:** Siempre verificar y actualizar el environment como **primer paso** antes de cualquier cambio en modelos, servicios o mocks.
