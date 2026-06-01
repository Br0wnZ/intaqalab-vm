import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule, MatIconModule, MatInputModule } from '@intaqalab/theme';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MasterDataStanag } from '../../../../models/master-data-stanag.model';
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
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (data === null) {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE' | translate }}
      } @else {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div>
        <mat-form-field appearance="outline" class="w-full">
          <textarea
            matInput
            [formField]="form.description"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.DESCRIPTION' | translate"
          ></textarea>
        </mat-form-field>
      </div>

      <ui-inta-signal-select
        appearance="outline"
        [id]="'variable'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.variable"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.PLACEHOLDER' | translate"
        [options]="variableNamesList"
      />

      <div class="mt-4">
        <label for="numThreshold" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.STANAG.DIALOGS.UPSERT.NUM_THRESHOLD.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="numThreshold"
            matInput
            type="number"
            [formField]="form.numThreshold"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.NUM_THRESHOLD.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <ui-inta-signal-select
        appearance="outline"
        [id]="'measureUnit'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.measureUnit"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.MEASURE_UNIT.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.MEASURE_UNIT.PLACEHOLDER' | translate"
        [options]="measureUnitsList"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'calcType'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.calcType"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.PLACEHOLDER' | translate"
        [options]="calcTypeList"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'involvedLayers'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.involvedLayers"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.PLACEHOLDER' | translate"
        [options]="involvedLayersList"
      />

      <div>
        <label for="startLayer" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.STANAG.DIALOGS.UPSERT.START_LAYER.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="startLayer"
            matInput
            [formField]="form.startLayer"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.START_LAYER.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="endLayer" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.STANAG.DIALOGS.UPSERT.END_LAYER.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="endLayer"
            matInput
            [formField]="form.endLayer"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.END_LAYER.PLACEHOLDER' | translate"
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
export class StanagUpsertDialogComponent {
  readonly dialogRef = inject(MatDialogRef<StanagUpsertDialogComponent>);
  readonly data = inject<MasterDataStanag | null>(MAT_DIALOG_DATA);

  readonly variableNamesList = [
    { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Velocidad del viento' },
    { id: '550e8400-e29b-41d4-a716-446655440022', name: 'Dirección del viento' },
    { id: '550e8400-e29b-41d4-a716-446655440033', name: 'Temperatura' },
    { id: '550e8400-e29b-41d4-a716-446655440044', name: 'Presión' },
    { id: '550e8400-e29b-41d4-a716-446655440055', name: 'Densidad' },
  ];

  readonly measureUnitsList = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'm/s' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'grados' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Pascales' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'kg/m3' },
  ];

  readonly calcTypeList = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Valor único' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Diferencia entre capas' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Capas consecutivas' },
  ];

  readonly involvedLayersList = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Superficie' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Altura aproximada' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Flecha máxima' },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Entre dos alturas' },
  ];

  constructor() {
    effect(() => {
      if (!this.data) return;

      const data = this.data;

      if (data)
        this.formModel.set({
          ...data,
          variable: data.variable.id,
          measureUnit: data.measureUnit.id,
          calcType: data.measureUnit.id,
          involvedLayers: data.involvedLayers.id,
        });
    });
  }

  readonly defaultFormValues = {
    variable: '',
    description: '',
    numThreshold: 0,
    measureUnit: '',
    calcType: '',
    involvedLayers: '',
    startLayer: '0',
    endLayer: '0',
  };

  readonly formModel = signal<
    Omit<MasterDataUpsertDialogType<MasterDataStanag>, 'variable' | 'measureUnit' | 'calcType' | 'involvedLayers'> & {
      variable: string;
    } & { measureUnit: string } & { calcType: string } & { involvedLayers: string }
  >(this.defaultFormValues);

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.variable);
    required(schemaPath.description);
    required(schemaPath.numThreshold);
    required(schemaPath.measureUnit);
    required(schemaPath.calcType);
    required(schemaPath.involvedLayers);
    required(schemaPath.startLayer);
    required(schemaPath.endLayer);
  });

  protected sendData() {
    const { variable, description, numThreshold, measureUnit, calcType, involvedLayers, startLayer, endLayer } =
      this.formModel();

    const dataToSend =
      this.form().touched() && this.form().dirty()
        ? {
            ...this.data,
            variable,
            description,
            numThreshold,
            measureUnit,
            calcType,
            involvedLayers,
            startLayer,
            endLayer,
          }
        : null;

    this.dialogRef.close(dataToSend);
  }
}
