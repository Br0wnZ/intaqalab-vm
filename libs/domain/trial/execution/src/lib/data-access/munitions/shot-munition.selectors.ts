import type { NormalizedMunitionComponent, NormalizedMunitionConfig, ShotMunitionComponentOption } from '../models';

export function isConfigAssignedToShot(config: NormalizedMunitionConfig, shotId: string | null): boolean {
  if (!shotId) return true;
  if (!config.assignedShotIds || config.assignedShotIds.length === 0) return true;
  return config.assignedShotIds.includes(shotId);
}

export function filterConfigsForShot(
  configs: readonly NormalizedMunitionConfig[],
  seriesId: string | null,
  shotId: string | null,
): NormalizedMunitionConfig[] {
  if (!seriesId) return [];
  return configs.filter((cfg) => cfg.seriesId === seriesId && isConfigAssignedToShot(cfg, shotId));
}

function toComponentOption(
  comp: NormalizedMunitionComponent,
  configId: string,
  source: 'CONFIGURATION' | 'COMPONENT',
): ShotMunitionComponentOption {
  return {
    value: comp.componentTypeId,
    label: comp.label,
    category: comp.category,
    rawCategory: comp.rawCategory,
    source,
    configurationId: configId,
    isFuse: comp.isFuse,
    planned: {
      denominationId: comp.denominationId,
      denominationName: comp.denominationName,
      batch: comp.batch,
      clientNumber: comp.clientNumber,
      fuseWorkingModeId: comp.fuseWorkingModeId,
      fuseMeasurement: comp.fuseMeasurement,
      loadingZoneValue: comp.loadingZoneValue,
      loadingZones: comp.loadingZones,
      quantity: comp.quantity,
    },
  };
}

/**
 * Pure selector extracting deduplicated ShotMunitionComponentOption list for a given series and shot.
 */
export function selectShotMunitionComponents(params: {
  configs: readonly NormalizedMunitionConfig[];
  seriesId: string | null;
  shotId: string | null;
}): ShotMunitionComponentOption[] {
  const matchingConfigs = filterConfigsForShot(params.configs, params.seriesId, params.shotId);
  const seenComponentTypes = new Set<string>();
  const options: ShotMunitionComponentOption[] = [];

  for (const config of matchingConfigs) {
    if (config.mainComponent && !seenComponentTypes.has(config.mainComponent.componentTypeId)) {
      seenComponentTypes.add(config.mainComponent.componentTypeId);
      options.push(toComponentOption(config.mainComponent, config.id, 'CONFIGURATION'));
    }

    for (const sub of config.subComponents) {
      if (!seenComponentTypes.has(sub.componentTypeId)) {
        seenComponentTypes.add(sub.componentTypeId);
        options.push(toComponentOption(sub, config.id, 'COMPONENT'));
      }
    }
  }

  return options;
}
