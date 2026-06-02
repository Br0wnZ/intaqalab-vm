import { getFixture } from '../../utils';
import type { DictionaryResponses } from '../../utils.model';

type CalendarTrialScheduleApiResponse = {
  date: string;
  lineOfShootId: string;
}[];

const scheduleOverrides = new Map<string, CalendarTrialScheduleApiResponse>();

export function setTrialSchedule(id: string, schedule: CalendarTrialScheduleApiResponse) {
  scheduleOverrides.set(id, schedule);
}

export function trialScheduleDispatchById(id: string) {
  if (scheduleOverrides.has(id)) {
    return scheduleOverrides.get(id)!;
  }

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
