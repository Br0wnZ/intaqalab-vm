import type { Request } from 'express';

import { getFixture } from '../../utils';

type Specimen = {
  id: string;
  name: string;
  type: string;
  active: boolean;
};

type PaginatedSpecimens = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: Specimen[];
};

export const specimensDispatcher = (req: Request) => {
  const specimens = getFixture('fixtures/trial-planning', 'specimens-fixture.json') as PaginatedSpecimens;
  return specimens;
};
