import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import type {
  PlanningModificationBlockedDialogData,
  PlanningModificationBlockedDialogResult,
} from './client-modifications-dialog.models';

@Component({
  selector: 'inta-planning-modification-blocked-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2 text-lg font-bold text-gray-900 m-0">
      <mat-icon class="text-amber-600">block</mat-icon>
      <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.TITLE' | translate }}</span>
    </h2>

    <mat-dialog-content class="flex flex-col gap-3 !px-0 pt-2">
      <p class="text-sm text-gray-700 m-0">
        {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.MESSAGE' | translate }}
      </p>
    </mat-dialog-content>

    <mat-dialog-actions class="flex flex-wrap justify-end gap-2 !px-0 pt-4">
      <button mat-stroked-button type="button" (click)="close()">
        {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.CLOSE_BTN' | translate }}
      </button>
      @if (data?.allowViewPending !== false) {
        <button mat-flat-button color="primary" type="button" (click)="viewPending()">
          {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.VIEW_PENDING_BTN' | translate }}
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class PlanningModificationBlockedDialog {
  readonly data = inject<PlanningModificationBlockedDialogData>(MAT_DIALOG_DATA, { optional: true });
  readonly #dialogRef =
    inject<MatDialogRef<PlanningModificationBlockedDialog, PlanningModificationBlockedDialogResult>>(MatDialogRef);

  protected close(): void {
    this.#dialogRef.close({ action: 'close' });
  }

  protected viewPending(): void {
    this.#dialogRef.close({ action: 'viewPending' });
  }
}
