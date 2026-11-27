import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface ConfirmDiscardChangesDialogData {
  hasLocalChanges: boolean;
}

@Component({
  selector: 'inta-confirm-discard-changes',
  imports: [MatDialogModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.CLOSE_CONFIRM_TITLE' | translate }}</h2>
    <mat-dialog-content>
      <p class="m-0">{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.CLOSE_CONFIRM_MESSAGE' | translate }}</p>
      @if (data.hasLocalChanges) {
        <p class="mt-3 mb-0 text-amber-800">
          {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.LOCAL_CHANGES_DISCARD_WARNING' | translate }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" [mat-dialog-close]="false">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">
        {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.DISCARD_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDiscardChanges {
  protected readonly data = inject<ConfirmDiscardChangesDialogData>(MAT_DIALOG_DATA);
}
