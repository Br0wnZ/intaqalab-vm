import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { LinesOfShot } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import {
  CalendarDatePipe,
  CalendarNextViewDirective,
  CalendarPreviousViewDirective,
  CalendarView,
} from 'angular-calendar';

@Component({
  selector: 'lib-calendar-trials-header',
  template: `
    <div class="calendar-trials-header">
      <div class="calendar-trials-header__controls">
        <div class="calendar-trials-header__period">
          <span class="calendar-trials-header__period-label">
            {{
              viewValue === CalendarView.Week
                ? getWeekRangeLabel()
                : viewValue === CalendarView.Day
                  ? getDayLabel()
                  : (viewDateValue | calendarDate: viewValue + 'ViewTitle' | titlecase) || ''
            }}
          </span>
          <div aria-label="Calendar navigation" class="calendar-trials-header__navigation">
            <button
              type="button"
              mwlCalendarPreviousView
              class="calendar-trials-header__nav-button"
              [view]="viewValue"
              [(viewDate)]="viewDateValue"
              (viewDateChange)="handleViewDateChange($event)"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>

            <button
              type="button"
              class="px-3 py-1.5 text-sm font-semibold rounded-lg border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
              (click)="goToToday()"
            >
              {{ 'CALENDAR_TRIALS.CONTROLS.TODAY' | translate }}
            </button>

            <button
              type="button"
              mwlCalendarNextView
              class="calendar-trials-header__nav-button"
              [view]="viewValue"
              [(viewDate)]="viewDateValue"
              (viewDateChange)="handleViewDateChange($event)"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>

        @if (linesOfShot().length > 0) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="calendar-trials-header__field">
            <mat-select
              [aria-label]="'CALENDAR_TRIALS.CONTROLS.LINE' | translate"
              [(value)]="selectedLineOfShot"
              (selectionChange)="lineChange.emit($event.value)"
            >
              @for (line of linesOfShot(); track line.id) {
                <mat-option [value]="line.id">{{ line.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <div
          role="tablist"
          class="calendar-trials-header__view-switch inta-tabs-3"
          [attr.aria-label]="'CALENDAR_TRIALS.CONTROLS.MONTH' | translate"
        >
          <button
            type="button"
            role="tab"
            class="inta-tabs-3__tab"
            [attr.aria-selected]="viewValue === CalendarView.Month"
            [class.inta-tabs-3__tab--active]="viewValue === CalendarView.Month"
            (click)="setView(CalendarView.Month)"
          >
            {{ 'CALENDAR_TRIALS.CONTROLS.MONTH' | translate }}
          </button>
          <button
            type="button"
            role="tab"
            class="inta-tabs-3__tab"
            [attr.aria-selected]="viewValue === CalendarView.Week"
            [class.inta-tabs-3__tab--active]="viewValue === CalendarView.Week"
            (click)="setView(CalendarView.Week)"
          >
            {{ 'CALENDAR_TRIALS.CONTROLS.WEEK' | translate }}
          </button>
          <button
            type="button"
            role="tab"
            class="inta-tabs-3__tab"
            [attr.aria-selected]="viewValue === CalendarView.Day"
            [class.inta-tabs-3__tab--active]="viewValue === CalendarView.Day"
            (click)="setView(CalendarView.Day)"
          >
            {{ 'CALENDAR_TRIALS.CONTROLS.DAY' | translate }}
          </button>
        </div>
      </div>

      <div class="calendar-trials-header__toggle">
        <mat-slide-toggle [(ngModel)]="showWeekendsValue">
          {{ 'CALENDAR_TRIALS.CONTROLS.SHOW_WEEKENDS' | translate }}
        </mat-slide-toggle>
      </div>
    </div>
  `,
  imports: [
    TitleCasePipe,
    TranslateModule,
    CalendarPreviousViewDirective,
    CalendarNextViewDirective,
    CalendarDatePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatSlideToggleModule,
  ],
  styleUrl: './calendar-trials-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTrialsHeaderComponent {
  view = input<CalendarView>(CalendarView.Month);
  viewValue!: CalendarView;

  showWeekendsValue = model<boolean>(false);

  viewDate = input<Date>(new Date());
  viewDateValue!: Date;

  linesOfShot = input<LinesOfShot[]>([]);

  viewChange = output<CalendarView>();

  viewDateChange = output<Date>();
  lineChange = output<LinesOfShot['id']>();

  showWeekends = output<boolean>();

  CalendarView = CalendarView;
  selectedLineOfShot: string | null = null;

  setView(value: CalendarView) {
    this.viewValue = value;
    this.viewChange.emit(value);
  }

  getWeekRangeLabel() {
    const start = this.#getStartOfWeek(this.viewDateValue);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${this.#formatDayMonth(start)} - ${this.#formatDayMonth(end)}`;
  }

  getDayLabel() {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(this.viewDateValue);
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const year = parts.find((part) => part.type === 'year')?.value ?? '';

    return `${day} ${month}, ${year}`;
  }

  handleViewDateChange(date: Date) {
    this.viewDateValue = date;
    this.viewDateChange.emit(date);
  }

  goToToday() {
    this.handleViewDateChange(new Date());
  }

  #formatDayMonth(date: Date) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  #getStartOfWeek(date: Date) {
    const value = new Date(date);
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diff);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  constructor() {
    effect(() => {
      if (this.view()) {
        this.viewValue = this.view();
      }
    });

    effect(() => {
      if (this.viewDate()) {
        this.viewDateValue = this.viewDate();
      }
    });

    effect(() => {
      if (this.linesOfShot().length) {
        this.selectedLineOfShot = this.linesOfShot()[0].id;
      }
    });

    effect(() => {
      const value = this.showWeekendsValue();
      if (value !== undefined) {
        this.showWeekends.emit(value);
      }
    });
  }
}
