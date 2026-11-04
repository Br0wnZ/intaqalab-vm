import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { MatButtonModule, MatIconModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';

@Component({
  selector: 'inta-confirm-delete-configuration-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, IntaIconComponent],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="text-gray-700">delete_forever</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      @if (data.description) {
        <p class="text-sm text-gray-700 mb-3" [innerHTML]="data.description"></p>
      }
      <p class="text-sm text-gray-900 leading-relaxed text-center" [innerHTML]="data.message"></p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button cdkFocusInitial (click)="onConfirm()">
        {{ data.confirmText || 'Confirmar' }}
      </button>
      <button mat-stroked-button (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteConfigurationDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteConfigurationDialog>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
