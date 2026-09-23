import { TestBed } from '@angular/core/testing';
import { CalendarEventsDataService, LinesOfShotDataService } from '@intaqalab/data-access';
import type { CalendarParsedModel, CalendarTrialApiResponse, LinesOfShot } from '@intaqalab/models';
import { CalendarView } from 'angular-calendar';
import { Subject, of } from 'rxjs';

import { CalendarTrialStore } from './calendar-trials.store';

const mockLinesOfShot: LinesOfShot[] = [
  { id: 'line-1', name: 'Línea 1', active: true, order: 1 } as LinesOfShot,
  { id: 'line-2', name: 'Línea 2', active: true, order: 2 } as LinesOfShot,
];

function createParsedModel(title: string): CalendarParsedModel {
  return {
    holidays: [],
    no_notams: [],
    observations: [],
    trials: [
      {
        id: 1,
        date: '2026-06-15T10:00:00.000Z',
        description: title,
        fireTrial: { id: 100, code: 'FT-100' },
      } as unknown as CalendarTrialApiResponse,
    ],
  };
}

describe('CalendarTrialStore', () => {
  let store: InstanceType<typeof CalendarTrialStore>;
  let linesOfShotServiceMock: { list: ReturnType<typeof vi.fn> };
  let calendarEventsServiceMock: {
    getMonthEvents: ReturnType<typeof vi.fn>;
    getWeekEvents: ReturnType<typeof vi.fn>;
    getDayEvents: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    linesOfShotServiceMock = {
      list: vi.fn().mockReturnValue(of(mockLinesOfShot)),
    };

    calendarEventsServiceMock = {
      getMonthEvents: vi.fn().mockReturnValue(of(createParsedModel('Default Month Trial'))),
      getWeekEvents: vi.fn().mockReturnValue(of(createParsedModel('Default Week Trial'))),
      getDayEvents: vi.fn().mockReturnValue(of(createParsedModel('Default Day Trial'))),
    };

    TestBed.configureTestingModule({
      providers: [
        CalendarTrialStore,
        { provide: LinesOfShotDataService, useValue: linesOfShotServiceMock },
        { provide: CalendarEventsDataService, useValue: calendarEventsServiceMock },
      ],
    });

    store = TestBed.inject(CalendarTrialStore);
  });

  it('should initialize lines and load events on onInit hook', async () => {
    await Promise.resolve();

    expect(linesOfShotServiceMock.list).toHaveBeenCalledWith(true);
    expect(store.linesOfShot()).toEqual(mockLinesOfShot);
    expect(store.linesOfShotSelected()).toBe('line-1');
    expect(store.trials()).toHaveLength(1);
    expect(store.trials()?.[0]?.description).toBe('Default Month Trial');
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should prevent race conditions when earlier requests resolve AFTER newer requests', async () => {
    await Promise.resolve();

    const subject1 = new Subject<CalendarParsedModel>();
    const subject2 = new Subject<CalendarParsedModel>();

    calendarEventsServiceMock.getMonthEvents
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    // Trigger request 1 (slow)
    store.changeLine('line-1');
    expect(store.loading()).toBe(true);

    // Trigger request 2 (fast)
    store.changeLine('line-2');
    expect(store.loading()).toBe(true);

    // Request 2 completes first
    subject2.next(createParsedModel('Fast Line 2 Trial'));
    subject2.complete();
    await Promise.resolve();

    expect(store.trials()?.[0]?.description).toBe('Fast Line 2 Trial');
    expect(store.loading()).toBe(false);

    // Request 1 completes later (stale response)
    subject1.next(createParsedModel('Slow Stale Line 1 Trial'));
    subject1.complete();
    await Promise.resolve();

    // The stale response must NOT overwrite line 2 data
    expect(store.trials()?.[0]?.description).toBe('Fast Line 2 Trial');
    expect(store.linesOfShotSelected()).toBe('line-2');
    expect(store.loading()).toBe(false);
  });

  it('should discard error from a stale request if a newer request already succeeded', async () => {
    await Promise.resolve();

    const subject1 = new Subject<CalendarParsedModel>();
    const subject2 = new Subject<CalendarParsedModel>();

    calendarEventsServiceMock.getMonthEvents
      .mockReturnValueOnce(subject1.asObservable())
      .mockReturnValueOnce(subject2.asObservable());

    // Trigger request 1 (which will eventually fail)
    store.changeLine('line-1');

    // Trigger request 2 (which succeeds quickly)
    store.changeLine('line-2');

    subject2.next(createParsedModel('Success Line 2'));
    subject2.complete();
    await Promise.resolve();

    expect(store.trials()?.[0]?.description).toBe('Success Line 2');
    expect(store.error()).toBeNull();

    // Request 1 fails now
    subject1.error(new Error('Stale connection error'));
    await Promise.resolve();

    // Stale error must NOT overwrite the success state
    expect(store.error()).toBeNull();
    expect(store.trials()?.[0]?.description).toBe('Success Line 2');
    expect(store.loading()).toBe(false);
  });

  it('should set error state when the active request fails', async () => {
    await Promise.resolve();

    const subject = new Subject<CalendarParsedModel>();
    calendarEventsServiceMock.getMonthEvents.mockReturnValueOnce(subject.asObservable());

    store.changeLine('line-error');
    expect(store.loading()).toBe(true);

    subject.error(new Error('Server error 500'));
    await Promise.resolve();

    expect(store.error()).toBe('Error al cargar los trials');
    expect(store.loading()).toBe(false);
  });

  it('should switch between views and call the corresponding service methods', async () => {
    await Promise.resolve();

    store.setView(CalendarView.Week);
    await Promise.resolve();
    expect(calendarEventsServiceMock.getWeekEvents).toHaveBeenCalled();

    store.setView(CalendarView.Day);
    await Promise.resolve();
    expect(calendarEventsServiceMock.getDayEvents).toHaveBeenCalled();

    store.setView(CalendarView.Month);
    await Promise.resolve();
    expect(calendarEventsServiceMock.getMonthEvents).toHaveBeenCalled();
  });

  it('should reload data when setViewDate is called', async () => {
    await Promise.resolve();

    const newDate = new Date('2026-11-20T00:00:00Z');
    store.setViewDate(newDate);
    await Promise.resolve();

    expect(calendarEventsServiceMock.getMonthEvents).toHaveBeenCalledWith(newDate, 'line-1');
  });

  it('should toggle showWeekends state', () => {
    expect(store.showWeekends()).toBe(false);
    store.setShowWeekends(true);
    expect(store.showWeekends()).toBe(true);
  });
});
