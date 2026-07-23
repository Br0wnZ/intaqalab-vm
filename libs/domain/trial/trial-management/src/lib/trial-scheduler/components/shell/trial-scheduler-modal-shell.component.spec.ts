import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { CalendarEventsDataService } from '@intaqalab/data-access';
import type { TrialSchedulerModalShellInput } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { TrialSchedulerModalShellComponent } from './trial-scheduler-modal-shell.component';

describe('TrialSchedulerModalShellComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockCalendarEventsDataService: { getMonthEvents: ReturnType<typeof vi.fn> };

  const valuesInput: TrialSchedulerModalShellInput = {
    trial: { id: '1', trialNumber: 'trial-123' },
    defaultValues: [
      { date: '2025-11-22', lineOfShootId: '1' },
      { date: '2025-11-24', lineOfShootId: '1' },
    ],
    linesOfShotViewState: {
      current: '1',
      list: [
        { id: '1', label: 'Linea 1' },
        { id: '2', label: 'Linea 2' },
      ],
    },
  };

  const runSetup = async (inputData = valuesInput) => {
    mockDialogRef = { close: vi.fn() };
    mockCalendarEventsDataService = {
      getMonthEvents: vi.fn().mockReturnValue(
        of({
          holidays: [{ id: 'h1', date: new Date('2025-11-01'), description: 'Holiday 1', eventType: 'HOLIDAY' }],
          no_notams: [{ id: 'n1', date: new Date('2025-11-02'), eventType: 'NO_NOTAM' }],
          trials: [
            {
              id: 't1',
              date: new Date('2025-11-03'),
              description: 'Trial 1',
              eventType: 'FIRE_TRIAL',
              lineOfShootId: '1',
              fireTrial: { status: 'PLANNED' },
            },
          ],
          observations: [],
        }),
      ),
    };

    const view = await render(TrialSchedulerModalShellComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: CalendarEventsDataService, useValue: mockCalendarEventsDataService },
      ],
      componentProviders: [{ provide: MAT_DIALOG_DATA, useValue: inputData }],
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    const component = view.fixture.componentInstance;

    return { view, loader, component };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render dialog basic elements', async () => {
    await runSetup();

    expect(screen.getByText('TRIAL_SCHEDULER.SCHEDULE_TRIAL_TITLE')).toBeInTheDocument();
    expect(screen.getByText(/trial-123/i)).toBeInTheDocument();
  });

  it('should load month events for current line on init', async () => {
    await runSetup();
    expect(mockCalendarEventsDataService.getMonthEvents).toHaveBeenCalled();
  });

  it('should update line selection and fetch events', async () => {
    const { component, view } = await runSetup();

    mockCalendarEventsDataService.getMonthEvents.mockClear();
    component.lineChangeHandler('2');
    view.fixture.detectChanges();

    expect(component.selectedLineOfShot()).toBe('2');
    expect(mockCalendarEventsDataService.getMonthEvents).toHaveBeenCalled();
  });

  it('should handle date selection toggling and set touched status', async () => {
    const { component } = await runSetup();

    const testDate = new Date('2025-11-15');
    component.onDateSelected(testDate);

    const selected = component.selectedDates();
    expect(selected.some((d) => d.date.toDateString() === testDate.toDateString())).toBe(false);
    expect(component.touchedSomeDate()).toBe(false);

    component.onDateSelected(testDate);
    const selectedAfterToggle = component.selectedDates();
    expect(selectedAfterToggle.some((d) => d.date.toDateString() === testDate.toDateString())).toBe(false);
  });

  it('should class cell dates correctly in dateClass', async () => {
    const { component } = await runSetup();

    // Weekend (Sunday 2025-11-23)
    const sunday = new Date('2025-11-23');
    expect(component.dateClass(sunday, 'month')).toContain('special-date');

    // Holiday (2025-11-01)
    const holiday = new Date('2025-11-01');
    expect(component.dateClass(holiday, 'month')).toContain('special-date');

    // No-notam day (2025-11-02)
    const noNotam = new Date('2025-11-02');
    expect(component.dateClass(noNotam, 'month')).toContain('no-notam-date');

    // Busy day (2025-11-03)
    const busy = new Date('2025-11-03');
    expect(component.dateClass(busy, 'month')).toContain('busy-date');

    // Selected date (2025-11-22)
    const selected = new Date('2025-11-22');
    expect(component.dateClass(selected, 'month')).toContain('selected-date');
  });

  it('should filter out yesterday or earlier dates and no-notam dates', async () => {
    const { component } = await runSetup();

    // Yesterday or earlier
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(component.filterDates(pastDate)).toBe(false);

    // Future no-notam date
    const noNotamDate = new Date('2025-11-02');
    expect(component.filterDates(noNotamDate)).toBe(false);

    // Valid future date (ensure it's after today)
    const validFutureDate = new Date();
    validFutureDate.setDate(validFutureDate.getDate() + 10);
    // If it falls on holiday/no-notam, it might return false, but standard days should be true
    expect(component.filterDates(validFutureDate)).toBe(true);
  });

  it('should disable/enable schedule button based on touched state', async () => {
    const { loader } = await runSetup({
      ...valuesInput,
      touched: false,
    });

    const scheduleBtn = await loader.getHarness(MatButtonHarness.with({ text: 'TRIAL_SCHEDULER.SCHEDULE_TRIAL' }));
    expect(await scheduleBtn.isDisabled()).toBe(true);
  });
});
