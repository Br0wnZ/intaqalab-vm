import type { Request } from 'express';

import { getFixture } from '../../utils';

export const targetDimensionsDispatcher = (req: Request) => {
  return getFixture('fixtures/master-data', 'target-dimensions-fixture.json');
};
