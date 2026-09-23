import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MeasureUnitEnum, toUnitOptions } from '@intaqalab/models';
import { MatButtonModule, MatIconModule, MatInputModule } from '@intaqalab/theme';
import { InputSelect, InputSelectInput, IntaSignalSelectComponent, SaveButton } from '@intaqalab/ui';
import { NoNegativeValuesDirective } from '@intaqalab/utils';
import type { DenominationsStoreType } from '@intaqalab/warehouse-management';
import { DenominationsStore } from '@intaqalab/warehouse-management';
import { TranslateModule } from '@ngx-translate/core';

import { MasterDataStore } from '../../../../+state/master-data.store';
import { LOADING_ZONE_UPSERT_DENOMINATION_FILTER } from '../../../../data/loading-zone.constants';
import type { MasterDataLoadingZone } from '../../../../models/master-data-loading-zone.model';
import type { MasterDataUpsertDialogType } from '../../../../models/utils.model';

@Component({
  imports: [
    IntaSignalSelectComponent,
    FormField,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    SaveButton,
    InputSelect,
    InputSelectInput,
    NoNegativeValuesDirective,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <mat-icon class="text-gray-700">edit</mat-icon>
      @if (data === null) {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE' | translate }}
      } @else {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <ui-inta-signal-select
        appearance="outline"
        [id]="'denomination'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.denominationId"
        [searchable]="true"
        [label]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.DENOMINATION.LABEL' | translate"
        [placeholder]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.DENOMINATION.PLACEHOLDER' | translate"
        [options]="denominationsStore.items() || []"
      />

      <div>
        <label for="zones" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.ZONE.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="zones"
            matInput
            [formField]="form.zone"
            [placeholder]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.ZONE.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <ui-input-select
        placeholder="0"
        [label]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.CALIBER.LABEL' | translate"
        [opciones]="caliberUnitOptions"
        [showLabel]="false"
        [value]="{
          value: formModel().caliber?.toString() ?? '',
          unit: formModel().caliberUnit,
        }"
        (valueChange)="onCaliberUnitChanges($event)"
      >
        <input type="number" inputSelectInput libNoNegativeValues [formField]="form.caliber" />
      </ui-input-select>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" [matDialogClose]="false">
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL' | translate }}
      </button>
      <ui-save-button
        label="MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE"
        [isDisabled]="form().invalid()"
        [isSaving]="store.isMutating()"
        (save)="sendData()"
      />
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingZoneUpsertDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LoadingZoneUpsertDialogComponent>);
  readonly data = inject<MasterDataLoadingZone | null>(MAT_DIALOG_DATA);
  readonly store = inject(MasterDataStore);
  readonly denominationsStore: DenominationsStoreType = inject(DenominationsStore);
  readonly caliberUnitOptions = toUnitOptions([MeasureUnitEnum.MM, MeasureUnitEnum.INCH]);

  protected onCaliberUnitChanges(value: { value: string; unit: string } | null) {
    if (!value || (value.unit !== MeasureUnitEnum.MM && value.unit !== MeasureUnitEnum.INCH)) return;

    this.formModel.update((formValue) => ({ ...formValue, caliberUnit: value.unit }));
  }

  constructor() {
    this.denominationsStore.search({ active: true, munitionTypeId: LOADING_ZONE_UPSERT_DENOMINATION_FILTER });

    effect(() => {
      const data = this.data;

      if (data) this.formModel.set({ ...data, denominationId: data.denomination.id });
    });

    effect(() => {
      const hasBeenSaved = this.store.saveStatus() === 'resolved';
      const hasBeenUpdated = this.store.updateStatus() === 'resolved';

      if (!hasBeenSaved && !hasBeenUpdated) return;

      this.store.resetUpsert();

      this.dialogRef.close(true);
    });
  }

  readonly defaultFormValues = {
    denominationId: '',
    zone: '',
    caliber: null,
    caliberUnit: MeasureUnitEnum.MM,
  };

  readonly formModel = signal<
    Omit<MasterDataUpsertDialogType<MasterDataLoadingZone>, 'denomination' | 'caliber'> & {
      denominationId: string;
      caliber: number | null;
    }
  >(this.defaultFormValues);

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.denominationId);
    required(schemaPath.zone);
  });

  protected sendData() {
    const { denominationId, caliber, caliberUnit } = this.formModel();
    const zone = Array.isArray(this.formModel().zone) ? this.formModel().zone : this.formModel().zone?.split(',');
    const payload = { ...this.data, denominationId, zone, caliber, ...(caliber && { caliberUnit }) };

    if (!this.data) {
      this.store.create({ ...payload, active: true });
    } else {
      this.store.update(payload as MasterDataLoadingZone);
    }
  }
}
