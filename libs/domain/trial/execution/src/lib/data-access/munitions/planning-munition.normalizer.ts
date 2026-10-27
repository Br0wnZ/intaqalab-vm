import type {
  MunitionCategoryEnum,
  MunitionTypeItem,
  NormalizedMunitionComponent,
  NormalizedMunitionConfig,
} from '../models';
import {
  isRecord,
  readArray,
  readNestedId,
  readNumber,
  readRecord,
  readString,
  readStringOrNumber,
} from '../shared/unknown-readers';

export function resolveComponentCategory(label: string, rawCategory?: string | null): string {
  const lower = label.toLowerCase();
  const rawLower = (rawCategory ?? '').toLowerCase();
  if (
    lower.includes('espoleta') ||
    lower.includes('fuse') ||
    lower.includes('fuze') ||
    rawLower.includes('fuse') ||
    rawLower.includes('fuze')
  ) {
    return 'espoleta';
  }
  if (lower.includes('pólvora') || lower.includes('polvora') || lower.includes('powder')) return 'polvo';
  if (lower.includes('granada') || lower.includes('grenade') || lower.includes('proyectil')) return 'granada';
  if (lower.includes('suplemento') || lower.includes('supplement') || rawLower.includes('supplement')) {
    return 'suplemento';
  }
  if (
    lower.includes('carga') ||
    lower.includes('charge') ||
    rawLower.includes('charge') ||
    rawLower.includes('propell')
  ) {
    return 'carga';
  }
  if (rawCategory === 'MUNITION') return 'munition';
  return 'componente';
}

export function isFuseComponent(params: {
  label: string;
  category: string;
  fuseWorkingModeId: string | null;
  fuseMeasurement: number | null;
  rawType?: string | null;
}): boolean {
  const lowerLabel = params.label.toLowerCase();
  const lowerCategory = params.category.toLowerCase();
  if (
    lowerCategory === 'granada' ||
    lowerCategory === 'proyectil' ||
    lowerCategory === 'projectile' ||
    lowerCategory === 'carga' ||
    lowerCategory === 'charge' ||
    lowerCategory === 'polvo' ||
    lowerCategory === 'powder' ||
    lowerCategory === 'suplemento' ||
    lowerLabel.includes('proyectil') ||
    lowerLabel.includes('granada') ||
    lowerLabel.includes('projectile') ||
    lowerLabel.includes('carga') ||
    lowerLabel.includes('charge') ||
    lowerLabel.includes('propell') ||
    lowerLabel.includes('pólvora') ||
    lowerLabel.includes('polvora') ||
    lowerLabel.includes('powder') ||
    lowerLabel.includes('suplemento')
  ) {
    return false;
  }
  if (params.category === 'espoleta') return true;
  if (lowerLabel.includes('espoleta') || lowerLabel.includes('fuse') || lowerLabel.includes('fuze')) return true;
  if (params.rawType?.toUpperCase() === 'FUSE' || params.rawType?.toUpperCase() === 'FUZE') return true;
  if (params.fuseWorkingModeId !== null || params.fuseMeasurement !== null) return true;
  return false;
}

export interface TypeCatalogInfo {
  label: string;
  category: string;
  rawCategory: MunitionCategoryEnum | null;
}

export function buildTypeCatalogMap(catalog: MunitionTypeItem[]): Map<string, TypeCatalogInfo> {
  const map = new Map<string, TypeCatalogInfo>();
  for (const item of catalog) {
    if (!item || !item.id) continue;
    let label = item.label;
    if (!label && typeof item.name === 'string') {
      label = item.name;
    } else if (!label && isRecord(item.name) && typeof item.name['es'] === 'string') {
      label = item.name['es'];
    }
    const finalLabel = label || item.id;
    const cat = resolveComponentCategory(finalLabel, item.category);
    map.set(item.id, {
      label: finalLabel,
      category: cat,
      rawCategory: item.category,
    });
  }
  return map;
}

