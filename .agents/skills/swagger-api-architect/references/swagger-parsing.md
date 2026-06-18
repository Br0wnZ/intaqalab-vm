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

## Mapeo: Swagger Path → Service Method

| Swagger | Service |
|---------|---------|
| `GET /path` | `httpResource<Response>` + `getXxx()` method |
| `POST /path` | `httpResource<Response>` + `createXxx(body)` method + `resetCreate()` |
| `PUT /path/{id}` | `httpResource<void>` + `updateXxx(id, body)` method + `resetUpdate()` |
| `DELETE /path/{id}` | `httpResource<void>` + `deleteXxx(id)` method + `resetDelete()` |
| `PUT /path` (bulk) | `httpResource<void>` + `updateXxx(body)` method + `resetUpdate()` |

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

### Resultado:
```typescript
readonly #updateParams = signal<{ trialId: string; body: ArmamentBulkUpdateRequest } | null>(null);

readonly updateResource = httpResource<void>(() => {
  const params = this.#updateParams();
  if (!params) return undefined;
  return {
    url: `${this.#apiUrl}/fire-trials/${params.trialId}/planning/armament`,
    method: 'PUT',
    body: params.body,
  };
});

updateEntity(trialId: string, body: ArmamentBulkUpdateRequest) {
  this.#updateParams.set({ trialId, body });
}
```

## Mapeo: Response Schema → httpResource Generic

| Swagger Response | httpResource Type |
|-----------------|-------------------|
| `{ "$ref": "#/components/schemas/X" }` | `httpResource<X>` |
| `{ "type": "array", "items": { "$ref": "#/components/schemas/X" } }` | `httpResource<X[]>` |
| Sin body (204) | `httpResource<void>` |
| `200` sin schema específico | `httpResource<void>` |

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
