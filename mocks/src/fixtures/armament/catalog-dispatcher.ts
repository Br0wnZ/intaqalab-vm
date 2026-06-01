import type { Request } from 'express';

import { getFixture } from '../../utils';

interface SpecimenItem {
  id: string;
  name: string;
  type: 'WEAPON' | 'TUBE' | 'MUNITION';
  active: boolean;
}

interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  totalElements: number;
  items: T[];
}

function parseQueryParams(req: Request) {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 100;
  const name = req.query.name as string | undefined;
  const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;

  return { page, pageSize, name, active };
}

export function createWeaponsCatalogDispatcher() {
  const allSpecimens: SpecimenItem[] = getFixture<{ items: SpecimenItem[] }>(
    'fixtures/trial-planning',
    'specimens-fixture.json',
  ).items;

  const getAll = (req: Request): PaginatedResponse<SpecimenItem> => {
    const params = parseQueryParams(req);

    let filtered = allSpecimens.filter((item) => item.type === 'WEAPON');

    if (params.active !== undefined) {
      filtered = filtered.filter((item) => item.active === params.active);
    }

    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm));
    }

    const totalElements = filtered.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const items = filtered.slice(startIndex, endIndex);

    return {
      page: params.page,
      pageSize: params.pageSize,
      totalElements,
      items,
    };
  };

  return { getAll };
}

export function createTubesCatalogDispatcher() {
  const allSpecimens: SpecimenItem[] = getFixture<{ items: SpecimenItem[] }>(
    'fixtures/trial-planning',
    'specimens-fixture.json',
  ).items;

  const getAll = (req: Request): PaginatedResponse<SpecimenItem> => {
    const params = parseQueryParams(req);

    let filtered = allSpecimens.filter((item) => item.type === 'TUBE');

    if (params.active !== undefined) {
      filtered = filtered.filter((item) => item.active === params.active);
    }

    if (params.name) {
      const searchTerm = params.name.toLowerCase();
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchTerm));
    }

    const totalElements = filtered.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;
    const items = filtered.slice(startIndex, endIndex);

    return {
      page: params.page,
      pageSize: params.pageSize,
      totalElements,
      items,
    };
  };

  return { getAll };
}
