import type { Request } from 'express';

import { getFixture } from '../../utils';

export const targetMaterialsDispatcher = (req: Request) => {
  return getFixture('fixtures/master-data', 'target-materials-fixture.json');
};
