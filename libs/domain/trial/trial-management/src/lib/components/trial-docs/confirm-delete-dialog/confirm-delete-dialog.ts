import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { ConfirmDialogData } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';

import { TrialDocsService } from '../../../services/trial-docs-service';

type ConfirmDeleteDocDialogData = ConfirmDialogData & { trialId?: string; documentId?: string };

@Component({
  selector: 'inta-confirm-delete-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, IntaIconComponent],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="warning" size="xxl" />
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      @if (data.description) {
        <p class="text-sm text-gray-900 text-center mb-3" [innerHTML]="data.description"></p>
      }
      <p class="text-sm text-gray-900 text-center leading-relaxed" [innerHTML]="data.message"></p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-stroked-button [disabled]="deleteService.deleteDocumentResource.isLoading()" (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        cdkFocusInitial
        [disabled]="deleteService.deleteDocumentResource.isLoading()"
        (click)="onConfirm()"
      >
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent>);
  readonly data = inject<ConfirmDeleteDocDialogData>(MAT_DIALOG_DATA);
  protected readonly deleteService = inject(TrialDocsService);
  readonly #deleteConfirmed = signal(false);
  readonly #deleteInFlight = signal(false);

  constructor() {
    effect(() => {
      const status = this.deleteService.deleteDocumentResource.status();
      if (this.#deleteConfirmed()) {
        if (status === 'loading') {
          this.#deleteInFlight.set(true);
        }
        if (this.#deleteInFlight() && status === 'resolved') {
          this.deleteService.resetDelete();
          this.dialogRef.close(true);
        }
      }
    });
  }

  onConfirm(): void {
    if (!this.data.documentId) {
      this.dialogRef.close(true);
      return;
    }
    const fireTrialId = this.deleteService.fireTrialId();
    if (!fireTrialId) return;
    this.#deleteConfirmed.set(true);
    this.#deleteInFlight.set(false);
    this.deleteService.deleteDocument(fireTrialId, this.data.documentId);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
