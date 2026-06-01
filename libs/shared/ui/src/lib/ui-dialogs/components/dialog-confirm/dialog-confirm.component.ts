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
import { TranslatePipe } from '@ngx-translate/core';

import { IntaIconComponent } from '../../../inta-icon/inta-icon.component';
import type { UIDialogConfirm } from '../../ui-dialog.model';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="alert" size="xxl" />
      {{ texts.title | translate }}
    </h2>
    <mat-dialog-content>
      <p>{{ texts.title2 | translate: { paramTitle2 } }}</p>
      @if (texts.description) {
        <p>{{ texts.description | translate }}</p>
      }
      @if (texts.htmlText) {
        <span [innerHTML]="texts.htmlText | translate"></span>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="center" class="bg-gray-50">
      <button mat-flat-button [mat-dialog-close]="true">
        {{ texts.labelButtonConfirm | translate }}
      </button>
      <button mat-stroked-button [mat-dialog-close]="false">
        {{ 'COMMONS.RETURN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [],
})
export class DialogConfirmComponent {
  readonly texts = inject<UIDialogConfirm>(MAT_DIALOG_DATA);
  paramTitle2 = this.texts.title2Param || '';
}
