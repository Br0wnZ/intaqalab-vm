import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ALL_ROLES_EXCEPT_VIEWER, Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { IntaIconComponent, ValueTooltip, getTrialStatusToneClass } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type { ExecutionHeaderData, ExecutionShotInfo } from '../../../models/execution-page.models';
import { mapSelectedShotStatusClass, mapSelectedShotStatusLabel } from '../../../widgets/utils/selection-options';

@Component({
  selector: 'inta-execution-header',
  imports: [
    DatePipe,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSlideToggleModule,
    ValueTooltip,
    TranslatePipe,
    IntaIconComponent,
  ],
  template: `
    @let actionItems = actionMenuItems();
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

        @if (actionItems.length === 1) {
          @for (item of actionItems; track item.label) {
            <button mat-flat-button color="primary" (click)="item.action()">
              {{ item.label | translate }}
            </button>
          }
        } @else {
          <button
            mat-flat-button
            color="primary"
            [hidden]="actionItems.length === 0"
            [class.!hidden]="actionItems.length === 0"
            [matMenuTriggerFor]="actionsMenu"
          >
            {{ 'TRIAL_EXECUTION.ACTIONS' | translate }}
            <mat-icon iconPositionEnd>expand_more</mat-icon>
          </button>
        }
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
          <button
            id="execution-header-equipment-selector-btn"
            mat-flat-button
            color="primary"
            [disabled]="!canSelectEquipment()"
            (click)="equipmentSelectorRequested.emit()"
          >
            {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BTN_LABEL' | translate }}
          </button>

          <!-- Botón Guardar -->
          <button
            mat-icon-button
            style="color: var(--inta-color-primary)"
            class="!bg-transparent !shadow-none !size-12"
            [attr.aria-label]="'COMMONS.SAVE' | translate"
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
      @for (item of actionItems; track item.label) {
        <button mat-menu-item (click)="item.action()">
          <span>{{ item.label | translate }}</span>
        </button>
      }
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
            @for (historicShot of history.shots; track $index) {
              <div
                class="grid grid-cols-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                [class.border-t-2]="$first"
                [class.border-t-gray-300]="$first"
              >
                <span
                  uiValueTooltip
                  uiValueTooltipPosition="right"
                  uiValueTooltipAnchor="text"
                  class="inline-flex max-w-full items-center truncate rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700"
                  [uiValueTooltipValue]="history.serie"
                >
                  {{ history.serie }}
                </span>
                <span class="text-sm text-gray-600">{{ historicShot.shot }}</span>
                <div>
                  <span
                    class="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight inline-block"
                    [ngClass]="getShotStatusClass(historicShot.status)"
                  >
                    {{ getShotStatusLabel(historicShot.status) }}
                  </span>
                </div>
                <span class="text-sm text-gray-500 font-medium">
                  {{ historicShot.timestamp ? (historicShot.timestamp | date: 'dd/MM/yyyy') : '—' }}
                </span>
              </div>
            }
          }
        </div>
      </div>
    </mat-menu>
  `,
})
export class ExecutionHeader {
  readonly executionData = input.required<ExecutionHeaderData>();
  readonly shotInfo = input.required<ExecutionShotInfo>();
  readonly hasUnsavedChanges = input.required<boolean>();
  readonly isSaving = input.required<boolean>();
  readonly editMode = input.required<boolean>();
  readonly canSelectEquipment = input.required<boolean>();
  readonly canModifyPlanning = input<boolean>(false);
  readonly canViewModifications = input<boolean>(false);
  readonly userRoles = input<readonly Role[]>([]);

  readonly actionMenuItems = computed(() => {
    return [
      ...this.#getStateActions(this.executionData().statusValue).filter((item) => item.allowed),
      ...(this.canModifyPlanning()
        ? [{ label: 'TRIAL_EXECUTION.ACTION_MODIFY_PLANNING', action: () => this.modifyPlanning.emit() }]
        : []),
      ...(this.canViewModifications()
        ? [{ label: 'TRIAL_EXECUTION.ACTION_VIEW_MODIFICATIONS', action: () => this.viewModifications.emit() }]
        : []),
    ];
  });

