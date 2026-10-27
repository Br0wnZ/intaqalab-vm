import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';

import type { PlanningLoadingZoneItem } from '../models/planning-loading-zones.model';

@Injectable({
  providedIn: 'root',
})
export class PlanningLoadingZonesService {
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #loadRequested = signal(false);

  readonly loadingZonesResource = httpResource<PlanningLoadingZoneItem[]>(
    () => {
      if (!this.#loadRequested()) return undefined;

      return {
        url: `${this.#planningUrl}/loading-zone`,
        params: { pageSize: 100, active: true },
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): PlanningLoadingZoneItem[] => {
        if (Array.isArray(raw)) return raw as PlanningLoadingZoneItem[];
        if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray((raw as { items: unknown }).items)) {
          return (raw as { items: PlanningLoadingZoneItem[] }).items;
        }
        return [];
      },
    },
  );

  load(): void {
    this.#loadRequested.set(true);
  }
}
