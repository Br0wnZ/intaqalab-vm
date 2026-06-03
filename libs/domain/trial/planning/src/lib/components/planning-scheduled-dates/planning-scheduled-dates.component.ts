import { Component, ViewEncapsulation, computed, effect, inject, input, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { CalendarTrialScheduleStore, LinesOfShotDataService } from '@intaqalab/data-access';
import type { LinesOfShot } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';

interface SchedulerChip {
  date: string;
  lineOfShootId: string;
  description: string;
}

@Component({
  selector: 'inta-planning-scheduled-dates',
  imports: [MatChipsModule, TranslatePipe, IntaIconComponent],
  template: `
    <p class="block text-sm font-medium mb-2">
      {{ 'TRIAL_CREATE_MODIFY_FORM.SCHEDULED_DATE' | translate }}
    </p>
    <div
      class="border border-gray-200 bg-gray-100 w-full rounded p-2 min-h-[40px] transition-colors cursor-not-allowed"
    >
      <div class="flex items-center gap-4">
        <ui-inta-icon name="calendar" size="xl" />
        <mat-chip-set [disabled]="true">
          @for (item of itemsView(); track item) {
            <mat-chip class="opacity-60" [disabled]="true">
              {{ item.description }}
            </mat-chip>
          }
        </mat-chip-set>
      </div>
    </div>
  `,
  styles: [
    `
      mat-chip {
        background-color: var(--color-purple-100) !important;
        .mdc-evolution-chip__text-label.mat-mdc-chip-action-label {
          color: var(--color-purple-600) !important;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        &:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__action--primary::before {
          border: 0 !important;
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class PlanningScheduledDatesComponent {
  trialId = input.required<string>();

  readonly #calendarStore = inject(CalendarTrialScheduleStore);
  readonly #linesOfShotDataService = inject(LinesOfShotDataService);

  readonly #linesOfShots = signal<LinesOfShot[] | null>(null);

  readonly #linesOfShotsDictionary = computed(() => {
    const list = this.#linesOfShots() || [];
    const dictionary: Record<string, LinesOfShot> = {};
    for (const item of list) {
      dictionary[item.id] = item;
    }
    return dictionary;
  });

  readonly itemsView = computed(() => {
    const scheduleItems = this.#calendarStore.schedule();
    const itemsView = new Array<SchedulerChip>();
    if (this.#linesOfShots() !== null && scheduleItems.length > 0) {
      const linesOfShotsDictionary = this.#linesOfShotsDictionary();
      for (const { date, lineOfShootId } of scheduleItems) {
        itemsView.push({
          lineOfShootId,
          date,
          description: `${linesOfShotsDictionary[lineOfShootId]?.label} -  ${format(new Date(date), 'dd-MM-yyyy')}`,
        });
      }
    }
    return itemsView.sort((a, b) => (a.date < b.date ? -1 : 1));
  });

  constructor() {
    effect(() => {
      const trialId = this.trialId();
      if (trialId) {
        this.#calendarStore.loadSchedule(trialId);
      }
    });

    effect(async () => {
      if (this.#linesOfShots() === null) {
        const linesOfShots = await lastValueFrom(this.#linesOfShotDataService.list());
        this.#linesOfShots.set(linesOfShots);
      }
    });
  }
}
