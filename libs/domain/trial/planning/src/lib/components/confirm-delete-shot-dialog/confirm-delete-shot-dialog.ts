import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { MatButtonModule, MatIconModule } from '@intaqalab/theme';

import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import { IntaIconComponent } from "@intaqalab/ui";

@Component({
  selector: 'inta-confirm-delete-shot-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, IntaIconComponent],
  providers: [SeriesAndShotsStore],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="remove" size="xxl" />
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      @if (data.description) {
        <p class="text-sm text-gray-700 mb-3" [innerHTML]="data.description"></p>
      }
      <p class="text-sm text-gray-900 leading-relaxed text-center" [innerHTML]="data.message"></p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button cdkFocusInitial [disabled]="store.isDeletingShot()" (click)="onConfirm()">
        {{ data.confirmText || 'Confirmar' }}
      </button>
      <button mat-stroked-button [disabled]="store.isDeletingShot()" (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteShotDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteShotDialog>);
  readonly data = inject<ConfirmDialogData & { shotId: string }>(MAT_DIALOG_DATA);
  protected readonly store = inject(SeriesAndShotsStore);
  readonly #deleteConfirmed = signal(false);

  constructor() {
    effect(() => {
      const deleteStatus = this.store.deleteShotStatus();
      if (this.#deleteConfirmed() && deleteStatus === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  onConfirm(): void {
    this.#deleteConfirmed.set(true);
    this.store.deleteShot(this.data.shotId);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
