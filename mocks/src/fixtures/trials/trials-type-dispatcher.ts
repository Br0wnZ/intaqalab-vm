import type { Request } from 'express';

import { getFixture, getPagination, paginate } from '../../utils';
import type { PaginatedApiResponse } from '../../utils.model';

type FireTrialType = {
  id: string;
  label: string;
  active: boolean;
  name?: { es: string; en: string };
};

export function trialsTypeDispatch(req: Request): PaginatedApiResponse<FireTrialType> {
  const rawTrialTypes = getFixture('fixtures/trials', 'trials-type-fixture.json') as { id: string; name: string }[];
  const paginationParams = getPagination(req);

  // Adaptar al formato solicitado
  const trialTypes: FireTrialType[] = rawTrialTypes.map((t, idx) => ({
    id: t.id,
    label: t.name,
    active: true,
    name: { es: t.name, en: t.name },
  }));

  return paginate(trialTypes, paginationParams);
}
