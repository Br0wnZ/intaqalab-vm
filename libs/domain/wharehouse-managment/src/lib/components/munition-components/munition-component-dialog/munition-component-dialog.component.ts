import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type {
  MunitionComponentsModel,
  MunitionDialog,
  MunitionDialogOutput,
} from '../../../models/munition-components.model';

interface MunitionComponentsDialogForm {
  nameEs: string;
  nameEn: string;
  observations: string;
  category: string;
}
@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (data.item === null) {
        {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.TITLE_CREATE' | translate }}
      } @else {
        {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.TITLE_EDIT' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div class="flex flex-col gap-4 pb-8">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.NAME_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="name"
              matInput
              [formField]="form.nameEs"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.NAME_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <div>
          <label for="nameEn" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.NAME_EN_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="nameEn"
              matInput
              [formField]="form.nameEn"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.NAME_EN_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <div>
          <ui-inta-signal-select
            appearance="outline"
            [id]="'cellcount'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="form.category"
            [label]="'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.CATEGORY' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.CATEGORY_PLACEHOLDER' | translate"
            [options]="categoryOptions"
          />
        </div>
        <div>
          <label for="observations" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.OBSERVATIONS_PLACEHOLDER' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <textarea
              id="observations"
              matInput
              [formField]="form.observations"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL.OBSERVATIONS_PLACEHOLDER' | translate"
            ></textarea>
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button cdkFocusInitial [disabled]="form().invalid()" (click)="onConfirm()">
        {{ 'MODIFY_DOC_DIALOG.SAVE' | translate }}
      </button>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" (click)="onCancel()">
        {{ 'MODIFY_DOC_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionComponentDialogComponent {
  readonly dialogRef = inject(MatDialogRef);
  readonly data = inject<MunitionDialog>(MAT_DIALOG_DATA);

  readonly formModel = signal<MunitionComponentsDialogForm>({
    nameEs: '',
    nameEn: '',
    observations: '',
    category: 'MUNITION_COMPONENT',
  });

  readonly #translate = inject(TranslateService);
  categoryOptions = [
    {
      id: 'MUNITION',
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MUNITION'),
    },
    {
      id: 'MUNITION_COMPONENT',
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MUNITION_COMPONENT'),
    },
  ];
  readonly form = form(this.formModel, (f) => {
    required(f.nameEs);
    required(f.nameEn);
  });

  constructor() {
    if (this.data.item !== null) {
      this.form.nameEs().setControlValue(this.data.item.name.es);
      this.form.nameEn().setControlValue(this.data.item.name.en);
      this.form.observations().setControlValue(this.data.item.observations || '');
    }
  }

  onConfirm() {
    const { observations, nameEn, nameEs, category } = this.formModel();
    const item: MunitionDialogOutput = {
      id: this.data.item?.id,
      category: category as MunitionComponentsModel['category'],
      name: {
        en: nameEn,
        es: nameEs,
      },
      observations,
    };

    this.dialogRef.close(item);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
