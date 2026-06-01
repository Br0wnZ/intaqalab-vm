import { getFixture } from '../../utils';
import type { DictionaryResponses } from '../../utils.model';

type CalendarTrialScheduleApiResponse = {
  date: string;
  lineOfShootId: string;
}[];

export function trialScheduleDispatchById(id: string) {
  const data = getFixture<DictionaryResponses<CalendarTrialScheduleApiResponse>>(
    'fixtures/trial-schedule',
    'trial-schedule-fixture.json',
  );

  const index = data.findIndex((e) => e.id === id);
  const noResponse: CalendarTrialScheduleApiResponse = [];
  if (index > -1) {
    return data[index].response;
  } else {
    return noResponse;
  }
}
