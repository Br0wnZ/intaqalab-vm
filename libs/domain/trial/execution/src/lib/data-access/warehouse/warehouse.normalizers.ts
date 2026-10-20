import type {
  BatchOption,
  DenominationItem,
  DenominationOption,
  MunitionTypeItem,
  PlannedComponentData,
  StockListItem,
} from '../models';
import {
  isRecord,
  readArray,
  readNestedId,
  readNumber,
  readRecord,
  readString,
} from '../shared/unknown-readers';

export function resolveI18nName(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  const rec = readRecord(value);
  if (rec) {
    if (typeof rec['es'] === 'string' && rec['es'].trim()) return rec['es'].trim();
    if (typeof rec['en'] === 'string' && rec['en'].trim()) return rec['en'].trim();
    if (typeof rec['name'] === 'string' && rec['name'].trim()) return rec['name'].trim();
  }
  return fallback;
}

export function extractCatalogItems(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  const rec = readRecord(raw);
  if (!rec) return [];
  const items = readArray(rec['items']);
  if (items.length > 0) return items.filter(isRecord);
  return [];
}

export function normalizeMunitionTypes(raw: unknown): MunitionTypeItem[] {
  const items = extractCatalogItems(raw);
  const result: MunitionTypeItem[] = [];

  for (const item of items) {
    const id = readString(item['id']);
    if (!id) continue;
    const rawCat = readString(item['category']);
    const category = rawCat === 'MUNITION' ? 'MUNITION' : 'MUNITION_COMPONENT';
    const label = readString(item['label']) ?? resolveI18nName(item['name'], id);
    const observations = readString(item['observations']) ?? undefined;
    const active = typeof item['active'] === 'boolean' ? item['active'] : true;

    result.push({
      id,
      category,
      label,
      observations,
      active,
    });
  }

  return result;
}

export function normalizeDenominations(raw: unknown): DenominationItem[] {
  const items = extractCatalogItems(raw);
  const result: DenominationItem[] = [];

  for (const item of items) {
    const id = readString(item['id']);
    if (!id) continue;
    const rawCat = readString(item['category']);
    const category = rawCat === 'MUNITION' ? 'MUNITION' : 'MUNITION_COMPONENT';
    const name = resolveI18nName(item['name'], id);

    let munitionType: { id: string; name: string } | null = null;
    const typeRec = readRecord(item['munitionType']);
    if (typeRec) {
      const typeId = readString(typeRec['id']);
      if (typeId) {
        munitionType = { id: typeId, name: resolveI18nName(typeRec['name'], typeId) };
      }
    } else {
      const typeId = readString(item['componentTypeId']) ?? readString(item['munitionTypeId']);
      if (typeId) {
        munitionType = { id: typeId, name: typeId };
      }
    }

    result.push({
      id,
      category,
      name,
      munitionType,
      neq: readNumber(item['neq']) ?? undefined,
      unNumber: readString(item['unNumber']) ?? undefined,
      weight: readNumber(item['weight']) ?? undefined,
      active: typeof item['active'] === 'boolean' ? item['active'] : true,
    });
  }

  return result;
}

export function toDenominationOptions(params: {
  denominations: readonly DenominationItem[];
  munitionTypeId?: string | null;
  planned?: PlannedComponentData | null;
}): DenominationOption[] {
  const filtered = params.munitionTypeId
    ? params.denominations.filter((d) => d.munitionType?.id === params.munitionTypeId)
    : params.denominations;

  const options: DenominationOption[] = filtered.map((d) => ({
    value: d.id,
    label: d.name,
    munitionTypeId: d.munitionType?.id ?? '',
    planned: d.id === params.planned?.denominationId,
    inStock: true,
  }));

  const plannedId = params.planned?.denominationId;
  if (plannedId && !options.some((opt) => opt.value === plannedId)) {
    options.unshift({
      value: plannedId,
      label: params.planned?.denominationName ?? plannedId,
      munitionTypeId: params.munitionTypeId ?? '',
      planned: true,
      inStock: false,
      batch: params.planned?.batch ?? null,
      clientNumber: params.planned?.clientNumber ?? null,
    });
  }

  return options;
}

export function normalizeStockItems(raw: unknown): StockListItem[] {
  const items = extractCatalogItems(raw);
  const result: StockListItem[] = [];

  for (const item of items) {
    const batch = readString(item['batch']);
    if (!batch) continue;
    const id = readString(item['id']) ?? batch;

    const rawCat = readString(item['category']);
    const category = rawCat === 'MUNITION' ? 'MUNITION' : 'MUNITION_COMPONENT';
    const status = readString(item['status']) === 'RETIRED' ? 'RETIRED' : 'AVAILABLE';
    const quantity = readNumber(item['quantity']) ?? 0;

    let munitionType: { id: string; name: string } | null = null;
    const typeRec = readRecord(item['munitionType']);
    if (typeRec) {
      const typeId = readString(typeRec['id']);
      if (typeId) {
        munitionType = { id: typeId, name: resolveI18nName(typeRec['name'], typeId) };
      }
    }

    let denomination: { id: string; name: string } | null = null;
    const denomRec = readRecord(item['denomination']);
    if (denomRec) {
      const denomId = readNestedId(denomRec['id']) ?? readString(item['denominationId']);
      if (denomId) {
        denomination = { id: denomId, name: resolveI18nName(denomRec['name'], denomId) };
      }
    }

    result.push({
      id,
      category,
      batch,
      status,
      quantity,
      cellName: readString(item['cellName']) ?? undefined,
      munitionType,
      denomination,
    });
  }

  return result;
}

export function toBatchOptions(params: {
  stockItems: readonly StockListItem[];
  denominationId: string | null;
  plannedBatch?: string | null;
}): BatchOption[] {
  const targetDenomId = params.denominationId;
  if (!targetDenomId) return [];

  // Filter stock for the denomination and aggregate quantity by batch
  const batchMap = new Map<string, number>();

  for (const item of params.stockItems) {
    const itemDenomId = item.denomination?.id;
    if (itemDenomId === targetDenomId && item.status === 'AVAILABLE') {
      const currentQty = batchMap.get(item.batch) ?? 0;
      batchMap.set(item.batch, currentQty + item.quantity);
    }
  }

  const options: BatchOption[] = [];
  for (const [batch, quantity] of batchMap.entries()) {
    options.push({
      value: batch,
      label: batch,
      denominationId: targetDenomId,
      quantity,
      planned: batch === params.plannedBatch,
      inStock: true,
    });
  }

  // If plannedBatch is not in stock, add it with inStock = false
  if (params.plannedBatch && !options.some((opt) => opt.value === params.plannedBatch)) {
    options.unshift({
      value: params.plannedBatch,
      label: params.plannedBatch,
      denominationId: targetDenomId,
      quantity: 0,
      planned: true,
      inStock: false,
    });
  }

  return options;
}
