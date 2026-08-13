import type { MasterDataI18nItem, MasterDataIItem } from '../../utils-models/catalog.model';
import {
  type BackendMunitionComponent,
  type ComponentDetail,
  type ComponentType,
  type Configuration,
  type Denomination,
  type FuseWorkingMode,
  type MunitionConfigRequest,
  type Serie,
  type SeriesMunitionsData,
  getSelectedComponentTypes,
} from '../../utils-models/munitions.model';

export function mapLocalToRequest(series: Serie[]): MunitionConfigRequest[] {
  return series.flatMap((serie) =>
    serie.configurations.map(
      (config): MunitionConfigRequest => ({
        id: config.id,
        seriesId: serie.seriesId,
        denominationId: config.denomination,
        batch: config.batch,
        observations: config.observations,
        reconditioning: config.reconditioning,
        maxAllowedErrors: config.maxAllowedErrors,
        components: config.components.map((comp) => ({
          typeId: comp.type.id,
          denominationId: comp.denomination.id,
          batch: comp.batch,
          reconditioning: comp.reconditioning,
          clientNumber: comp.clientNumber,
          observations: comp.observations,
          fuseWorkingModeId: comp.fuseWorkingMode?.id,
          fuseMeasurement: comp.fuseMeasurement,
          maxAllowedErrors: comp.maxAllowedErrors,
        })),
        assignedShotIds: config.assignedShotIds ?? undefined,
      }),
    ),
  );
}
export function mapBackendToLocal(
  seriesMunitions: SeriesMunitionsData[],
  componentTypes: MasterDataI18nItem[],
  denominations: MasterDataI18nItem[],
  fuseWorkingModes: MasterDataIItem[],
): Serie[] {
  return seriesMunitions.map((series) => ({
    seriesId: series.seriesId,
    seriesName: series.seriesName,
    configurations: series.configurations.map((config): Configuration => {
      let powderCount = 0;
      const components = config.components.map((comp) => {
        const detail = mapComponentToDetail(comp, componentTypes, denominations, fuseWorkingModes);
        const typeNormalized = detail.type.type
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (typeNormalized === 'polvora' || typeNormalized.startsWith('polvora-')) {
          powderCount++;
          if (powderCount > 1) {
            detail.type.type = `polvora-${powderCount - 1}`;
            detail.type.label = `Pólvora ${powderCount - 1}`;
          } else {
            detail.type.type = 'pólvora';
            detail.type.label = 'Pólvora';
          }
        }
        return detail;
      });

      const denomination = resolveDenominationId(config.denomination?.id, denominations);

      return {
        id: config.id,
        seriesId: config.seriesId,
        munitionTypeId: config.munitionTypeId ?? '',
        denomination,
        batch: config.batch ?? '',
        reconditioning: config.reconditioning ?? undefined,
        maxAllowedErrors: config.maxAllowedErrors ?? 0,
        observations: config.observations ?? '',
        assignedShotIds: config.assignedShotIds ?? null,
        components,
        selectedComponents: getSelectedComponentTypes({
          id: config.id,
          seriesId: config.seriesId,
          munitionTypeId: config.munitionTypeId ?? '',
          denomination,
          batch: config.batch ?? '',
          maxAllowedErrors: config.maxAllowedErrors ?? 0,
          observations: config.observations ?? '',
          assignedShotIds: config.assignedShotIds ?? null,
          components,
        }),
      };
    }),
  }));
}

function mapComponentToDetail(
  component: BackendMunitionComponent,
  componentTypes: MasterDataI18nItem[],
  denominations: MasterDataI18nItem[],
  fuseWorkingModes: MasterDataIItem[],
): ComponentDetail {
  return {
    id: component.id,
    type: resolveComponentType(component, componentTypes),
    denomination: resolveDenomination(component, denominations),
    batch: component.batch ?? '',
    reconditioning: component.reconditioning ?? undefined,
    clientNumber:
      component.clientNumber !== undefined && component.clientNumber !== null ? String(component.clientNumber) : '',
    observations: component.observations ?? '',
    fuseWorkingMode: _resolveFuseWorkingMode(component, fuseWorkingModes),
    fuseMeasurement: component.fuseMeasurement ?? 0,
    maxAllowedErrors: component.maxAllowedErrors ?? 0,
    manufacturerNumber: '',
  };
}

function resolveDenominationId(denomination: string | null | undefined, denominations: MasterDataI18nItem[]): string {
  if (!denomination) return '';
  const found = denominations.find((d) => d.label === denomination || d.id === denomination);
  return found?.id ?? denomination;
}

function resolveDenomination(component: BackendMunitionComponent, denominations: MasterDataI18nItem[]): Denomination {
  if (component.denomination?.id) {
    return { id: component.denomination.id, name: component.denomination.name ?? '' };
  }

  const denominationId = component.denominationId?.id?.value ?? '';
  const matchedDenomination = denominations.find((item) => item.id === denominationId);
  const name = matchedDenomination?.label ?? component.denominationId?.name ?? '';

  return { id: denominationId, name: name ?? '' };
}

function resolveComponentType(
  component: BackendMunitionComponent,
  componentTypes: MasterDataI18nItem[],
): ComponentType {
  if (component.type?.id) {
    const typeId = component.type.id;
    const catalogType = componentTypes.find((ct) => ct.id === typeId);
    const label = catalogType?.label ?? component.type.label ?? '';
    return { id: component.type.id, type: label.toLowerCase(), label };
  }

  const typeId = component.typeId?.id?.value ?? '';
  const matchedType = componentTypes.find((item) => item.id === typeId);
  const label = matchedType?.label ?? component.typeId?.label ?? component.typeId?.type ?? '';

  return { id: typeId, label, type: label.toLowerCase() };
}

function _resolveFuseWorkingMode(
  component: BackendMunitionComponent,
  fuseWorkingModes: MasterDataIItem[],
): FuseWorkingMode | undefined {
  if (component.fuseWorkingMode?.id) {
    return component.fuseWorkingMode;
  }

  const fuseWorkingModeId = component.fuseWorkingModeId ?? '';
  if (!fuseWorkingModeId) return undefined;

  const matchedMode = fuseWorkingModes.find((item) => item.id === fuseWorkingModeId);
  const label = matchedMode?.label ?? '';

  return { id: fuseWorkingModeId, type: label, label };
}
