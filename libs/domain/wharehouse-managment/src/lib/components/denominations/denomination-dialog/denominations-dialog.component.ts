import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type {
  DenominationDialog,
  DenominationModel,
  DenominationsCategoryType,
  DenominationsCompatibilityType,
  DenominationsRiskGroupsType,
} from '../../../models/denominations.model';
import type { WarehouseMunitionCategoryType } from '../../../models/munition-components.model';
import { getMunitionsPartitionedByCategory } from '../../../models/utils.model';

interface DenominationForm {
  name: string;
  category: string;
  munitionTypeId: string; // COMPONENTE DE MUNICION
  neq: number;
  unNumber: string;
  riskGroups: string;
  compatibility: string;
  weight: number;
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
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
  ],
  providers: [MunitionComponentStore],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (dialogData.item === null) {
        {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.TITLE_CREATE' | translate }}
      } @else {
        {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.TITLE_EDIT' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div class="flex flex-col gap-4 pb-8">
        <div>
          <ui-inta-signal-select
            appearance="outline"
            [id]="'trial-category'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="form.category"
            [label]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.CATEGORY_LABEL' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.CATEGORY_PLACEHOLDER' | translate"
            [options]="categoryOptions"
          />
        </div>
        <div>
          <ui-inta-signal-select
            appearance="outline"
            [id]="'munitionType'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="form.munitionTypeId"
            [label]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.MUNITION_TYPE_LABEL' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.MUNITION_TYPE_PLACEHOLDER' | translate"
            [options]="munitionTypeOptions()"
          />
        </div>
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.DENOMINATION_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="name"
              matInput
              [formField]="form.name"
              [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.DENOMINATION_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <div>
          <label for="nominalWeight" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.NOMINAL_WEIGHT_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="nominalWeight"
              type="number"
              matInput
              libNoNegativeValues
              libLocalDecimal
              [formField]="form.weight"
              [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.NOMINAL_WEIGHT_PLACEHOLDER' | translate"
            />
          </mat-form-field>
          @if (form.weight().touched() && form.weight().errors()) {
            @for (error of form.weight().errors(); track error.kind) {
              <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="neq" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.NEQ_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="neq"
              type="number"
              matInput
              libNoNegativeValues
              libLocalDecimal
              [formField]="form.neq"
              [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.NEQ_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <div>
          <label for="onu" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.ONU_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="onu"
              matInput
              [formField]="form.unNumber"
              [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.ONU_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'riskGroups'"
          [valueKey]="'id'"
          [labelKey]="'id'"
          [formField]="form.riskGroups"
          [label]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.RISK_GROUP_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.RISK_GROUP_PLACEHOLDER' | translate"
          [options]="riskGroups"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'compatibility'"
          [valueKey]="'id'"
          [labelKey]="'id'"
          [formField]="form.compatibility"
          [label]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.COMPATIBILITY_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.COMPATIBILITY_PLACEHOLDER' | translate"
          [options]="compatibilities"
        />
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
export class DenominationsDialogComponent {
  readonly #dialogRef = inject(MatDialogRef);
  readonly dialogData = inject<DenominationDialog>(MAT_DIALOG_DATA);
  readonly #translate = inject(TranslateService);
  readonly #store = inject(MunitionComponentStore);

  readonly formModel = signal<DenominationForm>({
    name: '',
    category: '',
    compatibility: '',
    munitionTypeId: '',
    neq: 0,
    weight: 0,
    unNumber: '',
    riskGroups: '',
  });

  categoryOptions = [
    { id: 'MUNITION', label: this.#translate.instant('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION') },
    {
      id: 'MUNITION_COMPONENT',
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL.OPTION_MUNITION_COMPONENT'),
    },
  ];
  riskGroups = [{ id: '1.1' }, { id: '1.2' }, { id: '1.3' }, { id: '1.4' }, { id: '1.5' }, { id: '1.6' }];
  compatibilities = [
    { id: 'A' },
    { id: 'B' },
    { id: 'C' },
    { id: 'D' },
    { id: 'E' },
    { id: 'F' },
    { id: 'G' },
    { id: 'H' },
    { id: 'J' },
    { id: 'K' },
    { id: 'L' },
    { id: 'N' },
    { id: 'S' },
  ];

  munitionTypeOptions = computed(() => {
    const category = this.formModel().category as WarehouseMunitionCategoryType;
    const munitionComponentList = this.#store.items();
    const options = getMunitionsPartitionedByCategory(munitionComponentList, category);

    return options || [];
  });

  readonly form = form(this.formModel, (f) => {
    required(f.name);
    required(f.munitionTypeId);
    required(f.weight);
    min(f.weight, 0.1);
  });

  constructor() {
    this.#store.search({ pageSize: 100 });
    const item = this.dialogData.item;

    if (!item) return;

    this.formModel.set({
      name: item.name || '',
      munitionTypeId: item.munitionType?.id || '',
      category: item.category || '',
      neq: item.neq || 0,
      unNumber: item.unNumber || '',
      riskGroups: item.riskGroups || '',
      compatibility: item.compatibility || '',
      weight: item.weight || 0,
    });
  }

  onConfirm() {
    const formValue = this.formModel();
    const value: Partial<DenominationModel> = {
      name: formValue.name,
      active: this.dialogData.item === null ? true : this.dialogData.item.active,
      neq: formValue.neq,
      category: formValue.category as DenominationsCategoryType,
      id: this.dialogData.item?.id || '',
      munitionTypeId: formValue.munitionTypeId,
      weight: formValue.weight,
    };
    if (formValue.compatibility !== '') {
      value.compatibility = formValue.compatibility as DenominationsCompatibilityType;
    }
    if (formValue.riskGroups !== '') {
      value.riskGroups = formValue.riskGroups as DenominationsRiskGroupsType;
    }
    if (formValue.unNumber !== '') {
      value.unNumber = formValue.unNumber;
    }
    this.#dialogRef.close(value);
  }

  onCancel(): void {
    this.#dialogRef.close(false);
  }
}
