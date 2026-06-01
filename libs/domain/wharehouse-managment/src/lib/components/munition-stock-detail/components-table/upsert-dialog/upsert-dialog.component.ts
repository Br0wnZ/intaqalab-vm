import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { DenominationsStore } from '../../../../+state/denominations.store';
import type { DenominationModel } from '../../../../models/denominations.model';
import type { MunitionComponentsModel } from '../../../../models/munition-components.model';
import type { AssociatedComponent } from '../../../../models/munition-stock-detail.model';

type RepositoryDenominations = Record<string, DenominationModel[]>;
export interface EditForm {
  munitionTypeId: string; // COMPONENTE DE MUNICION
  denominationId: string | { id: string; name: string };
  batch: string;
}

export interface EditFormResult {
  munitionTypeId: string; // COMPONENTE DE MUNICION
  denominationId: { id: string; name: string };
  batch: string;
}
@Component({
  selector: 'inta-edit-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    IntaSignalSelectComponent,
    MatAutocompleteModule,
    IntaIconComponent,
  ],
  providers: [DenominationsStore],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (dialogData.item === undefined) {
        {{ 'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.ADD' | translate }}
      } @else {
        {{ 'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.EDIT' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <!-- <pre> {{ data | json }}</pre> -->

      @if (dialogData.item === undefined) {
        <div class="mb-4">
          <ui-inta-signal-select
            appearance="outline"
            [id]="'trial-category'"
            [valueKey]="'id'"
            [labelKey]="'label'"
            [formField]="form.munitionTypeId"
            [label]="'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.MUNITION_TYPE_LABEL' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.MUNITION_TYPE_PLACEHOLDER' | translate"
            [options]="dialogData.munitionTypeList"
            (selectionChange)="munitionTypeChangeHandler()"
          />
        </div>
      }
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.DENOMINATION_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="denomination"
            type="text"
            matInput
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_PLACEHOLDER' | translate"
            [formField]="form.denominationId"
            [matAutocomplete]="auto"
          />
          <mat-autocomplete [displayWith]="displayFn" #auto="matAutocomplete">
            @for (option of filteredOptions(); track option.id) {
              <mat-option [value]="option">{{ option.name }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </div>
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.BATCH_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="name"
            matInput
            [formField]="form.batch"
            [placeholder]="'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.BATCH_PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="!mt-4">
      <button
        mat-flat-button
        cdkFocusInitial
        class="disabled:!bg-gray-300"
        [disabled]="form().invalid()"
        (click)="onConfirm()"
      >
        {{ 'MODIFY_DOC_DIALOG.SAVE' | translate }}
      </button>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" (click)="onCancel()">
        {{ 'MODIFY_DOC_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 20px 24px !important;
    }

    mat-dialog-actions {
      background-color: #fafafa;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertDialogComponent {
  readonly #denominationsStore = inject(DenominationsStore);
  readonly dialogRef = inject(MatDialogRef);
  readonly dialogData = inject<{
    item?: AssociatedComponent;
    munitionTypeList: MunitionComponentsModel[];
  }>(MAT_DIALOG_DATA);

  readonly formModel = signal<EditForm>({
    batch: '',
    denominationId: '',
    munitionTypeId: '',
  });

  readonly form = form(this.formModel, (f) => {
    required(f.batch);
    required(f.denominationId);
    required(f.munitionTypeId);
  });

  readonly filteredOptions = computed(() => {
    const denominations = this.#denominationsStore.items();
    const munitionTypeIdValue = this.formModel().munitionTypeId;

    const denominationIdValue = this.formModel().denominationId;
    const denominationStringValue =
      typeof denominationIdValue === 'object' && 'id' in denominationIdValue
        ? denominationIdValue.name
        : denominationIdValue;

    if (!denominations || !munitionTypeIdValue || denominationStringValue.length <= 2) return;

    const filteredDenominationsByMunitionType = denominations.filter(
      (denomination) => denomination.munitionType.id === munitionTypeIdValue,
    );

    const filteredDenominations = filteredDenominationsByMunitionType.filter((denomination) =>
      denomination.name.toLocaleLowerCase().includes(denominationStringValue.toLowerCase()),
    );

    return filteredDenominations;
  });

  repositoryDenominations: RepositoryDenominations = {};
  initialized: string[] = [];
  constructor() {
    const item = this.dialogData.item;

    if (item) {
      this.formModel.set({
        batch: item.batch || '',
        munitionTypeId: item.munitionType.id || '',
        denominationId: item.denomination.id || '',
      });
    }

    effect(() => {
      const munitionTypeId = this.formModel().munitionTypeId;

      if (!this.initialized.includes(munitionTypeId)) {
        this.initialized.push(munitionTypeId);
        this.#denominationsStore.search({
          munitionTypeId,
          pageSize: 500,
          active: true,
        });
      }
    });

    effect(() => {
      const newData = this.#denominationsStore.items();

      if (!newData.length) {
        this.#denominationsStore.search({ pageSize: 500, active: true });
        return;
      }

      const key = newData[0].munitionType.id.toLocaleLowerCase();
      this.repositoryDenominations = {
        ...this.repositoryDenominations,
        [key]: newData,
      };
    });
  }

  displayFn(option: DenominationModel | string | null): string {
    if (!option) return '';

    return typeof option === 'string' ? option : option.name;
  }

  munitionTypeChangeHandler() {
    this.formModel().denominationId = '';
  }

  onConfirm() {
    this.dialogRef.close(this.formModel() as EditFormResult);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
