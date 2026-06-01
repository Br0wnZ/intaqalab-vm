import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule, MatIconModule, MatInputModule } from '@intaqalab/theme';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MasterDataLoadingZone } from '../../../../models/master-data-loading-zone.model';
import type { MasterDataUpsertDialogType } from '../../../../models/utils.model';
//import { LoadingZoneDenominationsService } from '../../../../services/masters/loading-zone/denominations/loading-zone-denominations.service';

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
        [label]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.DENOMINATION.LABEL' | translate"
        [placeholder]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.DENOMINATION.PLACEHOLDER' | translate"
        [options]="mockedDenominationsList"
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

      <div>
        <label for="caliber" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.CALIBER.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="caliber"
            matInput
            [formField]="form.caliber"
            [placeholder]="'MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.CALIBER.PLACEHOLDER' | translate"
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
        (click)="sendData()"
      >
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingZoneUpsertDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LoadingZoneUpsertDialogComponent>);
  readonly data = inject<MasterDataLoadingZone | null>(MAT_DIALOG_DATA);

  // #loadingZoneDenominationsService = inject(LoadingZoneDenominationsService);

  constructor() {
    effect(() => {
      const data = this.data;

      if (data) this.formModel.set({ ...data, denominationId: data.denomination.id });
    });
  }

  readonly mockedDenominationsList = [
    { id: '550e8400-e29b-41d4-a716-446655440031', name: '105/51' },
    { id: '550e8400-e29b-41d4-a716-446655440032', name: 'M67' },
    { id: '550e8400-e29b-41d4-a716-446655440033', name: 'M200A1' },
    { id: '550e8400-e29b-41d4-a716-446655440034', name: 'M200A1' },
    { id: '550e8400-e29b-41d4-a716-446655440035', name: 'L45' },
    { id: '550e8400-e29b-41d4-a716-446655440036', name: 'L35' },
  ]

  // readonly getDenominationsList = computed(() => {
  //   const denominations = this.#loadingZoneDenominationsService.getDenominationsResponse.value();

  //   return denominations || [];
  // });

  readonly defaultFormValues = {
    denominationId: '',
    zone: '',
    caliber: '',
  };

  readonly formModel = signal<
    Omit<MasterDataUpsertDialogType<MasterDataLoadingZone>, 'denomination'> & { denominationId: string }
  >(this.defaultFormValues);

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.denominationId);
    required(schemaPath.zone);
  });

  protected sendData() {
    const { denominationId, caliber } = this.formModel();
    const zone = Array.isArray(this.formModel().zone) ? this.formModel().zone : this.formModel().zone?.split(',');

    const dataToSend = this.form().touched() && this.form().dirty()
      ? { ...this.data, denominationId, zone, caliber }
      : null

    this.dialogRef.close(dataToSend);
  }
}
