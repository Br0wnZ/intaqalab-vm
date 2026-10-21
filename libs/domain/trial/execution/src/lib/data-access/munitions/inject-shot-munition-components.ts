import { type Signal, computed, effect, inject, untracked } from '@angular/core';
import { PlanningMunitionsService, PlanningTrialContextService } from '@intaqalab/data-access-planning';

import type { NormalizedMunitionConfig, ShotMunitionComponentOption } from '../models';
import { injectMunitionTypes } from '../warehouse/inject-munition-types';
import { normalizePlanningMunitions } from './planning-munition.normalizer';
import { selectShotMunitionComponents } from './shot-munition.selectors';

export interface ShotMunitionComponentsHandle {
  /** Shot-scoped munition component options (main munition + subcomponents, deduplicated) */
  components: Signal<ShotMunitionComponentOption[]>;
  /** Fast lookup helper to resolve component details and planned data */
  findComponent: (componentTypeId: string) => ShotMunitionComponentOption | undefined;
  /** Full normalized configurations for the active trial */
  configs: Signal<NormalizedMunitionConfig[]>;
  /** Loading status of planning munitions + catalog types */
  isLoading: Signal<boolean>;
  /** Error from planning query or catalog types */
  error: Signal<Error | null>;
  /** Trigger manual reload */
  reload: () => void;
}

/**
 * Injects reactive shot-scoped munition component options.
 * Automatically loads planning munitions when the fireTrialId or context changes,
 * extracts and normalizes configurations, and scopes them to the selected series & shot.
 */
export function injectShotMunitionComponents(params: {
  seriesId: Signal<string | null>;
  shotId: Signal<string | null>;
  fireTrialId?: Signal<string | null>;
  planningMunitionsService?: PlanningMunitionsService;
  contextService?: PlanningTrialContextService;
}): ShotMunitionComponentsHandle {
  const service = params.planningMunitionsService ?? inject(PlanningMunitionsService);
  const contextService = params.contextService ?? inject(PlanningTrialContextService, { optional: true });
  const munitionTypesHandle = injectMunitionTypes();

  effect(() => {
    const trialId = params.fireTrialId ? params.fireTrialId() : (contextService?.context()?.fireTrialId ?? null);
    if (trialId) {
      untracked(() => service.load(trialId));
    }
  });

  const configs = computed<NormalizedMunitionConfig[]>(() => {
    if (!service.munitionsResource.hasValue()) return [];
    return normalizePlanningMunitions(service.munitionsResource.value(), munitionTypesHandle.typeCatalogMap());
  });

  const components = computed<ShotMunitionComponentOption[]>(() => {
    return selectShotMunitionComponents({
      configs: configs(),
      seriesId: params.seriesId(),
      shotId: params.shotId(),
    });
  });

  const error = computed<Error | null>(() => {
    const err = service.munitionsResource.error();
    if (err instanceof Error) return err;
    if (err) return new Error(String(err));
    return munitionTypesHandle.error();
  });

  return {
    components,
    findComponent: (componentTypeId: string) => components().find((c) => c.value === componentTypeId),
    configs,
    isLoading: computed(() => service.munitionsResource.isLoading() || munitionTypesHandle.isLoading()),
    error,
    reload: () => {
      service.reload();
      munitionTypesHandle.reload();
    },
  };
}
