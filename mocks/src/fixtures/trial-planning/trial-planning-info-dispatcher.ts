import type { Request } from 'express';

import { getFixture } from '../../utils';

export const trialPlanningInfoDispatcher = (req: Request) => {
  const trialPlanningInfo = getFixture('fixtures/trial-planning', 'trial-planning-info-fixture.json');
  return trialPlanningInfo;
};
