import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { firstValueFrom } from 'rxjs';

import { CalendarObservationsDataService } from './calendar-observations-data.service';

describe('CalendarObservationsDataService', () => {
  let service: CalendarObservationsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()],
    });
    service = TestBed.inject(CalendarObservationsDataService);
  });

  it('should call to the api correctly', () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    const dateToTest = new Date(2025, 11, 4);

    const saveObservations = service.save(dateToTest, 'x');
    firstValueFrom(saveObservations);

    const req = httpTesting.expectOne((r) => r.url.includes('/calendar/days/2025-12-04/observations'));
    expect(req.request.method).toBe('POST');
    req.flush({});
    httpTesting.verify();
  });
});
