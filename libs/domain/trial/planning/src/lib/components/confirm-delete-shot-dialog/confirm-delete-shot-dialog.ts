import { Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { ConfirmDialogData } from '@intaqalab/models';
import { MatButtonModule, MatIconModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';

import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';

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
      <button
        mat-flat-button
        cdkFocusInitial
        [disabled]="!data.detectPlanningChanges && store.isDeletingShot()"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Confirmar' }}
      </button>
      <button
        mat-stroked-button
        [disabled]="!data.detectPlanningChanges && store.isDeletingShot()"
        (click)="onCancel()"
      >
        {{ data.cancelText || 'Cancelar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmDeleteShotDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteShotDialog>);
  readonly data = inject<ConfirmDialogData & { shotId: string; detectPlanningChanges?: boolean }>(MAT_DIALOG_DATA);
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
    if (this.data.detectPlanningChanges) {
      this.dialogRef.close(true);
      return;
    }
    this.#deleteConfirmed.set(true);
    this.store.deleteShot(this.data.shotId);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
