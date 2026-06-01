import type { Request } from 'express';

import { getFixture } from '../../utils';

type User = {
  id: string;
  fullname: string;
};

export const usersDispatcher = (req: Request) => {
  const users = getFixture('fixtures/trial-planning', 'users-fixture.json') as User[];
  return users;
};
