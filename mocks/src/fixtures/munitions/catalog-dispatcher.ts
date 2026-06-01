import type { Request } from 'express';

import { getFixture } from '../../utils';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export interface MasterDataI18nItem {
  id: string;
  name: Record<string, string>;
  label: string;
  active: boolean;
}

export interface MasterDataIItem {
  id: string;
  name: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
}

export interface CatalogQueryParams {
  name?: string;
  page: number;
  pageSize: number;
  active?: boolean;
  sort?: string[];
}

export function createI18nCatalogDispatcher<T extends MasterDataI18nItem>(fixturePath: string, fixtureName: string) {
  const items: T[] = getFixture<T[]>(fixturePath, fixtureName);

  const getAll = (req: Request): PaginatedResponse<T> => {
    const params = parseQueryParams(req);
    const acceptLanguage = getAcceptLanguage(req);

    let filtered = [...items];

    if (params.active !== undefined) {
      filtered = filtered.filter((item) => item.active === params.active);
    }

    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      filtered = filtered.filter((item) => {
        const label = item.name[acceptLanguage] || item.name['es'] || '';
        return label.toLowerCase().includes(searchTerm);
      });
    }

    if (params.sort?.length) {
      filtered = applySorting(filtered, params.sort);
    }

    filtered = filtered.map((item) => ({
      ...item,
      label: item.name[acceptLanguage] || item.name['es'] || '',
    }));

    return paginate(filtered, params.page, params.pageSize);
  };

  const create = (req: Request): T => {
    const body = req.body as Omit<T, 'id' | 'label'>;
    const newItem: T = {
      ...body,
      id: generateUuid(),
      label: body.name['es'] || '',
    } as T;
    items.push(newItem);
    return newItem;
  };

  const update = (req: Request): T | null => {
    const { id } = req.params;
    const body = req.body as Partial<Omit<T, 'id'>>;
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...body,
      label: body.name?.['es'] || items[index].label,
    };
    return items[index];
  };

  const remove = (req: Request): boolean => {
    const { id } = req.params;
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    return true;
  };

  return { getAll, create, update, remove };
}

export function createSimpleCatalogDispatcher<T extends MasterDataIItem>(fixturePath: string, fixtureName: string) {
  const items: T[] = getFixture<T[]>(fixturePath, fixtureName);

  const getAll = (req: Request): PaginatedResponse<T> => {
    const params = parseQueryParams(req);

    let filtered = [...items];

    if (params.active !== undefined) {
      filtered = filtered.filter((item) => item.active === params.active);
    }

    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm));
    }

    if (params.sort?.length) {
      filtered = applySorting(filtered, params.sort);
    }

    return paginate(filtered, params.page, params.pageSize);
  };

  const create = (req: Request): T => {
    const body = req.body as Omit<T, 'id'>;
    const newItem: T = {
      ...body,
      id: generateUuid(),
    } as T;
    items.push(newItem);
    return newItem;
  };

  const update = (req: Request): T | null => {
    const { id } = req.params;
    const body = req.body as Partial<Omit<T, 'id'>>;
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return null;

    items[index] = { ...items[index], ...body };
    return items[index];
  };

  const remove = (req: Request): boolean => {
    const { id } = req.params;
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) return false;

    items.splice(index, 1);
    return true;
  };

  return { getAll, create, update, remove };
}

function parseQueryParams(req: Request): CatalogQueryParams {
  const { name, page, pageSize, active, sort } = req.query;

  return {
    name: name as string | undefined,
    page: parseInt(page as string, 10) || 1,
    pageSize: parseInt(pageSize as string, 10) || 25,
    active: active !== undefined ? active === 'true' : undefined,
    sort: sort ? (Array.isArray(sort) ? (sort as string[]) : [sort as string]) : undefined,
  };
}

function getAcceptLanguage(req: Request): 'es' | 'en' {
  return (req.get('Accept-Language') as 'es' | 'en') || 'es';
}

function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    page,
    pageSize,
    totalElements: items.length,
    items: paginatedItems,
  };
}

function applySorting<T>(items: T[], sortParams: string[]): T[] {
  return [...items].sort((a, b) => {
    for (const sortParam of sortParams) {
      const [field, direction] = sortParam.split(',');
      const aValue = (a as Record<string, unknown>)[field];
      const bValue = (b as Record<string, unknown>)[field];

      if (aValue === bValue) continue;

      let comparison: number;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });
}
