import type { Request } from 'express';

import { getFixture } from '../../utils';

export function trialsDocVersionsDispatch(req: Request) {
  const documents = getFixture('fixtures/trials-docs', 'documents-versions-fixture.json');
  return documents;
}
