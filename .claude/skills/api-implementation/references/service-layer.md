# Capa de Servicios (`services/`)

Los servicios encapsulan las llamadas HTTP usando `httpResource` de Angular y `signal` como mecanismo de trigger. Son `@Injectable({ providedIn: 'root' })` y NUNCA contienen lógica de negocio ni estado de UI.

## Patrón Arquitectónico

```
signal<Params | null>(null)  →  httpResource<Response>(() => { ... })
       ↑ trigger                        ↑ reactive fetch
       │                                │
   .set(params)                   .value() / .isLoading() / .error()
```

## Ejemplo Real: Servicio Simple (GET + PUT)

Archivo: `libs/domain/trial/planning/src/lib/services/armament-service.ts`

```typescript
import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  ArmamentBulkUpdateRequest,
  SeriesArmamentData,
  TrialArmamentResponse,
} from '../utils-models/armament.model';
import type { CatalogQueryParams, SpecimenItem, SpecimenListResponse } from '../utils-models/catalog.model';

export type { ArmamentBulkUpdateRequest, SeriesArmamentData, SpecimenItem, TrialArmamentResponse };
export type { CatalogQueryParams, SpecimenListResponse };

@Injectable({
  providedIn: 'root',
})
export class ArmamentService {
  readonly #getArmamentParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateArmamentParams = signal<{ trialId: FireTrial['id']; body: ArmamentBulkUpdateRequest } | null>(null);

  readonly #getWeaponsParams = signal<CatalogQueryParams | null>(null);
  readonly #getTubesParams = signal<CatalogQueryParams | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly armamentResource = httpResource<TrialArmamentResponse>(() => {
    const params = this.#getArmamentParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/armament`,
      method: 'GET',
    };
  });

  readonly updateArmamentResource = httpResource<void>(() => {
    const params = this.#updateArmamentParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/armament`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly weaponsResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#getWeaponsParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/weapons${queryParams}`,
      method: 'GET',
    };
  });

  readonly tubesResource = httpResource<SpecimenListResponse>(() => {
    const params = this.#getTubesParams();
    if (!params) return undefined;

    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/tubes${queryParams}`,
      method: 'GET',
    };
  });

  getArmament(trialId: FireTrial['id']) {
    this.#getArmamentParams.set({ trialId });
  }

  updateArmament(trialId: FireTrial['id'], body: ArmamentBulkUpdateRequest) {
    this.#updateArmamentParams.set({ trialId, body });
  }

  resetUpdateArmament() {
    this.#updateArmamentParams.set(null);
  }

  getWeapons(params: CatalogQueryParams = {}) {
    this.#getWeaponsParams.set(params);
  }

  getTubes(params: CatalogQueryParams = {}) {
    this.#getTubesParams.set(params);
  }

  #buildQueryParams(params: CatalogQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.name) {
      searchParams.set('name', params.name);
    }
    if (params.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      searchParams.set('pageSize', params.pageSize.toString());
    }
    if (params.active !== undefined) {
      searchParams.set('active', params.active.toString());
    }
    if (params.sort?.length) {
      params.sort.forEach((s) => searchParams.append('sort', s));
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
```

## Ejemplo Real: Servicio con CRUD Completo

Archivo: `libs/domain/trial/planning/src/lib/services/measures-service.ts`

```typescript
import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  CatalogQueryParams,
  MasterDataIItem,
  MasterDataIItemUpdateRequest,
  MeasuresMasterDataIItem,
  MeasuresMasterDataIItemListResponse,
} from '../utils-models/catalog.model';
import type { MeasuresBulkUpdateRequest, TrialMeasuresResponse } from '../utils-models/measures.model';

@Injectable({
  providedIn: 'root',
})
export class MeasuresService {
  readonly #getMeasuresParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateMeasuresParams = signal<{ trialId: FireTrial['id']; body: MeasuresBulkUpdateRequest } | null>(null);

  readonly #getMeasuresCatalogParams = signal<CatalogQueryParams | null>(null);
  readonly #createMeasureParams = signal<MasterDataIItemUpdateRequest | null>(null);
  readonly #updateMeasureParams = signal<{ id: string; body: MasterDataIItemUpdateRequest } | null>(null);
  readonly #deleteMeasureParams = signal<{ id: string } | null>(null);

  readonly #addFavoriteParams = signal<{ id: string } | null>(null);
  readonly #removeFavoriteParams = signal<{ id: string } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  // --- Planning Endpoints ---

  readonly measuresResource = httpResource<TrialMeasuresResponse>(() => {
    const params = this.#getMeasuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/measures`,
      method: 'GET',
    };
  });

  readonly updateMeasuresResource = httpResource<void>(() => {
    const params = this.#updateMeasuresParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/measures`,
      method: 'PUT',
      body: params.body,
    };
  });

  // --- Catalog CRUD ---

  readonly measuresCatalogResource = httpResource<MeasuresMasterDataIItemListResponse>(() => {
    const params = this.#getMeasuresCatalogParams();
    if (!params) return undefined;
    const queryParams = this.#buildQueryParams(params);
    return {
      url: `${this.#planningUrl}/measures${queryParams}`,
      method: 'GET',
    };
  });

  readonly createMeasureResource = httpResource<MasterDataIItem>(() => {
    const body = this.#createMeasureParams();
    if (!body) return undefined;
    return {
      url: `${this.#planningUrl}/measures`,
      method: 'POST',
      body,
    };
  });

  readonly updateMeasureResource = httpResource<MasterDataIItem>(() => {
    const params = this.#updateMeasureParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/measures/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteMeasureResource = httpResource<void>(() => {
    const params = this.#deleteMeasureParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/measures/${params.id}`,
      method: 'DELETE',
    };
  });

  // --- Public Methods ---

  getMeasures(trialId: FireTrial['id']) {
    this.#getMeasuresParams.set({ trialId });
  }
  updateMeasures(trialId: FireTrial['id'], body: MeasuresBulkUpdateRequest) {
    this.#updateMeasuresParams.set({ trialId, body });
  }
  resetUpdateMeasures() {
    this.#updateMeasuresParams.set(null);
  }

  getMeasuresCatalog(params: CatalogQueryParams = {}) {
    this.#getMeasuresCatalogParams.set(params);
  }
  createMeasure(request: MasterDataIItemUpdateRequest) {
    this.#createMeasureParams.set(request);
  }
  updateMeasure(id: string, body: MasterDataIItemUpdateRequest) {
    this.#updateMeasureParams.set({ id, body });
  }
  deleteMeasure(id: string) {
    this.#deleteMeasureParams.set({ id });
  }

  resetCreateMeasure() {
    this.#createMeasureParams.set(null);
  }
  resetUpdateMeasure() {
    this.#updateMeasureParams.set(null);
  }
  resetDeleteMeasure() {
    this.#deleteMeasureParams.set(null);
  }

  #buildQueryParams = (p: CatalogQueryParams) =>
    `?${new URLSearchParams(
      Object.entries({ ...p, pageSize: 100 }).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((i) => [k, i]) : v !== null ? [[k, String(v)]] : [],
      ) as [string, string][],
    ).toString()}`;
}
```

## Ejemplo Real: Servicio con Múltiples Entidades Anidadas

Archivo: `libs/domain/trial/planning/src/lib/services/series-and-shots-service.ts`

```typescript
import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  AddNewSerieRequest,
  AddShotToSerieRequest,
  ReorderSeriesRequest,
  Serie,
  SeriesAndShotsResponse,
  Shot,
} from '../utils-models/series-and-shots.model';
import type { UpdateShotRequest } from '../utils-models/update-shot-request.model';
import type { UpsertTrialSerieRequest } from '../utils-models/upsert-trial-serie-info.model';

