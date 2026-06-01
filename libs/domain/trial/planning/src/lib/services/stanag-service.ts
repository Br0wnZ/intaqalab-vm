import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type {
  StanagCriteriaListResponse,
  StanagCriterionItem,
  StanagCriterionRequest,
} from '../utils-models/stanag.model';

export type { StanagCriteriaListResponse, StanagCriterionItem, StanagCriterionRequest };

@Injectable({
  providedIn: 'root',
})
export class StanagService {
  readonly #listParams = signal<{ page?: number; pageSize?: number } | null>(null);
  readonly #getParams = signal<{ id: string } | null>(null);
  readonly #createParams = signal<StanagCriterionRequest | null>(null);
  readonly #updateParams = signal<{ id: string; body: StanagCriterionRequest } | null>(null);
  readonly #deleteParams = signal<{ id: string } | null>(null);

  readonly #planningUrl = injectPlanningEndpoint();

  readonly listResource = httpResource<StanagCriteriaListResponse>(() => {
    const params = this.#listParams();
    if (!params) return undefined;

    const query = new URLSearchParams();
    if (params.page !== null) query.set('page', String(params.page));
    if (params.pageSize !== null) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();

    return {
      url: `${this.#planningUrl}/stanag-criteria${qs ? '?' + qs : ''}`,
      method: 'GET',
    };
  });

  readonly getResource = httpResource<StanagCriterionItem>(() => {
    const params = this.#getParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/stanag-criteria/${params.id}`,
      method: 'GET',
    };
  });

  readonly createResource = httpResource<StanagCriterionItem>(() => {
    const body = this.#createParams();
    if (!body) return undefined;

    return {
      url: `${this.#planningUrl}/stanag-criteria`,
      method: 'POST',
      body,
    };
  });

  readonly updateResource = httpResource<StanagCriterionItem>(() => {
    const params = this.#updateParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/stanag-criteria/${params.id}`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly deleteResource = httpResource<void>(() => {
    const params = this.#deleteParams();
    if (!params) return undefined;

    return {
      url: `${this.#planningUrl}/stanag-criteria/${params.id}`,
      method: 'DELETE',
    };
  });

  list(page?: number, pageSize?: number): void {
    this.#listParams.set({ page, pageSize });
  }

  get(id: string): void {
    this.#getParams.set({ id });
  }

  create(body: StanagCriterionRequest): void {
    this.#createParams.set(body);
  }

  update(id: string, body: StanagCriterionRequest): void {
    this.#updateParams.set({ id, body });
  }

  remove(id: string): void {
    this.#deleteParams.set({ id });
  }

  resetCreate(): void {
    this.#createParams.set(null);
  }

  resetUpdate(): void {
    this.#updateParams.set(null);
  }

  resetDelete(): void {
    this.#deleteParams.set(null);
  }
}
