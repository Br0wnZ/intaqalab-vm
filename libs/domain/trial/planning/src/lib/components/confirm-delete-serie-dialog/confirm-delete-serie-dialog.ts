import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { MatButtonModule, MatIconModule } from '@intaqalab/theme';

import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';

@Component({
  selector: 'inta-confirm-delete-serie-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  providers: [SeriesAndShotsStore],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="text-gray-700">delete_forever</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      @if (data.description) {
        <p class="text-sm text-gray-900 text-center mb-3" [innerHTML]="data.description"></p>
      }
      <p class="text-sm text-gray-900 text-center leading-relaxed" [innerHTML]="data.message"></p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button cdkFocusInitial [disabled]="store.isDeletingSerie()" (click)="onConfirm()">
        {{ data.confirmText || 'Confirmar' }}
      </button>
      <button mat-stroked-button [disabled]="store.isDeletingSerie()" (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteSerieDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteSerieDialog>);
  readonly data = inject<ConfirmDialogData & { serieId: string }>(MAT_DIALOG_DATA);
  protected readonly store = inject(SeriesAndShotsStore);
  readonly #deleteConfirmed = signal(false);

  constructor() {
    effect(() => {
      const deleteStatus = this.store.deleteSerieStatus();
      if (this.#deleteConfirmed() && deleteStatus === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  onConfirm(): void {
    this.#deleteConfirmed.set(true);
    this.store.deleteSerie(this.data.serieId);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