@Injectable({
  providedIn: 'root',
})
export class SeriesAndShotsService {
  readonly #getSeriesParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #addNewSerieParams = signal<AddNewSerieRequest | null>(null);
  readonly #updateSerieParams = signal<UpsertTrialSerieRequest | null>(null);
  readonly #deleteSerieParams = signal<{ serieId: string } | null>(null);
  readonly #reorderSeriesParams = signal<ReorderSeriesRequest | null>(null);
  readonly #addShotToSerieParams = signal<AddShotToSerieRequest | null>(null);
  readonly #updateShotParams = signal<UpdateShotRequest | null>(null);
  readonly #deleteShotParams = signal<{ shotId: string } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly seriesAndShotsResource = httpResource<Serie[]>(() => {
    const params = this.#getSeriesParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${params.trialId}/planning/series`,
      method: 'GET',
    };
  });

  readonly addNewSerieResource = httpResource<SeriesAndShotsResponse>(() => {
    const body = this.#addNewSerieParams();
    if (!body) return undefined;
    return {
      url: `${this.#planningUrl}/fire-trials/${body.trialId}/planning/series`,
      method: 'POST',
      body,
    };
  });

  readonly updateSerieResource = httpResource<void>(() => {
    const body = this.#updateSerieParams();
    if (!body) return undefined;
    const { id, ...data } = body;
    return {
      url: `${this.#planningUrl}/planning/series/${id}`,
      method: 'PUT',
      body: data,
    };
  });

  readonly deleteSerieResource = httpResource<void>(() => {
    const params = this.#deleteSerieParams();
    if (!params) return undefined;
    return {
      url: `${this.#planningUrl}/planning/series/${params.serieId}`,
      method: 'DELETE',
    };
  });

  readonly addShotToSerieResource = httpResource<Shot>(() => {
    const body = this.#addShotToSerieParams();
    if (!body) return undefined;
    const { serieId, ...rest } = body;
    return {
      url: `${this.#planningUrl}/planning/series/${serieId}/shots`,
      method: 'POST',
      body: rest,
    };
  });

  // --- Public Methods ---

  getSeriesAndShots(trialId: FireTrial['id']) {
    this.#getSeriesParams.set({ trialId });
  }
  addNewSerie(request: AddNewSerieRequest) {
    this.#addNewSerieParams.set(request);
  }
  updateSerie(request: UpsertTrialSerieRequest) {
    this.#updateSerieParams.set(request);
  }
  deleteSerie(serieId: string) {
    this.#deleteSerieParams.set({ serieId });
  }
  addShotToSerie(request: AddShotToSerieRequest) {
    this.#addShotToSerieParams.set(request);
  }
  resetAddNewSerie() {
    this.#addNewSerieParams.set(null);
  }
  resetUpdateSerie() {
    this.#updateSerieParams.set(null);
  }
}
```

## Ejemplo Real: Servicio con HttpParams (Warehouse)

Archivo: `libs/domain/wharehouse-managment/src/lib/services/denominations.service.ts`

```typescript
import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectWharehouseEndpoint } from '@intaqalab/config';
import type { PaginatedApiResponse } from '@intaqalab/models';
import { paginatedSortedParamsToSend } from '@intaqalab/models';

