import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { CalendarEventViewModel } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import type { CalendarMonthViewDay } from 'angular-calendar';
import { CalendarMonthViewComponent, CalendarView, DateAdapter, provideCalendar } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { Subject } from 'rxjs';

import { CalendarTrialStore } from '../../+state/calendar-trials.store';
import { contains, getObservationByDay } from '../../utils/calendar-trials-utils';

@Component({
  selector: 'lib-calendar-trials-month',
  imports: [
    TranslateModule,
    CalendarMonthViewComponent,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
  ],
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
  template: `
    <mwl-calendar-month-view
      [weekendDays]="[0, 6]"
      [excludeDays]="excludeDays()"
      [weekStartsOn]="1"
      [viewDate]="viewDate()"
      [events]="events()"
      [cellTemplate]="cellTemplate()"
      [refresh]="refresh"
      (beforeViewRender)="beforeViewRender($event)"
    />
  `,
  styleUrl: './calendar-trials-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTrialsMonthComponent {
  store = inject(CalendarTrialStore, { skipSelf: true });
  cellTemplate = input<TemplateRef<unknown>>();
  data = input<CalendarEventViewModel | null>();
  showWeekends = input<boolean>(false);
  excludeDays = signal([0, 6]);

  viewDate = input<Date>(new Date());
  view: CalendarView = CalendarView.Month;

  refresh = new Subject<void>();
  events = computed(() => {
    const data = this.data();
    if (data) {
      return data.trials;
    } else {
      return [];
    }
  });

  holidays = computed(() => {
    const data = this.data();
    if (data) {
      return data.holidays.map((e) => e.date);
    } else {
      return [];
    }
  });

  noNoTams = computed(() => {
    return (this.data()?.no_notams || []).map((e) => e.date);
  });

  observations = computed(() => {
    return this.data()?.observations || [];
  });

  constructor() {
    effect(() => {
      if (this.showWeekends()) {
        this.excludeDays.set([]);
      } else {
        this.excludeDays.set([0, 6]);
      }
    });

    effect(() => {
      if (this.holidays()) {
        this.refresh.next();
      }
    });
  }

  beforeViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    const holidays = this.holidays();
    const noNotTams = this.noNoTams();
    const observations = this.observations();

    body.forEach((day) => {
      if (contains(holidays, day.date)) {
        day.cssClass = 'cell--holiday';
        day.meta = {
          ...day.meta,
          isHoliday: true,
        };
      }

      if (contains(noNotTams, day.date)) {
        day.cssClass = 'cell--no-notam';
        day.meta = {
          ...day.meta,
          disabled: true,
          isNoNoTam: true,
        };
      }

      const observationOfTheDay = getObservationByDay(observations, day.date);
      if (observationOfTheDay !== null) {
        day.meta = {
          ...day.meta,
          observation: observationOfTheDay,
        };
      }
    });
  }
}
