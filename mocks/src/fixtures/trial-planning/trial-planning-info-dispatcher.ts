import type { Request } from 'express';

import { getFixture } from '../../utils';
import { getAcceptedChanges, resolveRevision } from './planning-revision';
import { projectPlanningInfo } from './planning-revision-projectors';

export const trialPlanningInfoDispatcher = (req: Request) => {
  const trialPlanningInfo = getFixture<Record<string, unknown>>(
    'fixtures/trial-planning',
    'trial-planning-info-fixture.json',
  );
  if (resolveRevision(req) === 'baseline') return trialPlanningInfo;
  return projectPlanningInfo(trialPlanningInfo, getAcceptedChanges(req.params['fireTrialId'], 'PLANNING_INFO'));
};
