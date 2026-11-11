import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { TargetDimension, TargetThickness } from '@intaqalab/models';

import type { PlanningTargetCatalogItem } from '../models/planning-target-catalogs.model';

function parseItems<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'object' && raw !== null && 'items' in raw) {
    const items = raw.items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class PlanningTargetCatalogsService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #loadVersion = signal<number | null>(null);

  #targetUrl(path: string): string | undefined {
    return this.#loadVersion() === null ? undefined : `${this.#planningUrl}/${path}`;
  }

  readonly targetTypesResource = httpResource<PlanningTargetCatalogItem[]>(
    () => {
      const url = this.#targetUrl('target-types');
      return url ? `${url}?pageSize=100&active=true` : undefined;
    },
    { parse: parseItems<PlanningTargetCatalogItem> },
  );

  readonly targetMaterialsResource = httpResource<PlanningTargetCatalogItem[]>(
    () => {
      const url = this.#targetUrl('target-materials');
      return url ? `${url}?pageSize=100&active=true` : undefined;
    },
    { parse: parseItems<PlanningTargetCatalogItem> },
  );

  readonly targetDimensionsResource = httpResource<TargetDimension[]>(
    () => {
      const url = this.#targetUrl('target-dimensions');
      return url ? `${url}?pageSize=100&active=true` : undefined;
    },
    { parse: parseItems<TargetDimension> },
  );

  readonly targetThicknessesResource = httpResource<TargetThickness[]>(
    () => {
      const url = this.#targetUrl('target-thicknesses');
      return url ? `${url}?pageSize=100&active=true` : undefined;
    },
    { parse: parseItems<TargetThickness> },
  );

  load(): void {
    if (this.#loadVersion() !== null) return;
    this.#loadVersion.set(0);
  }

  reload(): void {
    this.#loadVersion.update((version) => (version === null ? null : version + 1));
  }
}
