import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { IntaIconComponent } from '../../../inta-icon/inta-icon.component';
import type { UIDialogInput } from '../../ui-dialog.model';

@Component({
  imports: [
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
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
      <ui-inta-icon name="squareEdit" size="xxl" />
      {{ data.title | translate }}
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full">
        <textarea matInput [placeholder]="data.placeholder | translate" [(ngModel)]="text"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-flat-button [mat-dialog-close]="text()" [disabled]="text().trim().length === 0">
        {{ data.labelButtonConfirm | translate }}
      </button>
      <button mat-stroked-button [mat-dialog-close]="false">
        {{ data.labelCancel || 'COMMONS.RETURN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [],
})
export class DialogInputComponent {
  readonly dialogRef = inject(MatDialogRef<DialogInputComponent>);
  readonly data = inject<UIDialogInput>(MAT_DIALOG_DATA);
  readonly text = model(this.data.fieldText || '');
}