import type {
  DenominationModel,
  DenominationUpSertModel,
  SearchDenominationsPaginatedSortedRequest,
} from '../models/denominations.model';

@Injectable({
  providedIn: 'root',
})
export class DenominationsService {
  searchItems = signal<SearchDenominationsPaginatedSortedRequest>({});

  readonly #whareHouseUrl = injectWharehouseEndpoint();
  readonly #updateItem = signal<DenominationUpSertModel | null>(null);
  readonly #saveItem = signal<DenominationUpSertModel | null>(null);
  readonly #deleteItem = signal<DenominationModel | null>(null);

  readonly paginatedResponse = httpResource<PaginatedApiResponse<DenominationModel>>(() => {
    const params = this.searchItems();
    let apiParams = paginatedSortedParamsToSend(params);
    if (params.name !== undefined) {
      apiParams = apiParams.append('name', params.name);
    }
    if (params.active !== undefined) {
      apiParams = apiParams.set('active', params.active);
    }
    return {
      url: `${this.#whareHouseUrl}/denominations`,
      params: apiParams,
      method: 'GET',
    };
  });

  readonly saveResource = httpResource<DenominationModel>(() => {
    const params = this.#saveItem();
    if (!params) return undefined;
    return {
      url: `${this.#whareHouseUrl}/denominations`,
      method: 'POST',
      body: { ...params },
    };
  });

  createItem(item: DenominationUpSertModel) {
    this.#saveItem.set(item);
  }
  updateItem(item: DenominationUpSertModel) {
    this.#updateItem.set(item);
  }
  deleteItem(item: DenominationModel) {
    this.#deleteItem.set(item);
  }
}
```

## Inyección del Endpoint Base

La URL base siempre se obtiene con una función `inject*Endpoint()` de `@intaqalab/config`:

```typescript
// libs/shared/config/src/lib/config.functions.ts
export function injectPlanningEndpoint(): string {
  return injectApiEndpoint(Endpoints.Planning);
}

export function injectWharehouseEndpoint(): string {
  return injectApiEndpoint(Endpoints.WhareHouse);
}
```

## Reglas Clave

1. **Un signal privado por operación** — Nunca reutilizar el mismo signal para GET y PUT
2. **httpResource retorna `undefined` si el signal es `null`** — Esto evita disparar la petición
3. **Métodos `reset*()`** — Obligatorios para POST/PUT/DELETE (vuelven el signal a `null`)
4. **URL base inyectada** — Nunca hardcodear URLs
5. **Query params** — Usar `URLSearchParams` o `HttpParams` según la complejidad
6. **`providedIn: 'root'`** — Siempre singleton
7. **Re-export de types** — Usar `export type { ... }` para re-exportar modelos que usan los consumidores
