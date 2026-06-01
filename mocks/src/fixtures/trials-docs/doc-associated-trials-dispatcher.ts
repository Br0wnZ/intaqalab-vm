import type { Request } from 'express';

import { getFixture } from '../../utils';

export function trialsDocAssociatedTrialsDispatch(req: Request) {
  const documentAssociatedTrials = getFixture('fixtures/trials-docs', 'doc-associated-trials-fixture.json');
  return documentAssociatedTrials;
}
