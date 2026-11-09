import type {
  PlanningComponentData,
  PlanningComponentType,
  PlanningDenominationOption,
  PlanningMunitionOptionData,
  PlanningOptionsGroup,
} from '../../../execution/models';
import { isRecord, readArray } from '../../shared/unknown-readers';

export interface PlanningMunitionOptionsSources {
  munitionsResponse: unknown;
  componentTypesResponse: unknown;
  warehouseDenominationsResponse: unknown;
}

function catalogItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  return Array.isArray(value['items']) ? value['items'].filter(isRecord) : [];
}

function extractBatch(...sources: unknown[]): string | null {
  for (const src of sources) {
    if (isRecord(src)) {
      if (typeof src['batch'] === 'string' && src['batch'].trim()) return src['batch'].trim();
      if (typeof src['lote'] === 'string' && src['lote'].trim()) return src['lote'].trim();
      if (typeof src['lotNumber'] === 'string' && src['lotNumber'].trim()) return src['lotNumber'].trim();
    }
  }
  return null;
}

function extractClient(...sources: unknown[]): string | null {
  for (const src of sources) {
    if (isRecord(src)) {
      if (typeof src['clientNumber'] === 'string' && src['clientNumber'].trim()) return src['clientNumber'].trim();
      if (typeof src['clientNumber'] === 'number') return String(src['clientNumber']);
      if (typeof src['client'] === 'string' && src['client'].trim()) return src['client'].trim();
      if (typeof src['client'] === 'number') return String(src['client']);
      if (isRecord(src['client'])) {
        if (typeof src['client']['name'] === 'string' && src['client']['name'].trim())
          return src['client']['name'].trim();
        if (typeof src['client']['id'] === 'string' && src['client']['id'].trim()) return src['client']['id'].trim();
      }
      if (typeof src['numeroCliente'] === 'string' && src['numeroCliente'].trim()) return src['numeroCliente'].trim();
      if (typeof src['numeroCliente'] === 'number') return String(src['numeroCliente']);
      if (typeof src['customer'] === 'string' && src['customer'].trim()) return src['customer'].trim();
    }
  }
  return null;
}

/**
 * Transforma las respuestas crudas de planificación de municiones, tipos de
 * munición y denominaciones de almacén en las opciones agrupadas que consumen
 * los widgets. Función pura: mismo parsing defensivo que el servicio previo.
 */
