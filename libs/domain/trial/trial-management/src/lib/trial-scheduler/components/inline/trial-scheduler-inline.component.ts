import { Component, ViewEncapsulation, computed, effect, inject, input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { CalendarTrialScheduleService, LinesOfShotDataService } from '@intaqalab/data-access';
import type { CalendarTrialScheduleApiResponse, LinesOfShot, TrialStatus } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';

import { TrialGeneralDataStore } from '../../../components/shared/+state/trial-general-data.store';
import { TrialPersmissionsService } from '../../../permissions/trial-persmissions.service';
import { TrialScheduleService } from '../../trial-schedule.service';

interface SchedulerChip {
  date: string;
  lineOfShootId: string;
  description: string;
}

@Component({
  selector: 'inta-trial-scheduler-inline',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslatePipe,
    IntaIconComponent,
  ],
  template: `
    <p class="block text-sm font-medium mb-2">
      {{ 'TRIAL_CREATE_MODIFY_FORM.SCHEDULED_DATE' | translate }}
    </p>
    <button class="w-full" [disabled]="!canEdit()" (click)="manageSchedule()">
      <div
        class="border w-full rounded p-2 min-h-[40px] transition-colors"
        [class.border-gray-300]="canEdit()"
        [class.border-gray-200]="!canEdit()"
        [class.bg-white]="canEdit()"
        [class.bg-gray-100]="!canEdit()"
        [class.cursor-not-allowed]="!canEdit()"
      >
        <div class="flex items-center gap-4">
          <ui-inta-icon name="calendar" size="xl" />
          <mat-chip-set [disabled]="!canEdit()">
            @for (item of itemsView(); track item; let idx = $index) {
              <mat-chip
                [removable]="canEdit()"
                [disabled]="!canEdit()"
                [class.opacity-60]="!canEdit()"
                (removed)="unschedule(idx)"
                (click)="onRemoveClick($event)"
              >
                {{ item.description }}
                @if (canEdit()) {
                  <ui-inta-icon matChipRemove name="close" size="xs" />
                }
              </mat-chip>
            }
          </mat-chip-set>
        </div>
      </div>
    </button>
  `,
  styles: [
    `
      mat-chip {
        background-color: var(--color-purple-100) !important;
        .mdc-evolution-chip__text-label.mat-mdc-chip-action-label,
        .mat-mdc-chip-remove {
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
export class TrialSchedulerInlineComponent {
  readonly #trialStore = inject(TrialGeneralDataStore);
  trialId = input.required<string>();
  trialStatus = input<TrialStatus>();
  trialNumber = input<string>('');
  trialPersmissionsService = inject(TrialPersmissionsService);

  canEdit = computed(() => {
    return this.trialPersmissionsService.canSchedule(this.trialStatus());
  });

  calendarTrialScheduleService = inject(CalendarTrialScheduleService);
  scheduleItems = signal<CalendarTrialScheduleApiResponse | null>(null);

  linesOfShotDataService = inject(LinesOfShotDataService);
  linesOfShots = signal<LinesOfShot[] | null>(null);

  linesOfShotsDictionary = computed(() => {
    const list = this.linesOfShots() || [];
    const dictionary: Record<string, LinesOfShot> = {};
    for (const item of list) {
      dictionary[item.id] = item;
    }
    return dictionary;
  });

  itemsView = computed(() => {
    const scheduleItems = this.scheduleItems();
    const itemsView = new Array<SchedulerChip>();
    if (this.linesOfShots() !== null && scheduleItems !== null) {
      const linesOfShotsDictionary = this.linesOfShotsDictionary();
      for (const { date, lineOfShootId } of scheduleItems) {
        itemsView.push({
          lineOfShootId,
          date,
          description: `${linesOfShotsDictionary[lineOfShootId]?.label} -  ${format(new Date(date), 'dd-MM-yyyy')}`,
        });
      }
    }
    const sortedItems = itemsView.sort((a, b) => (a.date < b.date ? -1 : 1));
    return sortedItems;
  });

  constructor() {
    effect(async () => {
      const trialId = this.trialId();
      if (trialId) {
        await this.#loadItemsToShow(trialId);
      }
    });

    effect(async () => {
      if (this.linesOfShots() === null) {
        const linesOfShots = await lastValueFrom(this.linesOfShotDataService.list());
        this.linesOfShots.set(linesOfShots);
      }
    });
  }

  async #loadItemsToShow(trialId: string) {
    const items = await this.calendarTrialScheduleService.getSchedule(trialId);
    console.log(items);
    this.scheduleItems.set(items);
  }

  readonly #trialScheduleService = inject(TrialScheduleService);
  async manageSchedule() {
    if (!this.canEdit()) {
      return;
    }
    const lineOfShots = this.linesOfShots();
    const trialId = this.trialId();
    if (lineOfShots?.length) {
      const ok = await this.#trialScheduleService.selectLinesAndDatesToSchedule(
        {
          id: trialId,
          trialNumber: this.trialNumber(),
        },
        {
          list: lineOfShots,
          current: lineOfShots[0].id,
        },
      );

      if (ok) {
        this.#loadItemsToShow(trialId);
        this.calendarTrialScheduleService.triggerRefresh?.();
        this.#trialStore.setTrialId(trialId);
      }
    }
  }

  async unschedule(index: number): Promise<void> {
    const items = this.itemsView() || [];
    items.splice(index, 1);
    this.calendarTrialScheduleService.update(this.trialId(), items).subscribe(() => {
      this.scheduleItems.set([...items]);
      this.calendarTrialScheduleService.triggerRefresh?.();
      this.#trialStore.setTrialId(this.trialId());
    });
  }

  onRemoveClick(event: MouseEvent) {
    event.stopPropagation();
  }
}
