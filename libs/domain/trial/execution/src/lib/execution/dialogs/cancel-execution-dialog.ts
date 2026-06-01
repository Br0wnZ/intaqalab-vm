import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export type CancelExecutionDialogData = {
  trialName: string;
};

export type CancelExecutionDialogResult = { action: 'cancel'; reason: string } | { action: 'back' };

@Component({
  selector: 'inta-cancel-execution-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormField],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 m-0">
      <mat-icon class="text-red-500">cancel</mat-icon>
      Cancelar prueba de fuego
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-700 text-center m-0">
        Vas a cancelar definitivamente la
        <strong>prueba: {{ data.trialName }}</strong>
      </p>

      <p class="text-sm text-red-600 text-center m-0 font-medium">
        Esta acción cerrará el ensayo por incidencia insalvable y no podrá reanudarse.
      </p>

      <!-- Textarea -->
      <mat-form-field appearance="outline" class="w-full mt-2">
        <textarea
          placeholder="Escribe el motivo de la cancelación"
          matInput
          rows="4"
          aria-label="Motivo de la cancelación"
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
        aria-label="Confirmar cancelación"
        class="flex-1"
        [disabled]="dialogForm().invalid()"
        (click)="confirm()"
      >
        Confirmar cancelación
      </button>
      <button mat-stroked-button aria-label="Volver" [mat-dialog-close]="{ action: 'back' }">Volver</button>
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
