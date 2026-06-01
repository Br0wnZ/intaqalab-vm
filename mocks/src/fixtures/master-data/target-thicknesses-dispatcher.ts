import type { Request } from 'express';

import { getFixture } from '../../utils';

export const targetThicknessesDispatcher = (req: Request) => {
  return getFixture('fixtures/master-data', 'target-thicknesses-fixture.json');
};
