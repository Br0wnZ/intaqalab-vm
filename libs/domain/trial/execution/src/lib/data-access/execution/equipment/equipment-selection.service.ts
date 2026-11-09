import { httpResource } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type {
  EquipmentSelectorResponse,
  EquipmentSelectorUpdateRequest,
  EquipmentSelectorUpdateResponse,
  EquipmentTypeEnum,
} from '../../../execution/models';
import { EquipmentCatalogService } from '../../../services/equipment-catalog.service';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface EquipmentSelectorParams {
  fireTrialId: FireTrial['id'];
}

interface EquipmentSelectorUpdateParams extends EquipmentSelectorParams {
  body: EquipmentSelectorUpdateRequest;
}

@Injectable({
  providedIn: 'root',
})
export class EquipmentSelectionService {
  readonly #equipmentCatalogService = inject(EquipmentCatalogService);
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getEquipmentSelectorParams = signal<EquipmentSelectorParams | null>(null);

  readonly equipmentSelectorResource = httpResource<EquipmentSelectorResponse>(() => {
    const params = this.#getEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'equipment-selection'),
      method: 'GET',
    };
  });

  getEquipmentSelector(fireTrialId: FireTrial['id']): void {
    this.#getEquipmentSelectorParams.set({ fireTrialId });
  }

  loadEquipmentItemsByCategories(
    categories: readonly EquipmentTypeEnum[],
  ): Promise<Record<string, Array<{ id: string; label: string }>>> {
    return this.#equipmentCatalogService.loadEquipmentItemsByCategories(categories);
  }

  readonly #updateEquipmentSelectorParams = signal<EquipmentSelectorUpdateParams | null>(null);

  readonly updateEquipmentSelectorResource = httpResource<EquipmentSelectorUpdateResponse>(() => {
    const params = this.#updateEquipmentSelectorParams();
    if (!params) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'equipment-selection'),
      method: 'PUT',
      body: params.body,
    };
  });

  updateEquipmentSelector(fireTrialId: FireTrial['id'], body: EquipmentSelectorUpdateRequest): void {
    this.#updateEquipmentSelectorParams.set({ fireTrialId, body });
  }
}
