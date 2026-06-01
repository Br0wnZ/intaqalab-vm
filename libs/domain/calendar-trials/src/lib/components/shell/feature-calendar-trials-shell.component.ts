import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HasRoleDirective, Role, injectionTokenTabCommand } from '@intaqalab/core';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarView, DateAdapter, provideCalendar } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { CalendarTrialStore } from '../../+state/calendar-trials.store';
import { SpecialDaysManagerService } from '../../special-days-manager/special-days-manager.service';
import { CalendarTrialsDayComponent } from '../calendar-trials-day/calendar-trials-day.component';
import { CalendarTrialsHeaderComponent } from '../calendar-trials-header/calendar-trials-header.component';
import { CalendarTrialsMonthComponent } from '../calendar-trials-month/calendar-trials-month.component';
import { CalendarTrialsWeekComponent } from '../calendar-trials-week/calendar-trials-week.component';
import { CalendarSharedTemplatesComponent } from '../templates/calendar-shared-templates.component';

@Component({
  imports: [
    CalendarTrialsHeaderComponent,
    CalendarTrialsMonthComponent,
    CalendarTrialsWeekComponent,
    CalendarTrialsDayComponent,
    MatButtonModule,
    MatIcon,
    TranslateModule,
    HasRoleDirective,
    CalendarSharedTemplatesComponent,
    IntaIconComponent,
  ],
  providers: [
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    CalendarTrialStore,
  ],
  template: `
    <lib-calendar-shared-templates
      (viewTrial)="handleViewTrial($event)"
      #calendarTemplates
    ></lib-calendar-shared-templates>

    <div *libHasRole="[Role.INTAQALAB_ADMIN]" class="flex flex-row-reverse mt-2">
      <div>
        <button mat-flat-button color="primary" type="button" class="!leading-normal" (click)="manageSpecialDays()">
          <ui-inta-icon name="calendar" size="xl" class="mr-1" />
          {{ 'SPECIAL_DAYS_MANAGER.BUTTON_MANAGE_SPECIAL_DAYS' | translate }}
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-6 my-6">
      <div class="calendar-trials-shell__header">
        <lib-calendar-trials-header
          [linesOfShot]="store.linesOfShot()"
          [(view)]="view"
          [(viewDate)]="viewDate"
          (lineChange)="lineChanged($event)"
          (viewChange)="viewChangeHandler($event)"
          (viewDateChange)="viewDateChangeHandler($event)"
          (showWeekends)="showWeekendsHandler($event)"
        />
      </div>
      @switch (store.view()) {
        @case (CalendarView.Month) {
          <lib-calendar-trials-month
            [cellTemplate]="calendarTemplates.monthCellTemplate()"
            [viewDate]="store.viewDate()"
            [data]="store.groupedEvents()"
            [showWeekends]="store.showWeekends()"
          ></lib-calendar-trials-month>
        }
        @case (CalendarView.Week) {
          <lib-calendar-trials-week
            [eventTemplate]="calendarTemplates.customEventDailyWeeklyTemplate()"
            [viewDate]="store.viewDate()"
            [data]="store.groupedEvents()"
            [showWeekends]="store.showWeekends()"
          ></lib-calendar-trials-week>
        }
        @case (CalendarView.Day) {
          <lib-calendar-trials-day
            [customDailyHeaderTemplate]="calendarTemplates.customDailyHeaderTemplate()"
            [customEventDailyTemplate]="calendarTemplates.customEventDailyTemplate()"
            [viewDate]="store.viewDate()"
            [data]="store.groupedEvents()"
          ></lib-calendar-trials-day>
        }
      }
    </div>
  `,
  styleUrl: './feature-calendar-trials-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCalendarTrialsShellComponent {
  readonly injector = inject(Injector);
  readonly store = inject(CalendarTrialStore);
  readonly specialDaysManager = inject(SpecialDaysManagerService);

  readonly Role = Role;
  readonly view = this.store.view();
  readonly CalendarView = CalendarView;
  readonly viewDate = new Date();

  lineChanged(lineId: string) {
    this.store.changeLine(lineId);
  }

  viewChangeHandler(view: CalendarView) {
    this.store.setView(view);
  }

  viewDateChangeHandler(date: Date) {
    this.store.setViewDate(date);
  }

  showWeekendsHandler(showWeekends: boolean) {
    this.store.setShowWeekends(showWeekends);
  }

  manageSpecialDays() {
    this.specialDaysManager.manage().subscribe((someChangesOnSpacialDays) => {
      if (someChangesOnSpacialDays) {
        this.store.refreshView();
      }
    });
  }

  handleViewTrial(trialId: string) {
    this.#onAction({ command: 'TRIAL_DETAIL', argument: trialId });
  }

  readonly #onAction = this.injector.get(injectionTokenTabCommand);
}
