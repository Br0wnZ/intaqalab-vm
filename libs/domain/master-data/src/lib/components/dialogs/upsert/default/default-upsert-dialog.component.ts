import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MasterDataDefault } from '../../../../models/master-data-default.model';

@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" [size]="24" />
      @if (data === null) {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE' | translate }}
      } @else {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_ES.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="name"
            matInput
            [formField]="form.nameEs"
            [placeholder]="'MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_ES.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="nameEn" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_EN.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="nameEn"
            matInput
            [formField]="form.nameEn"
            [placeholder]="'MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_EN.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" [matDialogClose]="false">
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL' | translate }}
      </button>
      <button
        mat-raised-button
        cdkFocusInitial
        class="!bg-purple-600 hover:bg-purple-700 cursor-pointer !text-white disabled:!bg-gray-300 "
        [disabled]="form().invalid()"
        (click)="onConfirm()"
      >
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataDefaultUpsertDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MasterDataDefaultUpsertDialogComponent>);
  readonly data = inject<MasterDataDefault | null>(MAT_DIALOG_DATA);

  readonly formModel = signal<{
    nameEs: string;
    nameEn: string;
  }>({
    nameEs: '',
    nameEn: '',
  });

  readonly form = form(this.formModel, (f) => {
    required(f.nameEs);
    required(f.nameEn);
  });

  constructor() {
    if (this.data !== null) {
      this.formModel.set({
        nameEs: this.data.name.es,
        nameEn: this.data.name.en,
      });
    }
  }

  onConfirm() {
    const { nameEn, nameEs } = this.formModel();

    const dataToSend = this.form().touched() && this.form().dirty()
      ? { ...this.data, name: { en: nameEn, es: nameEs } }
      : null

    this.dialogRef.close(dataToSend);
  }
}
