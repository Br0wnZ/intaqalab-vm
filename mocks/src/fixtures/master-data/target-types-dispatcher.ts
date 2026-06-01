import type { Request } from 'express';

import { getFixture } from '../../utils';

export const targetTypesDispatcher = (req: Request) => {
  return getFixture('fixtures/master-data', 'target-types-fixture.json');
};
