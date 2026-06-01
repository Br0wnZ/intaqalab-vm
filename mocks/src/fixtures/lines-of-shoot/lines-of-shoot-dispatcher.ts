import type { Request } from 'express';

import { getFixture } from '../../utils';

interface LinesOfShootItem {
  id: string;
  name: Record<string, string>;
  label: string;
  active: boolean;
}

interface LinesOfShootListResponse {
  page: number;
  pageSize: number;
  totalElements: number;
  items: LinesOfShootItem[];
}

export function linesOfShootDispatcher(req: Request): LinesOfShootListResponse {
  const name = req.query['name']?.toString().toLowerCase();
  const activeParam = req.query['active']?.toString();
  const page = parseInt((req.query['page'] as string) ?? '1', 10);
  const pageSize = parseInt((req.query['pageSize'] as string) ?? '25', 10);

  const all = getFixture<LinesOfShootItem[]>('fixtures/lines-of-shoot', 'lines-of-shoot-fixture.json');

  const filtered = all.filter((item) => {
    if (name && !item.label.toLowerCase().includes(name)) return false;
    if (activeParam !== undefined && item.active !== (activeParam === 'true')) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    page,
    pageSize,
    totalElements: filtered.length,
    items,
  };
}
