import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';

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
      <button mat-stroked-button [mat-dialog-close]="true">
        {{ 'MASTER_DATA.DIALOGS.SWITCH_STATUS.BUTTONS.SWITCH' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataSwitchStatusDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MasterDataSwitchStatusDialogComponent>);

  readonly dialog = inject<MasterDataSwitchStatusDialog>(MAT_DIALOG_DATA);
}
