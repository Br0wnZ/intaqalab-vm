import type { Request } from 'express';

import { getFixture } from '../../utils';

export const seriesAndShotsDispatcher = (req: Request) => {
  const seriesAndShots = getFixture('fixtures/trial-planning', 'series-and-shots-fixture.json');
  return seriesAndShots;
};
