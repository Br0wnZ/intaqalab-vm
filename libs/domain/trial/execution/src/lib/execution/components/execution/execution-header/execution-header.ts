import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent, getTrialStatusToneClass } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { ExecutionHeaderData, ExecutionShotInfo } from '../../../models/execution-page.models';

@Component({
   
  selector: 'inta-execution-header',
  imports: [
    DatePipe,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex gap-4 flex-wrap items-center justify-between">
        <div class="flex items-center gap-2 flex-wrap">
          <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
            {{ executionData().code }}
          </span>
          <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
            {{ shotInfo().actual.serie }}
          </span>
          <span style="color: var(--inta-button)" class="px-4 py-1.5 rounded-2xl text-xs font-semibold bg-purple-100">
            {{ shotInfo().actual.shot }}
          </span>

          <button mat-flat-button color="primary" [matMenuTriggerFor]="shotHistoryMenu">
            <ui-inta-icon name="info" class="mr-2" />
            <span class="font-normal">
              {{ 'TRIAL_EXECUTION.PROGRESS' | translate }}:
              <b>{{ shotInfo().actual.percentage }}%</b>
            </span>
          </button>

          <span
            class="px-4 py-1.5 rounded-full border text-sm font-medium ml-1"
            [ngClass]="getStatusClass(executionData().status)"
          >
            {{ executionData().status }}
          </span>
        </div>

        <button mat-flat-button color="primary" [matMenuTriggerFor]="actionsMenu">
          {{ 'TRIAL_EXECUTION.ACTIONS' | translate }}
          <mat-icon iconPositionEnd>expand_more</mat-icon>
        </button>
      </div>

      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 text-gray-700">
            {{ executionData().client }}
          </span>
          <span class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 text-gray-700">
            {{ executionData().project }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <button mat-flat-button color="primary" (click)="equipmentSelectorRequested.emit()">
            {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BTN_LABEL' | translate }}
          </button>

          <!-- Botón Guardar -->
          <button
            mat-icon-button
            class="!bg-transparent !shadow-none !size-12"
            style="color: var(--inta-color-primary)"
            [disabled]="isSaving() || !hasUnsavedChanges()"
            [class.!opacity-30]="isSaving() || !hasUnsavedChanges()"
            [attr.aria-disabled]="isSaving() || !hasUnsavedChanges()"
            (click)="saveRequested.emit()"
          >
            <mat-icon class="!text-[32px] !size-[32px]">save</mat-icon>
          </button>

          <button
            mat-flat-button
            color="primary"
            style="color: var(--inta-button)"
            class="!bg-transparent !p-0"
            (click)="widgetsPanelToggleRequested.emit()"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS_BTN' | translate }}
          </button>

          <div class="flex items-center gap-2 ml-2">
            <mat-slide-toggle color="primary" [checked]="editMode()" (change)="editModeToggleRequested.emit()">
              <span class="text-sm font-medium text-gray-600">{{ 'TRIAL_EXECUTION.EDIT_PANEL' | translate }}</span>
            </mat-slide-toggle>
          </div>
        </div>
      </div>
    </div>

    <mat-menu class="!min-w-[200px]" #actionsMenu="matMenu">
      <button mat-menu-item (click)="startRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_START' | translate }}</span>
      </button>
      <button mat-menu-item (click)="pauseRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_PAUSE' | translate }}</span>
      </button>
      <button mat-menu-item (click)="resumeRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_RESUME' | translate }}</span>
      </button>
      <button mat-menu-item (click)="interruptRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_STOP' | translate }}</span>
      </button>
      <button mat-menu-item (click)="cancelRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_CANCEL' | translate }}</span>
      </button>
      <button mat-menu-item (click)="finishRequested.emit()">
        <span>{{ 'TRIAL_EXECUTION.ACTION_FINISH' | translate }}</span>
      </button>
    </mat-menu>

    <mat-menu yPosition="below" class="!rounded-2xl !min-w-[600px] overflow-hidden" #shotHistoryMenu="matMenu">
      <div
        tabindex="0"
        role="region"
        class="p-0 outline-none"
        (click)="$event.stopPropagation()"
        (keydown.enter)="$event.stopPropagation()"
        (keydown.space)="$event.stopPropagation()"
      >
        <div class="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ 'TRIAL_EXECUTION.HISTORY.SERIES' | translate }}
          </span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ 'TRIAL_EXECUTION.HISTORY.SHOT' | translate }}
          </span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ 'TRIAL_EXECUTION.HISTORY.STATUS' | translate }}
          </span>
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {{ 'TRIAL_EXECUTION.HISTORY.EXECUTION_DATE' | translate }}
          </span>
        </div>

        <div class="max-h-[350px] overflow-y-auto">
          @for (history of shotInfo().all; track history.serie) {
            @for (historicShot of history.shots; track historicShot.timestamp) {
              <div
                class="grid grid-cols-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span
                  matTooltipPosition="above"
                  class="text-sm font-medium text-gray-700 truncate pr-4"
                  [matTooltip]="history.serie"
                >
                  {{ history.serie }}
                </span>
                <span class="text-sm text-gray-600">{{ historicShot.shot }}</span>
                <div>
                  <span
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-block"
                    [ngClass]="getStatusClass(historicShot.status)"
                  >
                    {{ historicShot.status }}
                  </span>
                </div>
                <span class="text-sm text-gray-500 font-medium">
                  {{ historicShot.timestamp | date: 'dd/MM/yyyy' }}
                </span>
              </div>
            }
          }
        </div>
      </div>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionHeader {
  readonly executionData = input.required<ExecutionHeaderData>();
  readonly shotInfo = input.required<ExecutionShotInfo>();
  readonly hasUnsavedChanges = input.required<boolean>();
  readonly isSaving = input.required<boolean>();
  readonly editMode = input.required<boolean>();

  readonly startRequested = output<void>();
  readonly pauseRequested = output<void>();
  readonly resumeRequested = output<void>();
  readonly interruptRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly finishRequested = output<void>();
  readonly equipmentSelectorRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly widgetsPanelToggleRequested = output<void>();
  readonly editModeToggleRequested = output<void>();

  getStatusClass(status?: string): string {
    return getTrialStatusToneClass(status);
  }
}