export function mapPlanningMunitionOptions({
  munitionsResponse,
  componentTypesResponse,
  warehouseDenominationsResponse,
}: PlanningMunitionOptionsSources): PlanningMunitionOptionData {
  const root = isRecord(munitionsResponse) ? munitionsResponse : {};
  const seriesList = readArray(root['series']);

  const componentTypeCatalog = catalogItems(componentTypesResponse);
  const componentTypeMap = new Map<string, { label: string; category: string }>();
  componentTypeCatalog.forEach((item) => {
    if (!isRecord(item) || typeof item['id'] !== 'string') return;
    const label =
      typeof item['label'] === 'string' && item['label']
        ? item['label']
        : isRecord(item['name']) && typeof item['name']['es'] === 'string'
          ? item['name']['es']
          : typeof item['name'] === 'string'
            ? item['name']
            : item['id'];
    const category = typeof item['category'] === 'string' ? item['category'] : '';
    componentTypeMap.set(item['id'], { label, category });
  });

  const warehouseDenominationsByType = new Map<string, PlanningDenominationOption[]>();
  const warehouseDenominationsCatalog = catalogItems(warehouseDenominationsResponse);
  warehouseDenominationsCatalog.forEach((item) => {
    if (!isRecord(item) || typeof item['id'] !== 'string') return;
    const name =
      typeof item['name'] === 'string'
        ? item['name']
        : isRecord(item['name']) && typeof item['name']['es'] === 'string'
          ? item['name']['es']
          : item['id'];
    const compTypeId =
      isRecord(item['munitionType']) && typeof item['munitionType']['id'] === 'string'
        ? item['munitionType']['id']
        : '';
    if (compTypeId) {
      const list = warehouseDenominationsByType.get(compTypeId) ?? [];
      list.push({
        id: item['id'],
        name,
        componentTypeId: compTypeId,
        batch: null,
        clientNumber: null,
      });
      warehouseDenominationsByType.set(compTypeId, list);
    }
  });

  const configurationIds: string[] = [];
  const globalComponentTypes = new Map<string, PlanningComponentType>();
  const globalDenominations = new Map<string, PlanningDenominationOption>();
  const optionsBySelection: PlanningMunitionOptionData['optionsBySelection'] = {};
  const optionsByShot: PlanningMunitionOptionData['optionsByShot'] = {};
  const optionsBySeries: PlanningMunitionOptionData['optionsBySeries'] = {};

  seriesList.forEach((serieItem) => {
    if (!isRecord(serieItem)) return;
    const seriesId = typeof serieItem['seriesId'] === 'string' ? serieItem['seriesId'] : '';
    const configurations = Array.isArray(serieItem['configurations']) ? serieItem['configurations'] : [];
    const serieComponentTypes = new Map<string, PlanningComponentType>();
    const serieDenominations = new Map<string, PlanningDenominationOption>();
    const serieComponentData: Record<string, PlanningComponentData> = {};
    const serieDenomData: Record<string, PlanningComponentData> = {};

    configurations.forEach((configuration) => {
      if (!isRecord(configuration)) return;
      if (typeof configuration['id'] === 'string') {
        configurationIds.push(configuration['id']);
      }
      const localTypes = new Map<string, PlanningComponentType>();
      const localDenominations = new Map<string, PlanningDenominationOption>();
      const localComponentData: Record<string, PlanningComponentData> = {};
      const localDenomData: Record<string, PlanningComponentData> = {};

      const configDenom = configuration['denomination'];
      const configBatch = extractBatch(configDenom, configuration);
      const configClient = extractClient(configDenom, configuration);
      const configMunitionTypeId =
        typeof configuration['munitionTypeId'] === 'string' && configuration['munitionTypeId'].trim() !== ''
          ? configuration['munitionTypeId'].trim()
          : isRecord(configDenom) &&
              typeof configDenom['munitionTypeId'] === 'string' &&
              configDenom['munitionTypeId'].trim() !== ''
            ? configDenom['munitionTypeId'].trim()
            : '';
      const configDenomId =
        isRecord(configDenom) && typeof configDenom['id'] === 'string' && configDenom['id'].trim() !== ''
          ? configDenom['id'].trim()
          : typeof configDenom === 'string' && configDenom.trim() !== ''
            ? configDenom.trim()
            : null;

      if (configMunitionTypeId) {
        const catalogInfo = componentTypeMap.get(configMunitionTypeId);
        const label = catalogInfo?.label ?? configMunitionTypeId;
        const category = catalogInfo?.category ?? 'MUNITION';
        const entry: PlanningComponentType = { id: configMunitionTypeId, label, category };
        localTypes.set(configMunitionTypeId, entry);
        serieComponentTypes.set(configMunitionTypeId, entry);
        globalComponentTypes.set(configMunitionTypeId, entry);

        if (configDenomId) {
          const denomName =
            isRecord(configDenom) && typeof configDenom['name'] === 'string' ? configDenom['name'] : configDenomId;
          const denomItem: PlanningDenominationOption = {
            id: configDenomId,
            name: denomName,
            componentTypeId: configMunitionTypeId,
            batch: configBatch,
            clientNumber: configClient,
          };
          localDenominations.set(denomItem.id, denomItem);
          serieDenominations.set(denomItem.id, denomItem);
          globalDenominations.set(denomItem.id, denomItem);

          const compData: PlanningComponentData = {
            componentTypeId: configMunitionTypeId,
            denominationId: denomItem.id,
            batch: configBatch,
            clientNumber: configClient,
          };
          localComponentData[configMunitionTypeId] = compData;
          localDenomData[denomItem.id] = compData;
          serieComponentData[configMunitionTypeId] = compData;
          serieDenomData[denomItem.id] = compData;
        } else {
          const matchingDenoms = warehouseDenominationsByType.get(configMunitionTypeId) ?? [];
          matchingDenoms.forEach((denom) => {
            localDenominations.set(denom.id, denom);
            serieDenominations.set(denom.id, denom);
            globalDenominations.set(denom.id, denom);
          });

          const compData: PlanningComponentData = {
            componentTypeId: configMunitionTypeId,
            denominationId: null,
            batch: configBatch,
            clientNumber: configClient,
          };
          localComponentData[configMunitionTypeId] = compData;
          serieComponentData[configMunitionTypeId] = compData;
        }
      }

      if (Array.isArray(configuration['components'])) {
        configuration['components'].forEach((component) => {
          if (!isRecord(component)) return;
          const type = isRecord(component['type']) ? component['type'] : undefined;
          const compTypeId =
            type && typeof type['id'] === 'string' && type['id'].trim() !== ''
              ? type['id'].trim()
              : typeof component['munitionTypeId'] === 'string' && component['munitionTypeId'].trim() !== ''
                ? component['munitionTypeId'].trim()
                : null;
          if (!compTypeId) return;

          const catalogInfo = componentTypeMap.get(compTypeId);
          const compLabel =
            type && typeof type['label'] === 'string' && type['label']
              ? type['label']
              : (catalogInfo?.label ?? compTypeId);
          const compCategory =
            catalogInfo?.category || (type && typeof type['type'] === 'string' ? type['type'] : 'MUNITION_COMPONENT');
          const entry: PlanningComponentType = { id: compTypeId, label: compLabel, category: compCategory };

          localTypes.set(compTypeId, entry);
          serieComponentTypes.set(compTypeId, entry);
          globalComponentTypes.set(compTypeId, entry);

          const denomination = component['denomination'];
          const compBatch = extractBatch(denomination, component);
          const compClient = extractClient(denomination, component);
          const compDenomId =
            isRecord(denomination) && typeof denomination['id'] === 'string' && denomination['id'].trim() !== ''
              ? denomination['id'].trim()
              : typeof denomination === 'string' && denomination.trim() !== ''
                ? denomination.trim()
                : null;

          if (compDenomId) {
            const denomName =
              isRecord(denomination) && typeof denomination['name'] === 'string' ? denomination['name'] : compDenomId;
            const item: PlanningDenominationOption = {
              id: compDenomId,
              name: denomName,
              componentTypeId: compTypeId,
              batch: compBatch,
              clientNumber: compClient,
            };
            localDenominations.set(item.id, item);
            serieDenominations.set(item.id, item);
            globalDenominations.set(item.id, item);
          } else {
            const matchingDenoms = warehouseDenominationsByType.get(compTypeId) ?? [];
            matchingDenoms.forEach((denom) => {
              localDenominations.set(denom.id, denom);
              serieDenominations.set(denom.id, denom);
              globalDenominations.set(denom.id, denom);
            });
          }

          const compData: PlanningComponentData = {
            componentTypeId: compTypeId,
            denominationId: compDenomId,
            batch: compBatch,
            clientNumber: compClient,
          };
          localComponentData[compTypeId] = compData;
          if (compDenomId) {
            localDenomData[compDenomId] = compData;
            serieDenomData[compDenomId] = compData;
          }
          serieComponentData[compTypeId] = compData;
        });
      }

      const configSeriesId =
        typeof configuration['seriesId'] === 'string' && configuration['seriesId']
          ? configuration['seriesId']
          : seriesId;
      const shotIds = Array.isArray(configuration['assignedShotIds']) ? configuration['assignedShotIds'] : [];
      shotIds
        .filter((shotId): shotId is string => typeof shotId === 'string')
        .forEach((shotId) => {
          const shotOptions: PlanningOptionsGroup = {
            componentTypes: [...localTypes.values()],
            denominations: [...localDenominations.values()],
            componentData: { ...localComponentData },
            denominationData: { ...localDenomData },
          };
          if (configSeriesId) {
            optionsBySelection[`${configSeriesId}|${shotId}`] = shotOptions;
          }
          optionsByShot[shotId] = shotOptions;
        });
    });

    if (seriesId) {
      optionsBySeries[seriesId] = {
        componentTypes: [...serieComponentTypes.values()],
        denominations: [...serieDenominations.values()],
        componentData: { ...serieComponentData },
        denominationData: { ...serieDenomData },
      };
    }
  });

  return {
    configurationIds,
    componentTypes: [...globalComponentTypes.values()],
    denominations: [...globalDenominations.values()],
    optionsBySelection,
    optionsByShot,
    optionsBySeries,
  };
}
