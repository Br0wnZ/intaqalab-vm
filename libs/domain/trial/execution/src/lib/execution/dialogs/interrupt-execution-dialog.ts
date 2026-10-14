import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

export type InterruptExecutionDialogData = {
  trialName: string;
};

export type InterruptExecutionDialogResult =
  { action: 'interrupt' | 'startCountDown'; reason: string } | { action: 'back' };

@Component({
  selector: 'inta-interrupt-execution-dialog',
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
      <mat-icon class="text-gray-600">schedule</mat-icon>
      {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.TEXT_PREFIX' | translate }}
        <strong>
          {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.TRIAL_NAME_PREFIX' | translate }} {{ data.trialName }}
        </strong>
      </p>

      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.DESCRIPTION' | translate }}
      </p>

      <!-- Textarea -->
      <mat-form-field appearance="outline" class="w-full mt-2">
        <textarea
          matInput
          rows="4"
          [placeholder]="'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.REASON_PLACEHOLDER' | translate"
          [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.REASON_LABEL' | translate"
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
        class="flex-1"
        [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.CONFIRM_BTN' | translate"
        [disabled]="dialogForm().invalid()"
        (click)="interrupt()"
      >
        {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.CONFIRM_BTN' | translate }}
      </button>

      <button
        mat-flat-button
        class="flex-1"
        [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.START_SECURITY_COUNT_BTN' | translate"
        [disabled]="dialogForm().invalid()"
        (click)="startCountDown()"
      >
        {{ 'TRIAL_EXECUTION.DIALOGS.INTERRUPT_EXECUTION.START_SECURITY_COUNT_BTN' | translate }}
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
export class InterruptExecutionDialog {
  readonly #dialogRef = inject<MatDialogRef<InterruptExecutionDialog, InterruptExecutionDialogResult>>(MatDialogRef);

  readonly data = inject<InterruptExecutionDialogData>(MAT_DIALOG_DATA);

  readonly formModel = signal({
    reason: '',
  });

  readonly dialogForm = form(this.formModel, (f) => {
    required(f.reason);
  });

  interrupt(): void {
    if (this.dialogForm().invalid()) {
      this.dialogForm().markAsTouched();
      return;
    }
    this.#dialogRef.close({ action: 'interrupt', reason: this.formModel().reason });
  }

  startCountDown(): void {
    if (this.dialogForm().invalid()) {
      this.dialogForm().markAsTouched();
      return;
    }
    this.#dialogRef.close({ action: 'startCountDown', reason: this.formModel().reason });
  }
}
