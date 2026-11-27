import { HttpClient, httpResource } from '@angular/common/http';
import { Injector, Service, inject, signal } from '@angular/core';
import { injectPlanningEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { firstValueFrom } from 'rxjs';

import type {
  ApplyPlanningChangesRequest,
  CreatePlanningChangesRequest,
  PlanningChange,
} from '../../execution/models/planning-changes.models';
import type { PathSegment } from '../execution/shared/execution-endpoints';
import { planningUrl } from '../execution/shared/execution-endpoints';
import { awaitResourceValue } from '../execution/shared/resource-await';

interface PlanningChangesTarget {
  fireTrialId: FireTrial['id'];
}

@Service()
export class PlanningChangesService {
  readonly #http = inject(HttpClient);
  readonly #injector = inject(Injector);
  readonly #planningEndpoint = injectPlanningEndpoint();
  readonly #target = signal<PlanningChangesTarget | null>(null);

  readonly #fetchTarget = signal<PlanningChangesTarget | null>(null);

  readonly resource = httpResource<PlanningChange[]>(() => {
    const target = this.#target();
    if (!target) return undefined;

    return {
      url: this.#buildUrl(target.fireTrialId, 'changes'),
      method: 'GET',
    };
  });

  readonly #fetchResource = httpResource<PlanningChange[]>(() => {
    const target = this.#fetchTarget();
    if (!target) return undefined;

    return {
      url: this.#buildUrl(target.fireTrialId, 'changes'),
      method: 'GET',
    };
  });

  load(fireTrialId: FireTrial['id']): void {
    this.#target.set({ fireTrialId });
  }

  reload(): void {
    this.resource.reload();
  }

  async fetch(fireTrialId: FireTrial['id']): Promise<PlanningChange[]> {
    this.#fetchTarget.set({ fireTrialId });
    return awaitResourceValue(this.#fetchResource, this.#injector);
  }

  async create(fireTrialId: FireTrial['id'], request: CreatePlanningChangesRequest): Promise<PlanningChange[]> {
    return firstValueFrom(this.#http.post<PlanningChange[]>(this.#buildUrl(fireTrialId, 'changes'), request));
  }

  async apply(fireTrialId: FireTrial['id'], request: ApplyPlanningChangesRequest): Promise<PlanningChange[]> {
    return firstValueFrom(this.#http.post<PlanningChange[]>(this.#buildUrl(fireTrialId, 'changes', 'apply'), request));
  }

  #buildUrl(fireTrialId: FireTrial['id'], ...segments: readonly PathSegment[]): string {
    return planningUrl(this.#planningEndpoint, 'fire-trials', fireTrialId, 'planning', ...segments);
  }
}
