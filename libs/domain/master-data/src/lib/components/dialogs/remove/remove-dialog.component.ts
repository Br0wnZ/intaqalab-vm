import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IntaIconComponent, SaveButton } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import { MasterDataStore } from '../../../+state/master-data.store';
import type { MasterDataRemoveDialog } from '../../../models/master-data-remove-dialog.model';

@Component({
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    TranslatePipe,
    IntaIconComponent,
    SaveButton,
  ],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="remove" size="xxl" />
      <span>{{ dialog.title | translate }}</span>
    </h2>
    <mat-dialog-content>
      <p>{{ dialog.description | translate }}</p>
      <p class="flex justify-center font-bold">{{ 'MASTER_DATA.DIALOGS.DELETE.CONFIRMATION' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-flat-button [mat-dialog-close]="false">
        {{ 'MASTER_DATA.DIALOGS.DELETE.BUTTONS.CANCEL' | translate }}
      </button>
      <ui-save-button
        label="MASTER_DATA.DIALOGS.DELETE.BUTTONS.REMOVE"
        [isSaving]="store.isDeleting()"
        (save)="onConfirm()"
      />
    </mat-dialog-actions>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataRemoveDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MasterDataRemoveDialogComponent>);
  readonly dialog = inject<MasterDataRemoveDialog>(MAT_DIALOG_DATA);
  protected readonly store = inject(MasterDataStore);

  constructor() {
    effect(() => {
      const hasBeenDeleted = this.store.deleteStatus() === 'resolved';

      if (!hasBeenDeleted) return;

      this.store.resetDelete();

      this.dialogRef.close(true);
    });
  }

  protected onConfirm(): void {
    this.store.delete(this.dialog.data.id);
  }
}
