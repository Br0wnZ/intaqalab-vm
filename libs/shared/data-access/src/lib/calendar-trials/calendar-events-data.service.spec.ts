import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { firstValueFrom } from 'rxjs';

import { CalendarEventsDataService } from './calendar-events-data.service';

describe('CalendarEventsDataService', () => {
  let service: CalendarEventsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });

    service = TestBed.inject(CalendarEventsDataService);
  });

  it('should getWeekEvents to call for the week', async () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    const dateToTest = new Date(2025, 11, 4);
    const weeksEvents = service.getWeekEvents(dateToTest, '1');
    const weekEventsPromise = firstValueFrom(weeksEvents);

    const req = httpTesting.expectOne(
      `http://localhost:3000/api/calendar/events?startDate=2025-12-01&endDate=2025-12-07&lineOfShootId=1`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(getResponse());
    expect(await weekEventsPromise).toEqual({
      holidays: [
        {
          id: 'holiday-1',
          description: 'Día del pilar',
          date: new Date('2025-10-12'),
          eventType: 'HOLIDAY',
        },
      ],
      no_notams: [
        {
          id: 'no-notam-1',
          date: new Date('2025-10-05'),
          eventType: 'NO_NOTAM',
        },
      ],
      observations: [],
      trials: [],
    });
    httpTesting.verify();
  });
});

function getResponse() {
  return [
    {
      id: 'holiday-1',
      description: 'Día del pilar',
      date: '2025-10-12',
      eventType: 'HOLIDAY',
    },

    {
      id: 'no-notam-1',
      date: '2025-10-05',
      eventType: 'NO_NOTAM',
    },
    // {
    //   date: '2025-10-10',
    //   eventType: 'FIRE_TRIAL',
    //   description: 'Fire Trial Number 0001/26',
    //   lineOfShootId: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //   fireTrial: {
    //     id: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //     trialNumber: '0001/25',
    //     description: 'Fire Trial Description',
    //     clientId: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //   },
    // },
    // {
    //   date: '2025-10-22',
    //   eventType: 'FIRE_TRIAL',
    //   description: 'Fire Trial Number 0001/26',
    //   lineOfShootId: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //   fireTrial: {
    //     id: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //     trialNumber: '0001/25',
    //     description: 'Fire Trial Description',
    //     clientId: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
    //   },
    // },
  ];
}
