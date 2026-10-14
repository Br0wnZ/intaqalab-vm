import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

export type CancelExecutionDialogData = {
  trialName: string;
};

export type CancelExecutionDialogResult = { action: 'cancel'; reason: string } | { action: 'back' };

@Component({
  selector: 'inta-cancel-execution-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormField,
    TranslatePipe,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 m-0">
      <mat-icon class="text-red-500">cancel</mat-icon>
      {{ 'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.TEXT_PREFIX' | translate }}
        <strong>
          {{ 'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.TRIAL_NAME_PREFIX' | translate }} {{ data.trialName }}
        </strong>
      </p>

      <p class="text-sm text-red-600 text-center m-0 font-medium">
        {{ 'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.WARNING' | translate }}
      </p>

      <!-- Textarea -->
      <mat-form-field appearance="outline" class="w-full mt-2">
        <textarea
          matInput
          rows="4"
          [placeholder]="'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.REASON_PLACEHOLDER' | translate"
          [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.REASON_LABEL' | translate"
          [formField]="dialogForm.reason"
        ></textarea>
        @if (dialogForm.reason().touched() && dialogForm.reason().errors()) {
          @for (error of dialogForm.reason().errors(); track error) {
            <mat-error>{{ error.message }}</mat-error>
          }
        }
      </mat-form-field>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex flex-wrap !px-0">
      <button
        mat-flat-button
        color="warn"
        class="flex-1"
        [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.CONFIRM_BTN' | translate"
        [disabled]="dialogForm().invalid()"
        (click)="confirm()"
      >
        {{ 'TRIAL_EXECUTION.DIALOGS.CANCEL_EXECUTION.CONFIRM_BTN' | translate }}
      </button>
      <button
        mat-stroked-button
        [attr.aria-label]="'COMMONS.RETURN' | translate"
        [mat-dialog-close]="{ action: 'back' }"
      >
        {{ 'COMMONS.RETURN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelExecutionDialog {
  readonly #dialogRef = inject<MatDialogRef<CancelExecutionDialog, CancelExecutionDialogResult>>(MatDialogRef);

  readonly data = inject<CancelExecutionDialogData>(MAT_DIALOG_DATA);

  readonly formModel = signal({ reason: '' });

  readonly dialogForm = form(this.formModel, (f) => {
    required(f.reason);
  });

  confirm(): void {
    if (this.dialogForm().invalid()) {
      this.dialogForm().markAsTouched();
      return;
    }
    this.#dialogRef.close({ action: 'cancel', reason: this.formModel().reason });
  }
}
