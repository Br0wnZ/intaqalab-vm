import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CAN_ADD_CALENDAR_OBSERVATIONS_ROLES, Role, injectCurrentUserRole } from '@intaqalab/core';
import type { CalendarViewObservation } from '@intaqalab/models';
import { TrialPersmissionsService } from '@intaqalab/trial-management';
import { TranslateModule } from '@ngx-translate/core';

import type { LinesOfShotViewState } from '../../models/lines-of-shoot.model';
import { EventsActionsService } from '../../services/events-actions.service';

@Component({
  selector: 'lib-day-actions',
  imports: [TranslateModule, MatMenuModule, MatButtonModule, MatDividerModule, MatIconModule],
  template: `
    <span class="cal-actions">
      <button
        matIconButton
        aria-label="Actions"
        class="day-actions__trigger"
        [matMenuTriggerFor]="menu"
        [disabled]="isDisabled() || (!canSchedule && !canAddObservations())"
        [class.day-actions__trigger--disabled]="isDisabled() || (!canSchedule && !canAddObservations())"
      >
        <mat-icon class="day-actions__icon">more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        @if (canSchedule) {
          <button mat-menu-item (click)="schedule()">
            <span>{{ 'CALENDAR_TRIALS.ACTIONS.PROGAM' | translate }}</span>
          </button>
        }
        @if (canAddObservations()) {
          @if (!observations()) {
            <button mat-menu-item (click)="addObs()">
              <span>{{ 'CALENDAR_TRIALS.ACTIONS.ADD_OBS' | translate }}</span>
            </button>
          } @else {
            <button mat-menu-item (click)="editObs()">
              <span>{{ 'CALENDAR_TRIALS.ACTIONS.EDIT_OBS' | translate }}</span>
            </button>
            <button mat-menu-item (click)="deleteObs()">
              <span>{{ 'CALENDAR_TRIALS.ACTIONS.DELETE_OBS' | translate }}</span>
            </button>
          }
        }
      </mat-menu>
    </span>
  `,
  styles: `
    .day-actions__trigger,
    .day-actions__icon {
      color: var(--inta-neutral-900) !important;
    }

    .day-actions__trigger--disabled,
    .day-actions__trigger--disabled .day-actions__icon {
      opacity: 0.35;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayActionsComponent {
  readonly #roles = injectCurrentUserRole();

  readonly canSchedule = inject(TrialPersmissionsService).canSchedule();
  readonly canAddObservations = computed(() =>
    this.#roles().some((role) => CAN_ADD_CALENDAR_OBSERVATIONS_ROLES.includes(role)),
  );

  readonly value = input<Date>();
  readonly observations = input.required<CalendarViewObservation | undefined | null>();
  isDisabled = input<boolean>(false);
  linesOfShotData = input<LinesOfShotViewState>();
  refreshView = output<true>();

  eventsActionsService = inject(EventsActionsService);

  async addObs() {
    const day = this.value();
    if (day) {
      const result = await this.eventsActionsService.addObservationsToDay(day);
      if (result) {
        this.refreshView.emit(true);
      }
    }
  }

  async editObs() {
    const observations = this.observations();
    if (observations) {
      const result = await this.eventsActionsService.editObservationsToDay(observations);
      if (result) {
        this.refreshView.emit(true);
      }
    }
  }

  async deleteObs() {
    const observations = this.observations();
    if (observations) {
      const result = await this.eventsActionsService.deleteObs(observations);
      if (result) {
        this.refreshView.emit(true);
      }
    }
  }

  async schedule() {
    const linesOfShotData = this.linesOfShotData();
    const day = this.value();
    if (linesOfShotData && day) {
      const result = await this.eventsActionsService.schedule(linesOfShotData, day);
      if (result) {
        this.refreshView.emit(true);
      }
    }
  }
}