  #getStateActions(status: TrialStatus | undefined) {
    const roles = this.userRoles();
    const canControl = roles.some(
      (role) => role === Role.INTAQALAB_ADMIN || role === Role.INTAQALAB_SHOOTING_LINE_HEAD,
    );
    const canCancel = canControl || roles.includes(Role.INTAQALAB_TRIAL_ENGINEER);
    const canInterrupt = roles.some((role) => ALL_ROLES_EXCEPT_VIEWER.includes(role));
    const canReactivate = canControl || roles.includes(Role.INTAQALAB_PLANNING_ANALYSIS_HEAD);
    const canValidate = roles.some(
      (role) =>
        role === Role.INTAQALAB_ARMAMENT_UNIT_HEAD ||
        role === Role.INTAQALAB_MUNITIONS_UNIT_HEAD ||
        role === Role.INTAQALAB_BALLISTICS_UNIT_HEAD ||
        role === Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
    );

    switch (status) {
      case TrialStatus.PLANNED:
        return [
          { label: 'TRIAL_EXECUTION.ACTION_START', action: () => this.startRequested.emit(), allowed: canControl },
        ];
      case TrialStatus.IN_PROGRESS:
        return [
          { label: 'TRIAL_EXECUTION.ACTION_PAUSE', action: () => this.pauseRequested.emit(), allowed: canControl },
          { label: 'TRIAL_EXECUTION.ACTION_STOP', action: () => this.interruptRequested.emit(), allowed: canInterrupt },
          { label: 'TRIAL_EXECUTION.ACTION_CANCEL', action: () => this.cancelRequested.emit(), allowed: canCancel },
          { label: 'TRIAL_EXECUTION.ACTION_FINISH', action: () => this.finishRequested.emit(), allowed: canControl },
        ];
      case TrialStatus.STARTED:
        return [
          { label: 'TRIAL_EXECUTION.ACTION_RESUME', action: () => this.resumeRequested.emit(), allowed: canControl },
          { label: 'TRIAL_EXECUTION.ACTION_CANCEL', action: () => this.cancelRequested.emit(), allowed: canCancel },
        ];
      case TrialStatus.INTERRUPTED:
        return [
          { label: 'TRIAL_EXECUTION.ACTION_RESUME', action: () => this.resumeRequested.emit(), allowed: canControl },
        ];
      case TrialStatus.EXECUTED:
        return [
          { label: 'TRIAL_EXECUTION.ACTION_VALIDATE', action: () => undefined, allowed: canValidate },
          { label: 'TRIAL_EXECUTION.ACTION_CANCEL', action: () => this.cancelRequested.emit(), allowed: canCancel },
        ];
      case TrialStatus.CANCELLED:
        return [
          {
            label: 'TRIAL_EXECUTION.ACTION_REACTIVATE',
            action: () => this.reactivateRequested.emit(),
            allowed: canReactivate,
          },
        ];
      default:
        return [];
    }
  }

  readonly startRequested = output<void>();
  readonly pauseRequested = output<void>();
  readonly resumeRequested = output<void>();
  readonly reactivateRequested = output<void>();
  readonly interruptRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly finishRequested = output<void>();
  readonly modifyPlanning = output<void>();
  readonly viewModifications = output<void>();
  readonly equipmentSelectorRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly widgetsPanelToggleRequested = output<void>();
  readonly editModeToggleRequested = output<void>();

  getStatusClass(status?: string): string {
    return getTrialStatusToneClass(status);
  }

  getShotStatusClass(status?: string): string {
    return mapSelectedShotStatusClass(status);
  }

  getShotStatusLabel(status?: string): string {
    return mapSelectedShotStatusLabel(status);
  }
}
