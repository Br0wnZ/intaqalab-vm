import { HttpClient, httpResource } from '@angular/common/http';
import { Injector, Service, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import {
  type PlanningConditionsResponse,
  PlanningTrialContextService,
  planningRevisionParams,
} from '@intaqalab/data-access-planning';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type { PathSegment } from '../execution/shared/execution-endpoints';
import { planningUrl } from '../execution/shared/execution-endpoints';
import { awaitResourceValue } from '../execution/shared/resource-await';
import type {
  ApplyChangesRequest,
  PlanningChange,
  PlanningModification,
  PlanningModificationTarget,
  ReviewModificationRequest,
  SavePlanningModificationsRequest,
  SubmitPlanningModificationsRequest,
  SubmitPlanningModificationsResponse,
  UpdateModificationClassificationRequest,
} from './models/planning-modification.models';

@Service()
export class PlanningModificationsService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #planningUrl = injectPlanningEndpoint();
  readonly #trialContext = inject(PlanningTrialContextService, { optional: true });

  readonly #modificationsParams = signal<PlanningModificationTarget | null>(null);

  readonly modificationsResource = httpResource<PlanningModification[]>(() => {
    const params = this.#modificationsParams();
    if (!params) return undefined;
    return {
      url: this.#buildTrialPlanningUrl(params.fireTrialId, params.centerId, 'modifications'),
      method: 'GET',
    };
  });

  readonly #fetchModificationsParams = signal<PlanningModificationTarget | null>(null);

  readonly #fetchModificationsResource = httpResource<PlanningModification[]>(() => {
    const params = this.#fetchModificationsParams();
    if (!params) return undefined;
    return {
      url: this.#buildTrialPlanningUrl(params.fireTrialId, params.centerId, 'modifications'),
      method: 'GET',
    };
  });

  readonly #currentConditionsParams = signal<PlanningModificationTarget | null>(null);

  readonly currentConditionsResource = httpResource<PlanningConditionsResponse>(() => {
    const params = this.#currentConditionsParams();
    if (!params) return undefined;
    return {
      url: this.#buildTrialPlanningUrl(params.fireTrialId, params.centerId, 'conditions'),
      method: 'GET',
      params: planningRevisionParams('execution'),
    };
  });

  readonly #baselineConditionsParams = signal<PlanningModificationTarget | null>(null);

  readonly baselineConditionsResource = httpResource<PlanningConditionsResponse>(() => {
    const params = this.#baselineConditionsParams();
    if (!params) return undefined;
    return {
      url: this.#buildTrialPlanningUrl(params.fireTrialId, params.centerId, 'conditions'),
      method: 'GET',
      params: planningRevisionParams('baseline'),
    };
  });

  loadModifications(fireTrialId: FireTrial['id'], centerId?: string): void {
    this.#modificationsParams.set({ fireTrialId, centerId });
  }

  reloadModifications(): void {
    this.modificationsResource.reload();
  }

  async fetchModifications(fireTrialId: FireTrial['id'], centerId?: string): Promise<PlanningModification[]> {
    this.#fetchModificationsParams.set({ fireTrialId, centerId });
    return awaitResourceValue(this.#fetchModificationsResource, this.#injector);
  }

  loadCurrentConditions(fireTrialId: FireTrial['id'], centerId?: string): void {
    this.#currentConditionsParams.set({ fireTrialId, centerId });
  }

  loadBaselineConditions(fireTrialId: FireTrial['id'], centerId?: string): void {
    this.#baselineConditionsParams.set({ fireTrialId, centerId });
  }

  readonly #changesParams = signal<PlanningModificationTarget | null>(null);

  readonly changesResource = httpResource<PlanningChange[]>(() => {
    const params = this.#changesParams();
    if (!params) return undefined;
    return {
      url: this.#buildTrialPlanningUrl(params.fireTrialId, params.centerId, 'changes'),
      method: 'GET',
    };
  });

  loadChanges(fireTrialId: FireTrial['id'], centerId?: string): void {
    this.#changesParams.set({ fireTrialId, centerId });
  }

  reloadChanges(): void {
    this.changesResource.reload();
  }

  async applyChanges(
    fireTrialId: FireTrial['id'],
    body: ApplyChangesRequest,
    centerId?: string,
  ): Promise<PlanningChange[]> {
    return firstValueFrom(
      this.#http.post<PlanningChange[]>(this.#buildTrialPlanningUrl(fireTrialId, centerId, 'changes', 'apply'), body),
    );
  }

  async saveDraft(
    fireTrialId: FireTrial['id'],
    body: SavePlanningModificationsRequest,
    centerId?: string,
  ): Promise<PlanningModification[]> {
    const response = await firstValueFrom(
      this.#http.post<PlanningModification[] | { modifications: PlanningModification[] }>(
        this.#buildTrialPlanningUrl(fireTrialId, centerId, 'modifications'),
        body,
      ),
    );
    return Array.isArray(response) ? response : response.modifications;
  }

  async updateClassification(
    fireTrialId: FireTrial['id'],
    modId: string,
    body: UpdateModificationClassificationRequest,
    centerId?: string,
  ): Promise<PlanningModification> {
    return firstValueFrom(
      this.#http.put<PlanningModification>(
        this.#buildTrialPlanningUrl(fireTrialId, centerId, 'modifications', modId),
        body,
      ),
    );
  }

  async submitModifications(
    fireTrialId: FireTrial['id'],
    body: SubmitPlanningModificationsRequest,
    centerId?: string,
  ): Promise<SubmitPlanningModificationsResponse> {
    const response = await firstValueFrom(
      this.#http.post<PlanningModification[] | SubmitPlanningModificationsResponse>(
        this.#buildTrialPlanningUrl(fireTrialId, centerId, 'modifications', 'submit'),
        body,
      ),
    );

    if (Array.isArray(response)) {
      return {
        modifications: response,
        acceptedCount: response.filter((m) => m.status === 'ACEPTADO').length,
        pendingCount: response.filter((m) => m.status === 'PENDIENTE').length,
      };
    }

    return response;
  }

  async approveModification(
    fireTrialId: FireTrial['id'],
    modId: string,
    body?: ReviewModificationRequest,
    centerId?: string,
  ): Promise<PlanningModification> {
    return firstValueFrom(
      this.#http.put<PlanningModification>(
        this.#buildTrialPlanningUrl(fireTrialId, centerId, 'modifications', modId, 'approve'),
        body ?? {},
      ),
    );
  }

  async rejectModification(
    fireTrialId: FireTrial['id'],
    modId: string,
    body?: ReviewModificationRequest,
    centerId?: string,
  ): Promise<PlanningModification> {
    return firstValueFrom(
      this.#http.put<PlanningModification>(
        this.#buildTrialPlanningUrl(fireTrialId, centerId, 'modifications', modId, 'reject'),
        body ?? {},
      ),
    );
  }

  #buildTrialPlanningUrl(
    fireTrialId: FireTrial['id'],
    centerId: string | undefined,
    ...segments: readonly PathSegment[]
  ): string {
    const resolvedCenterId = centerId ?? this.#trialContext?.context()?.centerId;
    const prefix: PathSegment[] = resolvedCenterId ? ['centers', resolvedCenterId] : [];
    return planningUrl(this.#planningUrl, ...prefix, 'fire-trials', fireTrialId, 'planning', ...segments);
  }
}
