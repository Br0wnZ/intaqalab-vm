import type { Request } from 'express';

import { getFixture } from '../../utils';

type Specimen = {
  id: string;
  name: string;
  type: string;
  active: boolean;
};

export const specimensCreateDispatcher = (req: Request): Specimen => {
  const specimen = getFixture('fixtures/trial-planning', 'specimens-create-fixture.json') as Specimen;
  const body = req.body as Partial<Specimen>;

  return {
    ...specimen,
    ...body,
  };
};
