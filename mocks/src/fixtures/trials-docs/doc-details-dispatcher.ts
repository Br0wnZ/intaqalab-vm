import type { Request } from 'express';

import { getFixture } from '../../utils';

export function trialsDocDetailsDispatch(req: Request) {
  const documentDetail = getFixture('fixtures/trials-docs', 'doc-details-fixture.json');
  return documentDetail;
}
