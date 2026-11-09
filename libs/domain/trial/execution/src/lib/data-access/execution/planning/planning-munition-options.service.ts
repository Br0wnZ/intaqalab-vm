import { Injectable, Injector, inject } from '@angular/core';
import { PlanningMunitionsService } from '@intaqalab/data-access-planning';
import type { FireTrial } from '@intaqalab/models';

import type { PlanningMunitionOptionData } from '../../../execution/models';
import { awaitResource } from '../shared/resource-await';
import { mapPlanningMunitionOptions } from './planning-munition-options.mapper';
import { WarehouseCatalogService } from './warehouse-catalog.service';

@Injectable({
  providedIn: 'root',
})
export class PlanningMunitionOptionsService {
  readonly #injector = inject(Injector);
  readonly #planningMunitionsService = inject(PlanningMunitionsService);
  readonly #warehouseCatalog = inject(WarehouseCatalogService);

  async fetchPlanningMunitionOptions(fireTrialId: FireTrial['id']): Promise<PlanningMunitionOptionData> {
    this.#warehouseCatalog.loadComponentTypes();
    this.#warehouseCatalog.loadWarehouseDenominations();
    this.#planningMunitionsService.load(fireTrialId);
    await Promise.all([
      awaitResource(this.#warehouseCatalog.componentTypesResource, this.#injector),
      awaitResource(this.#warehouseCatalog.warehouseDenominationsResource, this.#injector),
      awaitResource(this.#planningMunitionsService.munitionsResource, this.#injector),
    ]);

    return mapPlanningMunitionOptions({
      munitionsResponse: this.#planningMunitionsService.munitionsResource.value(),
      componentTypesResponse: this.#warehouseCatalog.componentTypesResource.value(),
      warehouseDenominationsResponse: this.#warehouseCatalog.warehouseDenominationsResource.value(),
    });
  }
}
