import type { Request } from 'express';

import { getFixture } from '../../utils';

type CalendarEventsApiResponse =
  | CalendarTrialApiResponse
  | CalendarNoNoTamApiResponse
  | CalendarHolidayApiResponse
  | CalendarObservationApiResponse;
interface CalendarTrialApiResponse {
  date: string;
  eventType: 'FIRE_TRIAL';
  description: string;
  lineOfShootId: string;
  fireTrial: {
    id: string;
    trialNumber: string;
    description: string;
    client: {
      id: string;
      name: string;
    };
  };
}

interface CalendarNoNoTamApiResponse {
  date: string;
  eventType: 'NO_NOTAM';
}
interface CalendarHolidayApiResponse {
  date: string;
  eventType: 'HOLIDAY';
  description: string;
}

interface CalendarObservationApiResponse {
  date: string;
  eventType: 'OBSERVATION';
  description: string;
}

export function calendarEventsDispatch(req: Request) {
  let data = getFixture<CalendarEventsApiResponse[]>('fixtures/calendar-events', 'calendar-events-fixture.json');
  const startDate = req.query['startDate'];
  const endDate = req.query['endDate'];

  if (startDate && endDate) {
    const startDateValue = new Date(startDate as string);
    const endDateValue = new Date(endDate as string);
    data = data.filter((e) => {
      const valueDate = new Date(e.date);
      return valueDate >= startDateValue && valueDate <= endDateValue;
    });
  }

  const eventTypes = req.query['eventType'];
  console.log('eventTypes is', eventTypes);
  if (Array.isArray(eventTypes)) {
    data = data.filter((e) => {
      return eventTypes.includes(e.eventType);
    });
  } else if (eventTypes?.length) {
    data = data.filter((e) => {
      return [eventTypes].includes(e.eventType);
    });
  }

  return data;
}
