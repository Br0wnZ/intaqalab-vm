import { getFixture } from '../../../utils';

export interface EventLogUsersResponse {
  id: string;
  label: string;
}

export function eventLogUsersDispatcher(): EventLogUsersResponse[] {
  const item = getFixture<EventLogUsersResponse>('fixtures/event-log/users', 'users-fixture.json');
  const data: EventLogUsersResponse[] = new Array(7).fill(null).map((_, i) => {
    return {
      id: `${item.id}${i + 1}`,
      label: `${item.label} ${i + 1}`,
    };
  });

  return data;
}
