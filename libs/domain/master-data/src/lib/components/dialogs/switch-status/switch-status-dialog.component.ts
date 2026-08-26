import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject } from '@angular/core';
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
import { SaveButton } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MasterDataStore } from '../../../+state/master-data.store';
import type { MasterDataSwitchStatusDialog } from '../../../models/master-data-switch-status-dialog.model';

@Component({
  imports: [
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    SaveButton,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>power_settings_new</mat-icon>
      {{ dialog.title | translate }}
    </h2>
    <mat-dialog-content>
      <p class="mb-4">{{ dialog.description | translate }}</p>
      <p [innerHTML]="'MASTER_DATA.DIALOGS.SWITCH_STATUS.INFO' | translate"></p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-flat-button [mat-dialog-close]="false">
        {{ 'MASTER_DATA.DIALOGS.SWITCH_STATUS.BUTTONS.CANCEL' | translate }}
      </button>
      <ui-save-button
        label="MASTER_DATA.DIALOGS.SWITCH_STATUS.BUTTONS.SWITCH"
        [isSaving]="store.isUpdating()"
        (save)="onConfirm()"
      />
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataSwitchStatusDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MasterDataSwitchStatusDialogComponent>);
  readonly dialog = inject<MasterDataSwitchStatusDialog>(MAT_DIALOG_DATA);
  protected readonly store = inject(MasterDataStore);

  constructor() {
    effect(() => {
      const hasBeenUpdate = this.store.updateStatus() === 'resolved';

      if (!hasBeenUpdate) return;

      this.store.resetSwitchStatus();

      this.dialogRef.close(true);
    });
  }

  protected onConfirm(): void {
    const { item } = this.dialog;
    this.store.update({ ...item, active: !item.active });
  }
}
