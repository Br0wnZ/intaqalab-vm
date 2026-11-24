import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SaveButton } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type { PlanningChange, PlanningModification } from '../../../../data-access/planning-modifications';
import type { ModificationClassificationChangeEvent } from '../modify-planning-dialog.models';
import { ModificationsTable, type PlanningModificationRow } from './modifications-table';

@Component({
  selector: 'inta-planning-modifications-tab',
  imports: [MatIconModule, MatProgressBarModule, SaveButton, TranslatePipe, ModificationsTable],
  template: `
    <div class="flex flex-col gap-4 py-4 h-full">
      @if (isLoading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (hasPendingModifications()) {
        <div
          role="status"
          class="flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900"
        >
          <mat-icon class="text-amber-600 shrink-0 mt-0.5">lock</mat-icon>
          <div class="flex flex-col gap-1">
            <span class="font-semibold text-sm">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.TITLE' | translate }}
            </span>
            <p class="text-sm m-0">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.MESSAGE' | translate }}
            </p>
          </div>
        </div>
      }

      @if (validationErrors().length > 0) {
        <div
          role="alert"
          class="flex items-start gap-3 p-4 rounded-lg border border-red-300 bg-red-50 text-red-900"
        >
          <mat-icon class="text-red-600 shrink-0 mt-0.5">warning</mat-icon>
          <div class="flex flex-col gap-1">
            <span class="font-semibold text-sm">
              {{
                'TRIAL_EXECUTION.PLANNING_MODIFICATION.VALIDATION.PENDING_WARNING_COUNT'
                  | translate: { count: validationErrors().length }
              }}
            </span>
            <ul class="list-disc pl-5 m-0 text-sm space-y-0.5">
              @for (error of validationErrors(); track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        </div>
      }

      @if (errorMessage()) {
        <div
          role="alert"
          class="flex items-center gap-2 p-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm"
        >
          <mat-icon class="text-red-600 shrink-0">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <div class="flex-1 min-h-0 overflow-y-auto">
        <inta-modifications-table
          [modifications]="modifications()"
          [disabled]="hasPendingModifications() || isSaving()"
          (classificationChange)="classificationChange.emit($event)"
        />
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 shrink-0">
        <ui-save-button
          label="TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.SAVE_BTN"
          [isSaving]="isSaving()"
          [isDisabled]="!canSave() || hasPendingModifications()"
          (save)="saveChanges.emit()"
        />
      </div>
    </div>
  `,
})
export class PlanningModificationsTab {
  readonly modifications = input<ReadonlyArray<PlanningModificationRow>>([]);
  readonly validationErrors = input<ReadonlyArray<string>>([]);
  readonly hasPendingModifications = input<boolean>(false);
  readonly isSaving = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly canSave = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly classificationChange = output<ModificationClassificationChangeEvent>();
  readonly saveChanges = output<void>();
}
