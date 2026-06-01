import type { AfterViewInit, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, effect, inject, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import type { MatCalendar, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CalendarEventsDataService } from '@intaqalab/data-access';
import type { CalendarParsedModel } from '@intaqalab/models';
import { IntaIconComponent, LegendTrialSchedulerComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, switchMap, takeUntil } from 'rxjs';

export interface SpecialDayActionToPerform {
  action: 'ADD' | 'REMOVE';
  date: Date;
  entity: 'HOLIDAY' | 'NO_NOTAM';
}
@Component({
  selector: 'lib-special-days-manager',
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
    LegendTrialSchedulerComponent,
    MatCardModule,
    MatDatepickerModule,
    IntaIconComponent,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="calendar" size="xxl" />
      {{ 'SPECIAL_DAYS_MANAGER.TITLE' | translate }}
    </h2>
    <mat-dialog-content>
      <div class="w-full max-w-md flex flex-col justify-center items-center mx-auto">
        <div class="inta-calendar inta-calendar--inline">
          <mat-card class="demo-inline-calendar-card">
            <mat-calendar
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
        @if (actionToPerform() === 'ADD') {
          <div class="w-100 min-w-full flex flex-col gap-2">
            <label for="entityToAdd">{{ 'SPECIAL_DAYS_MANAGER.DAY_TYPES' | translate }}</label>
            <mat-form-field appearance="outline">
              <mat-select id="entityToAdd" [(value)]="entityToAdd">
                <mat-option [value]="'NO_NOTAM'">{{ 'SPECIAL_DAYS_MANAGER.DAY_NO_NOTAM' | translate }}</mat-option>
                <mat-option [value]="'HOLIDAY'">{{ 'SPECIAL_DAYS_MANAGER.DAY_HOLIDAY' | translate }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="!flex !justify-center">
      @if (actionToPerform() === 'ADD') {
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="entityToAdd() === undefined"
          [mat-dialog-close]="actionsToPerform()"
        >
          {{ 'COMMONS.ACCEPT' | translate }}
        </button>
      }
      @if (actionToPerform() === 'REMOVE') {
        <button mat-flat-button color="primary" type="button" [mat-dialog-close]="actionsToPerform()">
          {{ 'SPECIAL_DAYS_MANAGER.BUTTON_ANNUL' | translate }}
        </button>
      }
      <button mat-stroked-button type="button" [mat-dialog-close]="false">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    :host {
      display: block;
    }
    .body {
      padding: 200px;
    }
    .demo-inline-calendar-card {
      width: 300px;
    }
  `,
})
export class SpecialDaysManagerComponent implements OnDestroy, AfterViewInit {
  @ViewChild('calendar') calendar!: MatCalendar<Date>;
  searchDatesToHighlightWriteable = signal<CalendarParsedModel>({
    holidays: [],
    no_notams: [],
    trials: [],
    observations: [],
  });
  actionToPerform = signal<'ADD' | 'REMOVE' | undefined>(undefined);
  selectedDates = signal<Date[]>([]);

  calendarEventsDataService = inject(CalendarEventsDataService);
  constructor() {
    this.calendarEventsDataService.getMonthEvents(new Date(), '').subscribe({
      next: (data) => this.searchDatesToHighlightWriteable.set(data),
    });

    effect(() => {
      const selectedDates = this.selectedDates();
      const action = this.actionToPerform();
      if (selectedDates.length === 1 && action === undefined) {
        const isSpecialDay = this.#isDateSpecial(selectedDates[0]);
        this.actionToPerform.set(isSpecialDay ? 'REMOVE' : 'ADD');
        this.calendar.updateTodaysDate();
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

  holidayDays = computed(() => this.searchDatesToHighlightWriteable().holidays.map((e) => new Date(e.date)));
  noNoTamDays = computed(() => this.searchDatesToHighlightWriteable().no_notams.map((e) => new Date(e.date)));
  busyDays = computed(() => this.searchDatesToHighlightWriteable().trials.map((e) => new Date(e.date)));

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    const cellValue = cellDate.toDateString();

    if (view === 'month') {
      const classes: string[] = [];
      const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      if (this.selectedDates().some((d) => d.toDateString() === cellValue)) {
        classes.push('selected-date');
      }

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
      return classes.join(' ');
    }
    return '';
  };

  onDateSelected(date: Date) {
    const selectedDates = this.selectedDates();
    const idx = selectedDates.findIndex((d) => d.toDateString() === date.toDateString());
    if (idx >= 0) {
      selectedDates.splice(idx, 1); // deseleccionar
    } else {
      selectedDates.push(date); // seleccionar
    }
    this.selectedDates.set([...selectedDates]);
    this.calendar.updateTodaysDate();
  }

  #isDateSpecial(date: Date) {
    return this.#isHoliday(date) || this.#isNoNotam(date);
  }

  #isHoliday(date: Date) {
    const dateStr = date.toDateString();
    const result = this.holidayDays().some((d) => d.toDateString() === dateStr);
    return result;
  }

  #isNoNotam(date: Date) {
    const dateStr = date.toDateString();
    const result = this.noNoTamDays().some((d) => d.toDateString() === dateStr);
    return result;
  }

  filterDates = (date: Date | null): boolean => {
    if (!date) return false;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      return false;
    }
    const action = this.actionToPerform();
    if (action === undefined) {
      return true;
    }

    const isSpecialDay = this.#isDateSpecial(date);
    if (action === 'ADD') {
      return !isSpecialDay;
    } else {
      return isSpecialDay;
    }
  };

  entityToAdd = model<SpecialDayActionToPerform['entity'] | undefined>(undefined);
  actionsToPerform = computed(() => {
    const result: SpecialDayActionToPerform[] = [];
    let entity: SpecialDayActionToPerform['entity'];
    const action = this.actionToPerform();
    if (action === undefined) {
      return result;
    }

    for (const date of this.selectedDates()) {
      if (action === 'REMOVE') {
        entity = this.#isHoliday(date) ? 'HOLIDAY' : 'NO_NOTAM';
      } else {
        entity = this.entityToAdd() || 'HOLIDAY';
      }
      result.push({ action, entity, date });
    }
    return result;
  });

  monthNavigation = new Subject<{
    direction: 'next' | 'prev';
    activeDate: Date;
  }>();
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

  ngAfterViewInit(): void {
    this.#performMonthlyNavigation();
    this.monthNavigation
      .asObservable()
      .pipe(
        switchMap(({ activeDate }) => {
          return this.calendarEventsDataService.getMonthEvents(activeDate, '');
        }),
      )
      .subscribe((values) => {
        this.searchDatesToHighlightWriteable.set(values);
      });
  }

  #destroy$ = new Subject<void>();
  ngOnDestroy(): void {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
