import type { AfterViewInit, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CalendarEventsDataService } from '@intaqalab/data-access';
import type {
  CalendarParsedModel,
  CalendarTrialSchedule,
  LinesOfShot,
  LinesOfShotViewState,
  TrialSchedulerModalShellInput,
} from '@intaqalab/models';
import { IntaIconComponent, LegendTrialSchedulerComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { format } from 'date-fns';
import { Subject, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'inta-trial-scheduler-modal-shell',
  imports: [
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDatepickerModule,
    LegendTrialSchedulerComponent,
    IntaIconComponent,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="calendar" size="xxl" />
      <span>{{ 'TRIAL_SCHEDULER.SCHEDULE_TRIAL_TITLE' | translate }}</span>
    </h2>

    <mat-dialog-content class="!flex !flex-col justify-center items-center">
      <div class="w-full max-w-md flex flex-col justify-center items-center">
        <div class="my-4 text-center">
          <h3 class="text-lg font-normal">{{ 'TRIAL_SCHEDULER.SELECT_DAYS' | translate }}</h3>
          <p class="text-md font-bold">Número de prueba {{ data.trial.trialNumber }}</p>
        </div>
        <mat-form-field appearance="outline" class="self-end">
          <mat-select [(value)]="selectedLineOfShot" (selectionChange)="lineChangeHandler($event.value)">
            @for (line of linesOfShotViewState.list; track line) {
              <mat-option [value]="line.id">{{ line.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="inta-calendar inta-calendar--inline">
          <mat-card class="demo-inline-calendar-card">
            <mat-calendar
              class="calendar-modal"
              [dateClass]="dateClass"
              [dateFilter]="filterDates"
              (selectedChange)="onDateSelected($event!)"
              #calendar
            ></mat-calendar>
          </mat-card>
          <div class="mt-4">
            <ui-legend-trial-scheduler></ui-legend-trial-scheduler>
          </div>
        </div>
        <div class="selected-dates hidden">
          <h3>Datos:</h3>
          <ul>
            @for (msg of selectedDatesFriendly(); track msg) {
              <li>{{ msg }}</li>
            }
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="!justify-center">
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="!touchedSomeDate()"
        [mat-dialog-close]="selectedDates()"
      >
        {{ 'TRIAL_SCHEDULER.SCHEDULE_TRIAL' | translate }}
      </button>
      <button mat-stroked-button color="primary" type="button" [mat-dialog-close]="false">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './trial-scheduler-modal-shell.component.css',
})
export class TrialSchedulerModalShellComponent implements AfterViewInit, OnDestroy {
  readonly #destroy$ = new Subject<void>();
  monthNavigation = new Subject<{
    direction: 'next' | 'prev';
    activeDate: Date;
  }>();
  readonly data = inject<TrialSchedulerModalShellInput>(MAT_DIALOG_DATA);
  @ViewChild('calendar') calendar!: MatCalendar<Date>;

  touchedSomeDate = signal(!!this.data.touched);

  linesOfShotViewState: LinesOfShotViewState = this.data.linesOfShotViewState;
  defaultValues = this.data.defaultValues;
  selectedDates = signal<CalendarTrialSchedule[]>(
    this.data.defaultValues.map((e) => {
      return { date: new Date(e.date), lineOfShootId: e.lineOfShootId };
    }),
  );
  selectedDatesFriendly = computed(() => {
    const selectedDates = this.selectedDates();
    const value = selectedDates.map((e) => ({
      ...e,
      formattedDate: format(e.date, 'dd-MM-yyyy'),
    }));
    const value2 = groupByAndPick(value, 'lineOfShootId', ['formattedDate']);
    const value3: Array<string> = [];
    for (const [key, value] of Object.entries(value2)) {
      let keyTranslated = key;
      const keyTranslatedRecord = this.linesOfShotViewState.list.find((e: LinesOfShot) => e.id === key);
      if (keyTranslatedRecord) {
        keyTranslated = keyTranslatedRecord.label;
      }
      value3.push(`${keyTranslated}: ${value.map((e) => e.formattedDate).join(', ')}`);
    }
    return value3;
  });

  selectedLineOfShot = signal<string>(this.data.linesOfShotViewState.current);

  lineChangeHandler(line: string) {
    this.selectedLineOfShot.set(line);
  }

  searchDatesToHighlightWriteable = signal<CalendarParsedModel>({
    holidays: [],
    no_notams: [],
    trials: [],
    observations: [],
  });

  ngAfterViewInit(): void {
    this.#performMonthlyNavigation();
    this.monthNavigation
      .asObservable()
      .pipe(
        switchMap(({ activeDate }) => {
          return this.calendarEventsDataService.getMonthEvents(activeDate, this.selectedLineOfShot());
        }),
      )
      .subscribe((values) => {
        this.searchDatesToHighlightWriteable.set(values);
      });
  }

  constructor() {
    const current = this.data.linesOfShotViewState.current || '';
    this.selectedLineOfShot.set(current);

    effect(() => {
      const datesToHighlight = this.datesToHightligth();
      if (datesToHighlight !== undefined) {
        if (datesToHighlight !== null) {
          this.searchDatesToHighlightWriteable.set(datesToHighlight);
        }
      }
    });
    effect(() => {
      const value = this.searchDatesToHighlightWriteable();
      if (value) {
        if (this.calendar) {
          this.calendar.updateTodaysDate();
        }
      }
    });
  }

  calendarEventsDataService = inject(CalendarEventsDataService);
  readonly #searchDatesToHighlight$ = toObservable(this.selectedLineOfShot).pipe(
    distinctUntilChanged(),
    switchMap((lineSelected) => {
      let date: Date;
      if (this.calendar) {
        date = this.calendar.activeDate;
      } else {
        date = new Date();
      }
      if (lineSelected === undefined) {
        return of(null);
      } else {
        return this.calendarEventsDataService.getMonthEvents(date, lineSelected);
      }
    }),
  );
  datesToHightligth = toSignal(this.#searchDatesToHighlight$);

  holidayDays = computed(() => this.searchDatesToHighlightWriteable().holidays.map((e) => new Date(e.date)));
  noNoTamDays = computed(() => this.searchDatesToHighlightWriteable().no_notams.map((e) => new Date(e.date)));
  busyDays = computed(() => this.searchDatesToHighlightWriteable().trials.map((e) => new Date(e.date)));

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    const cellValue = cellDate.toDateString();
    if (view === 'month') {
      const classes: string[] = [];
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

      const holidays = this.holidayDays();
      if (isWeekend || holidays.some((d) => d.toDateString() === cellValue)) {
        classes.push('special-date');
      }

      const noNoTamsDays = this.noNoTamDays();
      if (noNoTamsDays.some((d) => d.toDateString() === cellValue)) {
        classes.push('no-notam-date');
      }
      const busyDays = this.busyDays() || [];
      if (busyDays.some((d) => d.toDateString() === cellValue)) {
        classes.push('busy-date');
      }
      const selectedDates = this.selectedDates();
      if (
        selectedDates.some(({ date, lineOfShootId }) => {
          return date.toDateString() === cellValue && lineOfShootId === this.selectedLineOfShot();
        })
      ) {
        classes.push('selected-date');
      }

      return classes.join(' ');
    }
    return '';
  };

  selectedDatesView = computed(() => {
    const currentLine = this.selectedLineOfShot();
    const records = this.selectedDates().filter((e) => (e.lineOfShootId = currentLine));
    return records.map((e) => new Date(e.date));
  });

  onDateSelected(date: Date) {
    this.touchedSomeDate.set(true);
    const values = this.selectedDates();
    const idx = values.findIndex(
      (d) => d.date.toDateString() === date.toDateString() && d.lineOfShootId === this.selectedLineOfShot(),
    );
    if (idx >= 0) {
      values.splice(idx, 1);
    } else {
      values.push({ date, lineOfShootId: this.selectedLineOfShot() });
    }
    console.log('selecting values...', values);
    this.selectedDates.set([...values]);
    this.calendar.updateTodaysDate();
  }

  disabledDates = computed(() => {
    return [...this.noNoTamDays()];
  });

  filterDates = (date: Date | null): boolean => {
    if (!date) return false;

    if (isYesterdayOrEarlier(date)) {
      return false;
    }

    // const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    // if (isWeekend) {
    //   return false;
    // }
    const time = date.setHours(0, 0, 0, 0);
    const disabledDates = this.disabledDates();
    const isDisabledDate = disabledDates.some((d) => d.setHours(0, 0, 0, 0) === time);
    return !isDisabledDate;
  };

  prevActiveDate = new Date();
  #performMonthlyNavigation() {
    this.prevActiveDate = new Date(this.calendar.activeDate || new Date());
    this.calendar.stateChanges.pipe(takeUntil(this.#destroy$)).subscribe(() => {
      const newDate = this.calendar.activeDate;
      if (!newDate) return;

      const prevIndex = this.prevActiveDate.getFullYear() * 12 + this.prevActiveDate.getMonth();
      const newIndex = newDate.getFullYear() * 12 + newDate.getMonth();

      if (newIndex !== prevIndex) {
        const direction: 'next' | 'prev' = newIndex > prevIndex ? 'next' : 'prev';
        this.monthNavigation.next({ direction, activeDate: new Date(newDate) });
      }

      this.prevActiveDate = new Date(newDate);
    });
  }

  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}

function groupByAndPick<T, K extends keyof T, F extends keyof T>(
  items: T[],
  groupKey: K,
  fields: F[],
): Record<string, Pick<T, F>[]> {
  return items.reduce(
    (acc, item) => {
      const key = String(item[groupKey]);

      const reduced = fields.reduce(
        (obj, f) => {
          obj[f] = item[f];
          return obj;
        },
        {} as Pick<T, F>,
      );

      if (!acc[key]) acc[key] = [];
      acc[key].push(reduced);

      return acc;
    },
    {} as Record<string, Pick<T, F>[]>,
  );
}

function isYesterdayOrEarlier(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  return dateToCheck <= yesterday;
}
