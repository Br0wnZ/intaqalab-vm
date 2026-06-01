import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

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
      <button mat-stroked-button [mat-dialog-close]="true">
        {{ 'MASTER_DATA.DIALOGS.DELETE.BUTTONS.REMOVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataRemoveDialogComponent {
  readonly dialog = inject<MasterDataRemoveDialog>(MAT_DIALOG_DATA);
}
