import type { Request } from 'express';

import { getFixture } from '../../utils';

export const conditionsDispatcher = (req: Request) => {
  return getFixture('fixtures/trial-planning', 'shooting-conditions-fixture.json');
};
