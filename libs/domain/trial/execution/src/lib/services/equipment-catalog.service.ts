import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import { catchError, firstValueFrom, map, tap } from 'rxjs';

import type { EquipmentTypeEnum } from '../execution/models';

export interface EquipmentOption {
  readonly id: string;
  readonly label: string;
}

interface EquipmentItemsApiResponse {
  readonly totalElements: number;
  readonly items: ReadonlyArray<{
    readonly id: number | null;
    readonly denominationName: string | null;
    readonly tag: string | null;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class EquipmentCatalogService {
  readonly #httpClient = inject(HttpClient);
  readonly #planningUrl = injectPlanningEndpoint();

  readonly #cache = new Map<EquipmentTypeEnum, readonly EquipmentOption[]>();
  readonly #inFlight = new Map<EquipmentTypeEnum, Promise<readonly EquipmentOption[]>>();

  /**
   * Carga los equipos disponibles en Calibry para una categoría específica.
   * Utiliza caché en memoria y deduplica peticiones en curso (in-flight request deduplication).
   */
  async loadCategoryItems(category: EquipmentTypeEnum): Promise<readonly EquipmentOption[]> {
    const cached = this.#cache.get(category);
    if (cached) {
      return cached;
    }

    const inFlightPromise = this.#inFlight.get(category);
    if (inFlightPromise) {
      return inFlightPromise;
    }

    const request$ = this.#httpClient
      .get<EquipmentItemsApiResponse>(`${this.#planningUrl}/equipment/items`, {
        params: { categoryId: category },
      })
      .pipe(
        map((response) =>
          (response.items ?? []).flatMap((item) => {
            const label = [item.denominationName, item.tag]
              .map((value) => value?.trim() ?? '')
              .filter((value) => value.length > 0)
              .join(' / ');

            return item.id === null || item.id === undefined || !label ? [] : [{ id: String(item.id), label }];
          }),
        ),
        tap((items) => {
          this.#cache.set(category, items);
          this.#inFlight.delete(category);
        }),
        catchError((err: unknown) => {
          this.#inFlight.delete(category);
          throw err;
        }),
      );

    const promise = firstValueFrom(request$);
    this.#inFlight.set(category, promise);
    return promise;
  }

  /**
   * Carga los equipos para múltiples categorías de forma concurrente con Promise.all.
   * Retorna un mapa `categoryId` -> array de opciones `{ id, label }`.
   */
  async loadEquipmentItemsByCategories(
    categories: readonly EquipmentTypeEnum[],
  ): Promise<Record<string, Array<{ id: string; label: string }>>> {
    if (!categories.length) {
      return {};
    }

    const uniqueCategories = [...new Set(categories)];
    const entries = await Promise.all(
      uniqueCategories.map(async (category): Promise<[string, Array<{ id: string; label: string }>]> => {
        const items = await this.loadCategoryItems(category);
        return [category, [...items]];
      }),
    );

    return Object.fromEntries(entries);
  }

  /**
   * Invalida la caché de equipos (útil para pruebas o recarga forzada).
   */
  clearCache(): void {
    this.#cache.clear();
    this.#inFlight.clear();
  }
}
