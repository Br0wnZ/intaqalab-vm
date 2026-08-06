import type { Request } from 'express';

import { getFixture } from '../../utils';

export interface EquipmentDenominationItem {
  id: number | string;
  name: string;
  itemType?: string;
  familyId?: number;
  active?: boolean;
}

export interface EquipmentItem {
  id: string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
}

/** Forma interna del fixture: incluye campos usados solo para filtrar, no expuestos por el contrato público. */
interface EquipmentItemFixtureEntry extends EquipmentItem {
  itemType: string;
  familyId?: number;
  active?: boolean;
}

export interface PaginatedEquipmentResponse<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
}

function parseArrayQueryParam(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

export function getEquipmentDenominationsDispatcher(req: Request): PaginatedEquipmentResponse<EquipmentDenominationItem> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 100;
  const itemTypes = parseArrayQueryParam(req.query.itemType);
  const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
  const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

  const rawData = getFixture<{ items: EquipmentDenominationItem[] }>('fixtures/equipment', 'equipment-denominations-fixture.json');
  let filtered = [...rawData.items];

  if (itemTypes.length > 0) {
    filtered = filtered.filter((item) => item.itemType && itemTypes.includes(item.itemType));
  }

  if (familyId !== undefined) {
    filtered = filtered.filter((item) => item.familyId === familyId);
  }

  if (active !== undefined) {
    filtered = filtered.filter((item) => item.active === active);
  }

  const totalElements = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  return {
    page,
    pageSize,
    totalElements,
    items,
  };
}

export function getEquipmentItemsDispatcher(req: Request): PaginatedEquipmentResponse<EquipmentItem> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 100;
  const itemTypes = parseArrayQueryParam(req.query.itemType);
  const familyId = req.query.familyId ? parseInt(req.query.familyId as string) : undefined;
  const denominationId = req.query.denominationId ? parseInt(req.query.denominationId as string) : undefined;
  const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

  const rawData = getFixture<{ items: EquipmentItemFixtureEntry[] }>(
    'fixtures/equipment',
    'equipment-items-fixture.json',
  );
  let filtered = [...rawData.items];

  if (itemTypes.length > 0) {
    filtered = filtered.filter((item) => item.itemType && itemTypes.includes(item.itemType));
  }

  if (familyId !== undefined) {
    filtered = filtered.filter((item) => item.familyId === familyId);
  }

  if (denominationId !== undefined) {
    filtered = filtered.filter((item) => item.denominationId === denominationId);
  }

  if (active !== undefined) {
    filtered = filtered.filter((item) => item.active === active);
  }

  const totalElements = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize).map(
    ({ id, tag, serialNumber, denominationId: itemDenominationId, denominationName, modelName }) => ({
      id,
      tag,
      serialNumber,
      denominationId: itemDenominationId,
      denominationName,
      modelName,
    }),
  );

  return {
    page,
    pageSize,
    totalElements,
    items,
  };
}
