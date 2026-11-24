import type { Request } from 'express';

import { getFixture } from '../../utils';
import { getAcceptedChanges, resolveRevision } from './planning-revision';
import { projectConditions } from './planning-revision-projectors';

interface ConditionsFixture {
  series?: Array<{ shots?: Array<Record<string, unknown> & { shotId?: string; globalNumber?: number }> }>;
}

/**
 * `baseline` (por defecto): planning base sin cambios.
 * `execution`: planning base + cambios aceptados desde ejecución (fixture con cambios ya
 * consolidados + proyección de los `ACCEPTED` del store de cambios).
 */
export const conditionsDispatcher = (req: Request) => {
  if (resolveRevision(req) === 'baseline') {
    return getFixture('fixtures/trial-planning', 'shooting-conditions-baseline-fixture.json');
  }
  const executionFixture = getFixture<ConditionsFixture>('fixtures/trial-planning', 'shooting-conditions-fixture.json');
  return projectConditions(executionFixture, getAcceptedChanges(req.params['fireTrialId'], 'SHOT_CONDITIONS'));
};
