# 01 — Service and Models (Execution Domain)

Guía detallada para identificar endpoints en Swagger, modelar DTOs TypeScript y añadir métodos en `ExecutionService`.

---

## 1. Localizar Endpoints en Swagger

```bash
cat apis/execution-api.json | python3 -c "
import sys, json
api = json.load(sys.stdin)
for path, methods in api.get('paths', {}).items():
    if 'munition' in path.lower():  # cambia por el recurso del widget
        for method, op in methods.items():
            print(f'{method.upper()} {path}  —  {op.get(\"summary\",\"\")}')
"
```

Endpoints típicos con granularidad de serie + disparo:

- `GET  /fire-trials/{fireTrialId}/execution/<resource>/series/{seriesId}/shots/{shotId}`
- `PUT  /fire-trials/{fireTrialId}/execution/<resource>/series/{seriesId}/shots/{shotId}`

---

## 2. Modelos TypeScript (Request / Response / Params)

Fichero: `libs/domain/trial/execution/src/lib/execution/models/<widget-resource>.models.ts`

```typescript
// GET Response
export interface <Resource>ComponentResponse {
  componentId: string;
  identificationData?: {
    denominationId?: string | null;
    batch?: string | null;
    clientNumber?: string | null;
    fuseWorkingModeId?: string | null;
    fuseGraduation?: number | null;
    observations?: string | null;
  } | null;
  weightData?: {
    balanceId?: number | null;
    weight?: number | null;
    weightAdded?: number | null;
    weightRemoved?: number | null;
    weighingDateTime?: string | null;
    weighingRange?: string | null;
    observations?: string | null;
  } | null;
  conditioningData?: {
    climaticChamberId?: number | null;
    chamberEntryDateTime?: string | null;
    chamberExitDateTime?: string | null;
    temperature?: number | null;
    programmedTemperature?: number | null;
    observations?: string | null;
  } | null;
}

export interface <Resource>Response {
  munitionData: <Resource>ComponentResponse[];
}

// PUT Request
export interface <Resource>ComponentRequest {
  componentId: string;
  identificationData: { /* campos según Swagger */ } | null;
  weightData: { /* campos según Swagger */ } | null;
  conditioningData: { /* campos según Swagger */ } | null;
}

export interface <Resource>Request {
  components: <Resource>ComponentRequest[];
}

// Params internas para triggers de lectura
export interface <Resource>Params {
  fireTrialId: string;
  seriesId: string;
  shotId: string;
  _t: number; // timestamp para forzar re-trigger
}

export interface <Resource>UpdateParams extends <Resource>Params {
  body: <Resource>Request;
}
```

Exportar los modelos en `libs/domain/trial/execution/src/lib/execution/models/index.ts`:

```typescript
export type { <Resource>Response, <Resource>Request } from './<widget-resource>.models';
```

---

## 3. Implementación en `ExecutionService`

> [!IMPORTANT]
> **Separación CQS (ADR-020):**
>
> 1. **GET (Lecturas / Queries):** Usa `httpResource` + trigger de señal privado.
> 2. **PUT / POST / DELETE (Mutaciones / Escrituras):** Usa `HttpClient` directamente con `firstValueFrom()`, retornando `Promise<T>`.
>    🚫 **PROHIBIDO USAR `httpResource` PARA MUTACIONES:** Evita cancelaciones automáticas con `AbortController` al guardar múltiples widgets.
>    🚫 **PROHIBIDO EL USO DE NON-NULL ASSERTION (`!`):** Usa `#awaitResourceValue(resource)`.

```typescript
// === GET (Consultas de Lectura) ==============================================
readonly #get<Resource>Params = signal<<Resource>Params | null>(null);

readonly <resource>Resource = httpResource<<Resource>Response>(() => {
  const p = this.#get<Resource>Params();
  if (!p) return undefined;
  return {
    url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/<api-path>/series/${p.seriesId}/shots/${p.shotId}`,
    method: 'GET',
  };
});

get<Resource>(fireTrialId: string, seriesId: string, shotId: string): void {
  this.#get<Resource>Params.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
}

// Trigger para fetch imperativo sincronizado
readonly #fetch<Resource>Params = signal<<Resource>Params | null>(null);

readonly #fetch<Resource>Resource = httpResource<<Resource>Response>(() => {
  const p = this.#fetch<Resource>Params();
  if (!p) return undefined;
  return {
    url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/<api-path>/series/${p.seriesId}/shots/${p.shotId}`,
    method: 'GET',
  };
});

async fetch<Resource>(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
): Promise<<Resource>Response> {
  this.#fetch<Resource>Params.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  return this.#awaitResourceValue(this.#fetch<Resource>Resource);
}

// === PUT (Mutaciones de Escritura) ===========================================
// ⚡ MANDATORIO (ADR-020): HttpClient + firstValueFrom
async update<Resource>(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  body: <Resource>Request,
): Promise<<Resource>Response> {
  return firstValueFrom(
    this.#http.put<<Resource>Response>(
      `${this.#executionUrl}/fire-trials/${fireTrialId}/execution/<api-path>/series/${seriesId}/shots/${shotId}`,
      body,
    ),
  );
}
```
