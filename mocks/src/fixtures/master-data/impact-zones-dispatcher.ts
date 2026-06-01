import type { Request } from 'express';

import { getFixture } from '../../utils';

export const impactZonesDispatcher = (req: Request) => {
  return getFixture('fixtures/master-data', 'impact-zones-fixture.json');
};
