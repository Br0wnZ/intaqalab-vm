/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TrialStatus } from '@intaqalab/models';
import type { CalendarTrialApiResponse } from '@intaqalab/models';
import { TrialPersmissionsService } from '@intaqalab/trial-management';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarDatePipe, CalendarTooltipDirective } from 'angular-calendar';

import { CalendarTrialStore } from '../../+state/calendar-trials.store';
import { EventsActionsService } from '../../services/events-actions.service';
import { DayActionsComponent } from './day-actions.component';

@Component({
  selector: 'lib-calendar-shared-templates',
  imports: [
    TranslateModule,
    MatTooltipModule,
    CalendarTooltipDirective,
    CalendarDatePipe,
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    DayActionsComponent,
    DatePipe,
    IntaIconComponent,
  ],
  template: `
    <ng-template
      let-day="day"
      let-openDay="openDay"
      let-locale="locale"
      let-tooltipPlacement="tooltipPlacement"
      let-highlightDay="highlightDay"
      let-unhighlightDay="unhighlightDay"
      let-eventClicked="eventClicked"
      #monthCellTemplate
    >
      <div
        class="cal-cell-top calendar-month-cell__top"
        [class.calendar-month-cell__top--holiday]="day?.meta?.isHoliday"
      >
        <span class="cal-day-number">{{ day.date | calendarDate: 'monthViewDayNumber' : locale }}</span>
        @if (day?.meta?.observation) {
          <button
            mat-icon-button
            matTooltipPosition="above"
            class="cal-observations"
            [matTooltip]="day?.meta?.observation?.description"
          >
            <ui-inta-icon name="info" size="xxl" />
          </button>
        }
        <lib-day-actions
          [value]="day.date"
          [observations]="day?.meta?.observation"
          [isDisabled]="day.isPast || !!day?.meta?.disabled"
          [linesOfShotData]="store.schedulerLinesOfShotData()"
          (refreshView)="store.refreshView()"
        ></lib-day-actions>
      </div>

      <div class="calendar-month-cell__body" [class.calendar-month-cell__body--holiday]="day?.meta?.isHoliday">
        @if (day?.meta?.isNoNoTam) {
          <div class="calendar-month-cell__special-state calendar-month-cell__special-state--no-notam">
            {{ 'CALENDAR_TRIALS.CELL_NO_NOTAM' | translate }}
          </div>
        }

        @if (day?.meta?.isHoliday) {
          <div class="calendar-month-cell__special-state calendar-month-cell__special-state--holiday">
            {{ 'CALENDAR_TRIALS.CELL_HOLIDAY' | translate }}
          </div>
        }

        @for (event of day.events; track event) {
          <div
            tabindex="0"
            class="cal-event-item calendar-month-event"
            [mwlCalendarTooltip]="event.meta?.fireTrial?.trialNumber + ' ' + getLineLabel(event.meta?.lineOfShootId)"
            [tooltipPlacement]="tooltipPlacement"
            [tooltipTemplate]="tooltipTemplate2"
            [tooltipEvent]="event"
            [tooltipDelay]="300"
            (click)="$event.stopPropagation(); eventClicked.emit({ event: event })"
            (keyup.enter)="$event.stopPropagation(); eventClicked.emit({ event: event })"
          >
            <div tabindex="0" class="calendar-month-event__content flex">
              <button
                type="button"
                class="calendar-month-event__main flex flex-col !items-start overflow-hidden gap-1 !py-1"
                (click)="handleViewTrial(event.meta.fireTrial.id)"
              >
                <span class="calendar-month-event__title w-full">
                  {{ 'CALENDAR_TRIALS.EVENT.TRIAL' | translate }} {{ event.meta.fireTrial.trialNumber }}
                  {{ getLineLabel(event.meta.lineOfShootId) }}
                </span>
                <span class="calendar-month-event__title w-full">
                  {{ 'CALENDAR_TRIALS.EVENT_TOOLTIP.APPLIER' | translate }} {{ event.meta?.fireTrial?.client?.name }}
                </span>
              </button>

              @if (event.meta.fireTrial.status === TrialStatus.PLANNED) {
                <button
                  type="button"
                  class="calendar-month-event__execution"
                  (click)="handleExecution(event.meta.fireTrial.id, $event)"
                >
                  <ui-inta-icon name="eventLog" size="md" />
                </button>
              }
              @if (canSchedule(event.meta.fireTrial.status)) {
                <button type="button" class="calendar-month-event__delete" (click)="unprogram(event.meta, $event)">
                  <ui-inta-icon name="remove" size="md" />
                </button>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>

    <ng-template let-event="event" #tooltipTemplate2>
      <div class="calendar-event-tooltip">
        <p class="calendar-event-tooltip__row">
          <span class="calendar-event-tooltip__label">
            {{ 'CALENDAR_TRIALS.EVENT_TOOLTIP.TRIAL' | translate }}
          </span>
          <span>{{ event.meta?.fireTrial?.trialNumber }} {{ getLineLabel(event.meta?.lineOfShootId) }}</span>
        </p>
        <p class="calendar-event-tooltip__row">
          <span class="calendar-event-tooltip__label">
            {{ 'CALENDAR_TRIALS.EVENT_TOOLTIP.APPLIER' | translate }}
          </span>
          <span>{{ event.meta?.fireTrial?.client?.name }}</span>
        </p>
        <p class="calendar-event-tooltip__row">
          <span class="calendar-event-tooltip__label">
            {{ 'CALENDAR_TRIALS.EVENT_TOOLTIP.DESCRIPTION' | translate }}
          </span>
          <span>{{ event.meta?.fireTrial?.description || event.description }}</span>
        </p>
      </div>
    </ng-template>

    <ng-template
      let-weekEvent="weekEvent"
      let-tooltipPlacement="tooltipPlacement"
      let-eventClicked="eventClicked"
      let-tooltipTemplate="tooltipTemplate"
      let-tooltipAppendToBody="tooltipAppendToBody"
      let-tooltipDisabled="tooltipDisabled"
      let-tooltipDelay="tooltipDelay"
      let-column="column"
      #customEventDailyWeeklyTemplate
    >
      <div
        tabindex="0"
        class="calendar-week-event"
        [mwlCalendarTooltip]="weekEvent.event.title"
        [tooltipPlacement]="tooltipPlacement"
        [tooltipTemplate]="tooltipTemplate2"
        [tooltipEvent]="weekEvent.event"
        [tooltipAppendToBody]="tooltipAppendToBody"
        [tooltipDelay]="tooltipDelay"
        (click)="$event.stopPropagation(); eventClicked.emit({ event: weekEvent })"
        (keyup.enter)="$event.stopPropagation(); eventClicked.emit({ event: weekEvent })"
      >
        <div class="calendar-week-event__content">
          @if (weekEvent.event.meta.fireTrial.status === TrialStatus.PLANNED) {
            <button
              type="button"
              class="calendar-week-event__execution"
              (click)="handleExecution(weekEvent.event.meta.fireTrial.id, $event)"
            >
              <ui-inta-icon name="execution" size="md" />
            </button>
          }
          @if (canSchedule(weekEvent.event.meta.fireTrial.status)) {
            <button type="button" class="calendar-week-event__delete" (click)="unprogram(weekEvent.event.meta, $event)">
              <ui-inta-icon name="remove" size="md" />
            </button>
          }

          <button
            type="button"
            class="calendar-week-event__main"
            (click)="handleViewTrial(weekEvent.event.meta.fireTrial.id)"
          >
            <p class="calendar-week-event__label">{{ 'CALENDAR_TRIALS.EVENT.TRIAL' | translate }}</p>
            <p class="calendar-week-event__value">
              {{ weekEvent.event.meta.fireTrial.trialNumber }} {{ getLineLabel(weekEvent.event.meta.lineOfShootId) }}
            </p>

            <p class="calendar-week-event__label">{{ 'CALENDAR_TRIALS.EVENT.APPLIER' | translate }}</p>
            <p class="calendar-week-event__value">{{ weekEvent.event.meta?.fireTrial?.client?.name }}</p>

            <p class="calendar-week-event__label">{{ 'CALENDAR_TRIALS.EVENT.DESCRIPTION' | translate }}</p>
            <p class="calendar-week-event__description">
              {{ weekEvent.event.meta.fireTrial.description }}
            </p>
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template
      let-weekEvent="weekEvent"
      let-tooltipPlacement="tooltipPlacement"
      let-eventClicked="eventClicked"
      let-tooltipTemplate="tooltipTemplate"
      let-tooltipAppendToBody="tooltipAppendToBody"
      let-tooltipDisabled="tooltipDisabled"
      let-tooltipDelay="tooltipDelay"
      let-column="column"
      #customEventDailyTemplate
    >
      <div
        tabindex="0"
        class="calendar-day-event"
        (click)="$event.stopPropagation(); eventClicked.emit({ event: weekEvent })"
        (keyup.enter)="$event.stopPropagation(); eventClicked.emit({ event: weekEvent })"
      >
        <div class="calendar-day-event__content">
          @if (weekEvent.event.meta.fireTrial.status === TrialStatus.PLANNED) {
            <button
              type="button"
              class="calendar-day-event__execution"
              (click)="handleExecution(weekEvent.event.meta.fireTrial.id, $event)"
            >
              <ui-inta-icon name="execution" size="md" />
            </button>
          }
          @if (canSchedule(weekEvent.event.meta.fireTrial.status)) {
            <button type="button" class="calendar-day-event__delete" (click)="unprogram(weekEvent.event.meta, $event)">
              <ui-inta-icon name="remove" size="md" />
            </button>
          }

          <button
            type="button"
            class="calendar-day-event__main"
            (click)="handleViewTrial(weekEvent.event.meta.fireTrial.id)"
          >
            <p class="calendar-day-event__label">{{ 'CALENDAR_TRIALS.EVENT.TRIAL' | translate }}</p>
            <p class="calendar-day-event__value">
              {{ weekEvent.event.meta.fireTrial.trialNumber }} {{ getLineLabel(weekEvent.event.meta.lineOfShootId) }}
            </p>

            <p class="calendar-day-event__label">{{ 'CALENDAR_TRIALS.EVENT.APPLIER' | translate }}</p>
            <p class="calendar-day-event__value">{{ weekEvent.event.meta?.fireTrial?.client?.name }}</p>

            <p class="calendar-day-event__label">{{ 'CALENDAR_TRIALS.EVENT.DESCRIPTION' | translate }}</p>
            <p class="calendar-day-event__description">
              {{ weekEvent.event.meta.fireTrial.description }}
            </p>
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template let-variables #customDailyHeaderTemplate>
      <div class="custom-day-header" [class.custom-day-header-weekend]="variables().isWeekend">
        <div class="custom-day-header__top">
          <span
            class="custom-day-header__number"
            [class.custom-day-header__number--today]="isToday(variables().viewDate)"
          >
            {{ variables().viewDate | date: 'd' }}
          </span>
          <div class="flex gap-1">
            @if (variables().observations) {
              <button
                mat-icon-button
                matTooltipPosition="above"
                class="cal-observations"
                [matTooltip]="variables()?.observations?.description"
              >
                <ui-inta-icon name="info" size="xxl" />
              </button>
            }
            <lib-day-actions
              [value]="variables().viewDate"
              [observations]="variables().observations"
              [linesOfShotData]="store.schedulerLinesOfShotData()"
              [isDisabled]="variables().isPast"
              (refreshView)="store.refreshView()"
            ></lib-day-actions>
          </div>
        </div>
        <span class="custom-day-header__label">{{ variables().viewDate | date: 'MMM, EEEE' }}</span>
      </div>
    </ng-template>
  `,
  styleUrl: './calendar-shared-templates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarSharedTemplatesComponent {
  protected readonly TrialStatus = TrialStatus;
  store = inject(CalendarTrialStore);
  #trialPersmissionsService = inject(TrialPersmissionsService);
  #router = inject(Router);

  canSchedule(trialStatus: TrialStatus) {
    return this.#trialPersmissionsService.canSchedule(trialStatus);
  }

  viewTrial = output<string>();

  monthCellTemplate = viewChild<TemplateRef<any>>('monthCellTemplate');
  customEventDailyWeeklyTemplate = viewChild<TemplateRef<any>>('customEventDailyWeeklyTemplate');
  customEventDailyTemplate = viewChild<TemplateRef<any>>('customEventDailyTemplate');
  customDailyHeaderTemplate = viewChild<TemplateRef<any>>('customDailyHeaderTemplate');

  eventsActionsService = inject(EventsActionsService);

  isToday(date: Date) {
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  async unprogram(trial: CalendarTrialApiResponse, event: MouseEvent) {
    event.stopPropagation();
    const hasToRefresh = await this.eventsActionsService.unprogramTrial(trial);
    if (hasToRefresh) {
      this.store.refreshView();
    }
  }

  handleViewTrial(trial: string) {
    this.viewTrial.emit(trial);
  }

  handleExecution(trialId: string, event: MouseEvent) {
    event.stopPropagation();
    this.#router.navigateByUrl(`/execution/${trialId}`);
  }

  getLineLabel(lineOfShootId: string): string {
    const line = this.store.linesOfShot().find((l) => l.id === lineOfShootId);
    if (!line) {
      return `L${lineOfShootId}`;
    }
    const match = line.label.match(/\d+/);
    return match ? `L${match[0]}` : `L${lineOfShootId}`;
  }
}