/**
 * Normalizes a raw TrialMunitionsResponse / planning munitions payload into
 * a clean, strongly-typed array of NormalizedMunitionConfig objects.
 */
export function normalizePlanningMunitions(
  raw: unknown,
  typeCatalog: Map<string, TypeCatalogInfo> = new Map(),
): NormalizedMunitionConfig[] {
  const root = readRecord(raw);
  if (!root) return [];

  const seriesList = readArray(root['series']);
  const configs: NormalizedMunitionConfig[] = [];

  for (const serieItem of seriesList) {
    const serieRec = readRecord(serieItem);
    if (!serieRec) continue;
    const seriesId = readString(serieRec['seriesId']) ?? readString(serieRec['id']) ?? '';
    const configList = readArray(serieRec['configurations']);

    for (const configItem of configList) {
      const configRec = readRecord(configItem);
      if (!configRec) continue;

      const configId = readString(configRec['id']) ?? '';
      const configSeriesId = readString(configRec['seriesId']) ?? seriesId;

      const rawAssignedShots = configRec['assignedShotIds'];
      const assignedShotIds = Array.isArray(rawAssignedShots)
        ? rawAssignedShots.map(readString).filter((s): s is string => Boolean(s))
        : null;

      // ── Main Munition Component ─────────────────────────────────────────────
      const denomRaw = configRec['denomination'];
      const denomRec = readRecord(denomRaw);

      const munitionTypeRaw = configRec['munitionType'];
      const munitionTypeId =
        readString(configRec['munitionTypeId']) ??
        readNestedId(munitionTypeRaw) ??
        (denomRec ? readString(denomRec['munitionTypeId']) : null);

      const denomId = denomRec ? readNestedId(denomRec['id']) : readString(denomRaw);

      const denomName = denomRec ? (readString(denomRec['name']) ?? denomId) : denomId;

      const batch =
        readString(configRec['batch']) ??
        readString(configRec['lote']) ??
        (denomRec ? readString(denomRec['batch']) : null);

      const clientNumber =
        readStringOrNumber(configRec['clientNumber']) ??
        readStringOrNumber(configRec['numeroCliente']) ??
        (denomRec ? readStringOrNumber(denomRec['clientNumber']) : null);

      let mainComponent: NormalizedMunitionComponent | null = null;

      if (munitionTypeId) {
        const catalogInfo = typeCatalog.get(munitionTypeId);
        const label = catalogInfo?.label ?? denomName ?? munitionTypeId;
        const category = catalogInfo?.category ?? resolveComponentCategory(label, 'MUNITION');
        const rawCategory = catalogInfo?.rawCategory ?? 'MUNITION';

        mainComponent = {
          id: `${configId}-main`,
          componentTypeId: munitionTypeId,
          label,
          category,
          rawCategory,
          denominationId: denomId,
          denominationName: denomName,
          batch,
          clientNumber,
          fuseWorkingModeId: null,
          fuseMeasurement: null,
          loadingZoneValue: null,
          loadingZones: [],
          quantity: null,
          isFuse: isFuseComponent({
            label,
            category,
            fuseWorkingModeId: null,
            fuseMeasurement: null,
            rawType: 'MUNITION',
          }),
        };
      }

      // ── Sub-Components ──────────────────────────────────────────────────────
      const rawSubComponents = readArray(configRec['components']);
      const subComponents: NormalizedMunitionComponent[] = [];

      for (const compItem of rawSubComponents) {
        const compRec = readRecord(compItem);
        if (!compRec) continue;

        const compId = readString(compRec['id']) ?? '';
        const typeRaw = compRec['type'];
        const typeIdRaw = compRec['typeId'];
        const componentTypeRaw = compRec['componentType'];
        const componentTypeIdRaw = compRec['componentTypeId'];
        const typeRec = readRecord(typeRaw) ?? readRecord(componentTypeRaw);
        const typeIdRec = readRecord(typeIdRaw) ?? readRecord(componentTypeIdRaw);

        const compTypeId =
          readNestedId(typeRaw) ??
          readNestedId(typeIdRaw) ??
          readNestedId(componentTypeRaw) ??
          readNestedId(componentTypeIdRaw) ??
          readString(compRec['munitionTypeId']);

        if (!compTypeId) continue;

        const compDenomRaw = compRec['denomination'];
        const compDenomIdRaw = compRec['denominationId'];
        const compDenomRec = readRecord(compDenomRaw);
        const compDenomIdRec = readRecord(compDenomIdRaw);

        const compDenomId = readNestedId(compDenomRaw) ?? readNestedId(compDenomIdRaw);

        const compDenomName =
          (compDenomRec ? readString(compDenomRec['name']) : null) ??
          (compDenomIdRec ? readString(compDenomIdRec['name']) : null) ??
          compDenomId;

        const catalogInfo = typeCatalog.get(compTypeId);
        const labelFromPayload =
          (typeRec ? readString(typeRec['label']) : null) ?? (typeIdRec ? readString(typeIdRec['label']) : null);

        const label = labelFromPayload ?? catalogInfo?.label ?? compDenomName ?? compTypeId;
        const rawType =
          (typeRec ? readString(typeRec['type']) : null) ?? (typeIdRec ? readString(typeIdRec['type']) : null);

        const category = catalogInfo?.category ?? resolveComponentCategory(label, rawType ?? 'MUNITION_COMPONENT');
        const rawCategory = catalogInfo?.rawCategory ?? 'MUNITION_COMPONENT';

        const compBatch =
          readString(compRec['batch']) ??
          readString(compRec['lote']) ??
          (compDenomRec ? readString(compDenomRec['batch']) : null);

        const compClientNumber =
          readStringOrNumber(compRec['clientNumber']) ??
          readStringOrNumber(compRec['numeroCliente']) ??
          (compDenomRec ? readStringOrNumber(compDenomRec['clientNumber']) : null);

        const fuseWorkingModeId =
          readNestedId(compRec['fuseWorkingMode']) ??
          readNestedId(compRec['fuseWorkingModeId']) ??
          readNestedId(compRec['modoFuncionamiento']);

        const fuseMeasurement =
          readNumber(compRec['fuseMeasurement']) ??
          readNumber(compRec['fuseGraduation']) ??
          readNumber(compRec['graduacionEspoleta']);

        const loadingZoneValue =
          readString(compRec['loadingZoneValue']) ??
          readString(compRec['loadingZone']) ??
          readString(compRec['zona']) ??
          readString(compRec['zone']);

        const rawZonesArray = Array.isArray(compRec['zones'])
          ? (compRec['zones'] as unknown[])
          : Array.isArray(compRec['loadingZones'])
            ? (compRec['loadingZones'] as unknown[])
            : Array.isArray(compRec['zone'])
              ? (compRec['zone'] as unknown[])
              : null;

        const parsedZones = rawZonesArray ? rawZonesArray.map(readString).filter((z): z is string => Boolean(z)) : [];

        const loadingZones = parsedZones.length > 0 ? parsedZones : loadingZoneValue ? [loadingZoneValue] : [];

        const quantity = readNumber(compRec['quantity']) ?? readNumber(compRec['cantidad']) ?? null;

        const isFuse = isFuseComponent({
          label,
          category,
          fuseWorkingModeId,
          fuseMeasurement,
          rawType,
        });

        subComponents.push({
          id: compId,
          componentTypeId: compTypeId,
          label,
          category,
          rawCategory,
          denominationId: compDenomId,
          denominationName: compDenomName,
          batch: compBatch,
          clientNumber: compClientNumber,
          fuseWorkingModeId,
          fuseMeasurement,
          loadingZoneValue,
          loadingZones,
          isFuse,
          quantity,
        });
      }

      configs.push({
        id: configId,
        seriesId: configSeriesId,
        assignedShotIds,
        mainComponent,
        subComponents,
      });
    }
  }

  return configs;
}
