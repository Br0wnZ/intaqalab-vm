# Parsing del Swagger JSON

Guía para extraer y mapear la información del Swagger/OpenAPI 3.x a los artefactos de código.

## Estructura del Swagger

```json
{
  "openapi": "3.0.3",
  "info": { "title": "...", "version": "1.0.0" },
  "servers": [{ "url": "https://apis.des.inta.es/intaqalab/planning-api/1.0.0" }],
  "tags": [
    { "name": "Planning", "description": "..." },
    { "name": "Munitions", "description": "..." }
  ],
  "paths": {
    "/centers/{centerId}/fire-trials/{fireTrialId}/planning/info": {
      "get": { "operationId": "getPlanningInfo", "tags": ["Planning"], ... },
      "put": { "operationId": "updatePlanningInfo", "tags": ["Planning"], ... },
      "parameters": [...]
    }
  },
  "components": {
    "schemas": {
      "PlanningResponse": { "type": "object", "properties": { ... } },
      "PlanningRequest": { "type": "object", "properties": { ... } }
    }
  }
}
```

## Mapeo: Swagger Path → Service Method (CQS / ADR-020)

> **Regla CQS Obligatoria (ADR-020):** `httpResource` se reserva ÚNICAMENTE para operaciones `GET` (queries/lecturas). Todas las operaciones de mutación (`POST`, `PUT`, `PATCH`, `DELETE`) deben usar `HttpClient` imperativo con `firstValueFrom` retornando `Promise<T>`.

| Swagger             | Service Implementation Pattern                                       |
| ------------------- | -------------------------------------------------------------------- |
| `GET /path`         | `httpResource<Response>` + `loadXxx()` / `getXxx()` method (trigger) |
| `POST /path`        | `HttpClient.post()` + `async createXxx(body): Promise<Response>`     |
| `PUT /path/{id}`    | `HttpClient.put()` + `async updateXxx(id, body): Promise<Response>`  |
| `DELETE /path/{id}` | `HttpClient.delete()` + `async deleteXxx(id): Promise<void>`         |
| `PUT /path` (bulk)  | `HttpClient.put()` + `async updateXxx(body): Promise<Response>`      |

## Mapeo: Path Parameters → Signal Shape

### Ejemplo Swagger:

```json
"/centers/{centerId}/fire-trials/{fireTrialId}/planning/info": {
  "parameters": [
    { "name": "centerId", "in": "path" },
    { "name": "fireTrialId", "in": "path" }
  ]
}
```

### Resultado en el Service:

```typescript
// centerId se obtiene de la URL base (interceptor lo inyecta automáticamente)
// fireTrialId es el parámetro dinámico en el signal
readonly #params = signal<{ fireTrialId: string } | null>(null);

readonly resource = httpResource<Response>(() => {
  const params = this.#params();
  if (!params) return undefined;
  return {
    url: `${this.#planningUrl}/fire-trials/${params.fireTrialId}/planning/info`,
    method: 'GET',
  };
});
```

> **NOTA:** El `centerId` NO va en el signal — se inyecta desde la URL base via `injectPlanningEndpoint()` que ya incluye `/centers/{centerId}/planning-api/1.0.0`.

## Mapeo: Query Parameters → URLSearchParams

### Ejemplo Swagger:

```json
"parameters": [
  { "name": "name", "in": "query", "required": false, "schema": { "type": "string" } },
  { "name": "page", "in": "query", "schema": { "type": "integer", "default": 1 } },
  { "name": "pageSize", "in": "query", "schema": { "type": "integer", "default": 25 } },
  { "name": "active", "in": "query", "schema": { "type": "boolean" } },
  { "name": "sort", "in": "query", "schema": { "type": "array", "items": { "type": "string" } } }
]
```

### Resultado:

```typescript
// 1. Tipo para los params
export type CatalogQueryParams = {
  name?: string;
  page?: number;
  pageSize?: number;
  active?: boolean;
  sort?: string[];
};

// 2. Builder de query string
#buildQueryParams(params: CatalogQueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.name) searchParams.set('name', params.name);
  if (params.page !== undefined) searchParams.set('page', params.page.toString());
  if (params.pageSize !== undefined) searchParams.set('pageSize', params.pageSize.toString());
  if (params.active !== undefined) searchParams.set('active', params.active.toString());
  if (params.sort?.length) {
    params.sort.forEach((s) => searchParams.append('sort', s));
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
```

## Mapeo: Request Body → Service Signal

### Ejemplo Swagger:

```json
"put": {
  "requestBody": {
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/ArmamentBulkUpdateRequest" }
      }
    },
    "required": true
  }
}
```

### Resultado (Mutación con HttpClient según ADR-020):

```typescript
readonly #http = inject(HttpClient);

async updateEntity(trialId: string, body: ArmamentBulkUpdateRequest): Promise<void> {
  return firstValueFrom(
    this.#http.put<void>(
      `${this.#apiUrl}/fire-trials/${trialId}/planning/armament`,
      body,
    ),
  );
}
```

## Mapeo: Response Schema (GET) → httpResource Generic

> Para operaciones `GET`, el response schema define el genérico de `httpResource<T>`. Para mutaciones (`POST`/`PUT`), define el genérico del retorno de `HttpClient` (`Promise<T>`).

| Swagger Response                                                     | httpResource Type    |
| -------------------------------------------------------------------- | -------------------- |
| `{ "$ref": "#/components/schemas/X" }`                               | `httpResource<X>`    |
| `{ "type": "array", "items": { "$ref": "#/components/schemas/X" } }` | `httpResource<X[]>`  |
| Sin body (204)                                                       | `httpResource<void>` |
| `200` sin schema específico                                          | `httpResource<void>` |

## Agrupación por Tags

Los tags del Swagger determinan qué endpoints van juntos en el mismo servicio:

```json
"tags": [
  { "name": "Planning" },       → PlanningService / DataPlanningService
  { "name": "Munitions" },      → MunitionsService
  { "name": "Armament" },       → ArmamentService
  { "name": "Measures" },       → MeasuresService
]
```

Cada tag → un Service + un Store (normalmente).

## Manejo de `$ref` (Schema References)

```json
"schema": { "$ref": "#/components/schemas/PlanningResponse" }
```

Extraer el nombre del schema (`PlanningResponse`) y:

1. Buscar en `components.schemas.PlanningResponse`
2. Generar el type TypeScript
3. Importarlo donde se necesite

## Schemas con `allOf` (Herencia/Composición)

```json
"ShotConditions": {
  "allOf": [
    {
      "properties": {
        "shotId": { "type": "string", "format": "uuid" },
        "globalNumber": { "type": "integer" }
      }
    },
    { "$ref": "#/components/schemas/ShotConditionsData" }
  ]
}
```

### Resultado:

```typescript
import type { ShotConditionsData } from './shot-conditions-data.model';

export type ShotConditions = {
  shotId: string;
  globalNumber?: number;
} & ShotConditionsData;
```

O alternativamente, hacer merge manual de las propiedades en un solo type.
