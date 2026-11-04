import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export type PauseExecutionDialogData = {
  trialName: string;
};

export type PauseExecutionDialogResult = { action: 'pause' } | { action: 'back' };

@Component({
  selector: 'inta-pause-execution-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 m-0">
      <mat-icon class="text-gray-600">pause</mat-icon>
      {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TRIAL_NAME_PREFIX' | translate }}
        <strong>{{ data.trialName }}</strong>
      </p>

      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.DESCRIPTION' | translate }}
      </p>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex gap-2 !px-0 justify-end">
      <button
        mat-stroked-button
        [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CANCEL' | translate"
        [mat-dialog-close]="{ action: 'back' }"
      >
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CANCEL' | translate }}
      </button>

      <button
        mat-flat-button
        color="primary"
        [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CONFIRM' | translate"
        (click)="pause()"
      >
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PauseExecutionDialog {
  readonly #dialogRef = inject<MatDialogRef<PauseExecutionDialog, PauseExecutionDialogResult>>(MatDialogRef);

  readonly data = inject<PauseExecutionDialogData>(MAT_DIALOG_DATA);

  pause(): void {
    this.#dialogRef.close({ action: 'pause' });
  }
}
