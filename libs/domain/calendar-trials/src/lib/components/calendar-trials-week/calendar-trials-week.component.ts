import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { CalendarEventViewModel } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import type { CalendarWeekViewBeforeRenderEvent } from 'angular-calendar';
import { CalendarView, CalendarWeekViewComponent, DateAdapter, provideCalendar } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { Subject } from 'rxjs';

import { contains, getObservationByDay } from '../../utils/calendar-trials-utils';
import { CalendarWeekHeaderComponent } from '../templates/calendar-week-header.component';

@Component({
  selector: 'lib-calendar-trials-week',
  imports: [
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    CalendarWeekViewComponent,
    CalendarWeekHeaderComponent,
    TranslateModule,
  ],
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
  template: `
    <!-- se ha añadido lib-week-calendar-header por un workaround de angular20 con esa librería. Al iterar sobre los días sin la componente intermedia daba errores. No borrar la componente  lib-week-calendar-header 
    -->
    <ng-template let-days="days" #customHeaderTemplate>
      <lib-week-calendar-header
        [days]="days"
        [observations]="observationsHeader()"
        (add)="onHeaderAdd($event)"
      ></lib-week-calendar-header>
    </ng-template>
    <div [class.visible-weekends]="excludeDays().length === 0">
      <mwl-calendar-week-view
        [excludeDays]="excludeDays()"
        [weekStartsOn]="1"
        [viewDate]="viewDate()"
        [events]="events()"
        [refresh]="refresh"
        [headerTemplate]="customHeaderTemplate"
        [eventTemplate]="$any(eventTemplate())"
        (beforeViewRender)="beforeViewRender($event)"
      />
    </div>
  `,
  styleUrl: './calendar-trials-week.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTrialsWeekComponent {
  eventTemplate = input<TemplateRef<unknown>>();
  onHeaderAdd(day: unknown) {
    console.log('Parent received add for day:', day);
  }

  viewDate = input<Date>(new Date());
  view: CalendarView = CalendarView.Month;

  showWeekends = input<boolean>(false);
  data = input<CalendarEventViewModel | null>();

  events = computed(() => {
    const data = this.data();
    if (data) {
      return data.trials.map((t) => {
        return {
          ...t,
          allDay: true,
        };
      });
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
  noEvents = computed(() => {
    return this.events().length === 0;
  });

  observations = computed(() => {
    return this.data()?.observations || [];
  });

  dataToView = signal<CalendarWeekViewBeforeRenderEvent | undefined>(undefined);

  observationsHeader = computed(() => {
    const result = [];
    const dataToView = this.dataToView();
    const observations = this.observations();
    if (dataToView !== undefined && observations.length > 0) {
      for (const day of dataToView.header) {
        const observationOfTheDay = getObservationByDay(observations, day.date);
        result.push(observationOfTheDay);
      }
    }
    return result;
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

  onDayHeaderClick(day: unknown): void {
    console.log('Botón de cabecera clicado:', day);
  }

  beforeViewRender(data: CalendarWeekViewBeforeRenderEvent): void {
    const holidays = this.holidays();
    const noNotTams = this.noNoTams();
    this.dataToView.set(data);
    data.header.forEach((day) => {
      if (day.isWeekend) {
        day.cssClass = 'cell--weekend';
      }
      if (contains(holidays, day.date)) {
        day.cssClass = 'cell--holiday';
      }

      if (contains(noNotTams, day.date)) {
        day.cssClass = 'cell--no-notam';
      }
    });
  }

  excludeDays = signal([0, 6]);
  refresh = new Subject<void>();
}
