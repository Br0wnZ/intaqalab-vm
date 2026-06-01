import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { CalendarTrialScheduleService } from './calendar-trial-schedule.service';

describe('CalendarTrialScheduleService', () => {
  let service: CalendarTrialScheduleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(CalendarTrialScheduleService);
  });

  it('should getScheduleGroupedByLinesId group the response for the view', async () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    const fireTrialId = '1';
    const promise = service.getSchedule(fireTrialId);
    const req = httpTesting.expectOne((r) => r.url.includes(`/fire-trials/${fireTrialId}/schedule`));
    expect(req.request.method).toBe('GET');
    req.flush(getResponse());

    expect(await promise).toEqual(getResponse());
  });
});

function getResponse() {
  return [
    { date: '2025-11-22', lineOfShootId: '1' },
    { date: '2025-11-24', lineOfShootId: '1' },
    { date: '2025-11-22', lineOfShootId: '2' },
  ];
}
