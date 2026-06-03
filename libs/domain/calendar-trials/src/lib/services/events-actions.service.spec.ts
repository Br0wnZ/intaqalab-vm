import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { CalendarTrialScheduleService } from '@intaqalab/data-access';
import type { CalendarTrialScheduleApiResponse, LinesOfShotViewState } from '@intaqalab/models';
import { TrialScheduleService } from '@intaqalab/trial-management';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { EventsActionsService } from './events-actions.service';

class FakeTranslateLoader {
  getTranslation() {
    return of({ HELLO: 'Hola' });
  }
}

function setUp(data: CalendarTrialScheduleApiResponse) {
  const mockCalendarApiService = mockCalendarTrialScheduleService(data);
  const mockTrialScheduleService = {
    selectLinesAndDatesToSchedule: vi.fn().mockReturnValue(Promise.resolve(true)),
  };
  TestBed.configureTestingModule({
    imports: [
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: FakeTranslateLoader },
      }),
    ],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: CalendarTrialScheduleService, useValue: mockCalendarApiService },
      {
        provide: TrialScheduleService,
        useValue: mockTrialScheduleService,
      },
    ],
  });
  const service = TestBed.inject(EventsActionsService);
  return { service, mockCalendarApiService, mockTrialScheduleService };
}
describe('EventsActionsService', () => {
  it('should schedule to call to  CalendarApiService.selectLinesAndDatesToSchedule', async () => {
    const schedules: CalendarTrialScheduleApiResponse = [
      { date: '2026-03-19', lineOfShootId: 'id1' },
      { date: '2026-03-20', lineOfShootId: 'id1' },
    ];
    const { mockTrialScheduleService, service } = setUp(schedules);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trialToSchedule: any = {
      date: '2026-03-19',
      fireTrial: { id: 'id', trialNumber: '1' },
      lineOfShootId: 'id1',
    };
    vi.spyOn(service.selectTrialModalService, 'select').mockReturnValue(Promise.resolve(trialToSchedule));
    const linesOfShotState: LinesOfShotViewState = {
      current: '1',
      list: [{ id: '1', label: 'label 1' }],
    };
    await service.schedule(linesOfShotState, new Date());
    expect(mockTrialScheduleService.selectLinesAndDatesToSchedule).toHaveBeenCalled();
  });

  it('should unprogram to call to unprogram with the proper arguments', async () => {
    const schedules: CalendarTrialScheduleApiResponse = [
      { date: '2026-03-19', lineOfShootId: 'id1' },
      { date: '2026-03-20', lineOfShootId: 'id1' },
    ];
    const { mockCalendarApiService, service } = setUp(schedules);
    vi.spyOn(service.dialogService, 'confirm').mockReturnValue(Promise.resolve(true));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trialToUnprogram: any = {
      date: '2026-03-19',
      fireTrial: { id: 'id', trialNumber: '1' },
      lineOfShootId: 'id1',
    };
    await service.unprogramTrial(trialToUnprogram);
    expect(mockCalendarApiService.update).toHaveBeenCalledWith(trialToUnprogram.fireTrial.id, [
      {
        date: '2026-03-20',
        lineOfShootId: 'id1',
      },
    ]);
  });
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockCalendarTrialScheduleService(data: any) {
  return {
    getSchedule: vi.fn().mockReturnValue(Promise.resolve(data)),
    update: vi.fn().mockReturnValue(of(true)),
  };
}
