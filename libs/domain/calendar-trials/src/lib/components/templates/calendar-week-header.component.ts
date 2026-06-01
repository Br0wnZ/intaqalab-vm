import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { CalendarViewObservation } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';

import { CalendarTrialStore } from '../../+state/calendar-trials.store';
import { DayActionsComponent } from './day-actions.component';

@Component({
  selector: 'lib-week-calendar-header',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, DayActionsComponent, IntaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="row" class="cal-day-headers">
      @for (day of days(); track $index; let idx = $index) {
        <div tabindex="0" role="columnheader" class="cal-header-cell" [ngClass]="day.cssClass">
          <div class="cal-week-day-header__top">
            <span class="cal-week-day-header__number" [class.cal-week-day-header__number--today]="isToday(day.date)">
              {{ day.date | date: 'd' }}
            </span>
            <div class="flex gap-1">
              @if (observations()[idx]) {
                <button
                  mat-icon-button
                  matTooltipPosition="above"
                  class="!text-gray-900"
                  [matTooltip]="observations()[idx]?.description"
                >
                  <ui-inta-icon name="info" size="xxl" />
                </button>
              }
              <lib-day-actions
                [value]="day.date"
                [observations]="observations()[idx]"
                [isDisabled]="day.isPast || !!day?.meta?.disabled"
                [linesOfShotData]="store.schedulerLinesOfShotData()"
                (refreshView)="store.refreshView()"
              ></lib-day-actions>
            </div>
          </div>
          <span class="cal-week-day-header__label">{{ day.date | date: 'MMM, EEEE' }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './calendar-week-header.scss',
})
export class CalendarWeekHeaderComponent {
  readonly store = inject(CalendarTrialStore, { skipSelf: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly days = input<any>([]);
  readonly observations = input<(CalendarViewObservation | null)[]>([]);
  readonly add = output<unknown>();

  isToday(date: Date) {
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
}
