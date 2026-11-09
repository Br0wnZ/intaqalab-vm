# 01 — Service and Models (Execution Domain)

Guía detallada para identificar endpoints en Swagger, modelar DTOs TypeScript y crear/extender el servicio de dominio correspondiente bajo `libs/domain/trial/execution/src/lib/data-access/execution/shot/` cumpliendo con ADR-020 y ADR-025.

> [!WARNING]
> `ExecutionService` está `@deprecated` (fachada de compatibilidad con 0 consumidores en producción).
> **PROHIBIDO** añadir métodos a `ExecutionService` o inyectarlo en nuevos widgets o features. Toda lógica de acceso a datos pertenece a servicios modulares en `data-access/execution/`.

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

## 3. Implementación del Servicio de Dominio (`data-access/execution/shot/shot-<resource>.service.ts`)

> [!IMPORTANT]
> **Separación CQS (ADR-020) y Descomposición de Servicios (ADR-025):**
>
> 1. **Ubicación Canónica:** `libs/domain/trial/execution/src/lib/data-access/execution/shot/shot-<resource>.service.ts`.
> 2. **GET (Lecturas / Queries):** Usa `httpResource` + trigger de señal privado.
> 3. **Fetch Imperativo:** Usa `awaitResourceValue(resource, this.#injector)` de `../shared/resource-await`.
> 4. **PUT / POST / DELETE (Mutaciones / Escrituras):** Usa `HttpClient` directamente con `firstValueFrom()`, retornando `Promise<T>`.
>    🚫 **PROHIBIDO USAR `httpResource` PARA MUTACIONES:** Evita cancelaciones automáticas con `AbortController` al guardar múltiples widgets.
>    🚫 **PROHIBIDO EL USO DE NON-NULL ASSERTION (`!`):** Usa `awaitResourceValue`.
> 5. **Constructores Puros de URL:** Usa `executionTrialUrl(...)` importado de `../shared/execution-endpoints`.
> 6. **Re-exportación:** Exporta la clase en `libs/domain/trial/execution/src/lib/data-access/index.ts`.

```typescript
import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { <Resource>Request, <Resource>Response } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';
import { awaitResourceValue } from '../shared/resource-await';

interface Shot<Resource>Params {
  fireTrialId: FireTrial['id'];
  seriesId: string;
  shotId: string;
}

@Injectable({
  providedIn: 'root',
})
export class Shot<Resource>Service {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #executionUrl = injectExecutionEndpoint();

  // === GET Reactivo (Queries de UI) =========================================
  readonly #getShot<Resource>Params = signal<Shot<Resource>Params | null>(null);

  readonly shot<Resource>Resource = httpResource<<Resource>Response>(() => {
    const params = this.#getShot<Resource>Params();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        params.fireTrialId,
        '<resource-path>',
        'series',
        params.seriesId,
        'shots',
        params.shotId,
      ),
      method: 'GET',
    };
  });

  getShot<Resource>(fireTrialId: FireTrial['id'], seriesId: string, shotId: string): void {
    this.#getShot<Resource>Params.set({ fireTrialId, seriesId, shotId });
  }

  // === Fetch Imperativo (Sincronizado al cambiar serie/disparo) =============
  readonly #fetchShot<Resource>Params = signal<Shot<Resource>Params | null>(null);

  readonly #fetchShot<Resource>Resource = httpResource<<Resource>Response>(() => {
    const p = this.#fetchShot<Resource>Params();
    if (!p) return undefined;
    return {
      url: executionTrialUrl(
        this.#executionUrl,
        p.fireTrialId,
        '<resource-path>',
        'series',
        p.seriesId,
        'shots',
        p.shotId,
      ),
      method: 'GET',
    };
  });

  async fetchShot<Resource>(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
  ): Promise<<Resource>Response> {
    this.#fetchShot<Resource>Params.set({ fireTrialId, seriesId, shotId });
    return awaitResourceValue(this.#fetchShot<Resource>Resource, this.#injector);
  }

  // === PUT / Mutaciones de Escritura (ADR-020: HttpClient + firstValueFrom) ==
  async updateShot<Resource>(
    fireTrialId: FireTrial['id'],
    seriesId: string,
    shotId: string,
    body: <Resource>Request,
  ): Promise<<Resource>Response> {
    return firstValueFrom(
      this.#http.put<<Resource>Response>(
        executionTrialUrl(
          this.#executionUrl,
          fireTrialId,
          '<resource-path>',
          'series',
          seriesId,
          'shots',
          shotId,
        ),
        body,
      ),
    );
  }
}
```

---

## 4. Re-exportar en `data-access/index.ts`

En `libs/domain/trial/execution/src/lib/data-access/index.ts`:

```typescript
export * from './execution/shot/shot-<resource>.service';
```
