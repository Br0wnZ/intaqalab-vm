import { NgTemplateOutlet } from '@angular/common';
import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CalendarEventViewModel } from '@intaqalab/models';
import { CalendarDayViewComponent, DateAdapter, provideCalendar } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { getObservationByDay } from '../../utils/calendar-trials-utils';

@Component({
  selector: 'lib-calendar-trials-day',
  imports: [CalendarDayViewComponent, NgTemplateOutlet],
  template: `
    <ng-container *ngTemplateOutlet="customDailyHeaderTemplate(); context: { $implicit: variables }"></ng-container>
    <div [class.calendar-day-is-weekend]="isWeekend()">
      <mwl-calendar-day-view
        [viewDate]="viewDate()"
        [events]="events()"
        [eventTemplate]="$any(customEventDailyTemplate())"
      />
    </div>
  `,
  styleUrl: './calendar-trials-day.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
})
export class CalendarTrialsDayComponent {
  customDailyHeaderTemplate = input<TemplateRef<unknown>>();
  customEventDailyTemplate = input<TemplateRef<unknown>>();
  viewDate = input<Date>(new Date());
  isWeekend = computed(() => {
    const day = this.viewDate().getDay();
    return day === 0 || day === 6;
  });
  data = input<CalendarEventViewModel | null>();

  variables = computed(() => {
    const observations = getObservationByDay(this.data()?.observations || [], this.viewDate());
    return {
      viewDate: this.viewDate(),
      observations,
      isPast: isYesterdayOrEarlier(this.viewDate()),
      isWeekend: this.isWeekend(),
    };
  });

  events = computed(() => {
    const data = this.data();
    console.log('data is...', data);
    if (data) {
      const result = data.trials.map((t) => {
        return {
          ...t,
          color: {
            primary: '#e3bc08',
            secondary: '#FDF1BA',
          },
          allDay: true,
        };
      });
      return result;
    } else {
      return [];
    }
  });
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
