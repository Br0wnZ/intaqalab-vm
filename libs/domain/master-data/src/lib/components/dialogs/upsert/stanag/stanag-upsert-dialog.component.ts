import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MeasureUnitEnum, toUnitOptions } from '@intaqalab/models';
import { MatButtonModule, MatIconModule, MatInputModule } from '@intaqalab/theme';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { NoLeadingZerosDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    NoNegativeValuesDirective,
    NoLeadingZerosDirective,
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
            [formField]="form.numericThreshold"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.NUM_THRESHOLD.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <ui-inta-signal-select
        appearance="outline"
        [id]="'measureUnit'"
        [valueKey]="'value'"
        [labelKey]="'label'"
        [formField]="form.unit"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.MEASURE_UNIT.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.MEASURE_UNIT.PLACEHOLDER' | translate"
        [options]="measureUnitsList"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'calcType'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.calculationType"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.PLACEHOLDER' | translate"
        [options]="calcTypeList"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'involvedLayers'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.involvedLayer"
        [label]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.LABEL' | translate"
        [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.PLACEHOLDER' | translate"
        [options]="involvedLayersList()"
      />

      <div>
        <label for="startLayer" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.STANAG.DIALOGS.UPSERT.START_LAYER.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="startLayer"
            matInput
            type="number"
            libNoNegativeValues
            libNoLeadingZeros
            [formField]="form.startLayer"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.START_LAYER.PLACEHOLDER' | translate"
          />
        </mat-form-field>
        @if (form.calculationType().dirty() && form.startLayer().errors()) {
          @for (error of form.startLayer().errors(); track error.kind) {
            <mat-error>{{ error.message | translate }}</mat-error>
          }
        }
      </div>

      <div>
        <label for="endLayer" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.STANAG.DIALOGS.UPSERT.END_LAYER.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="endLayer"
            matInput
            type="number"
            libNoNegativeValues
            libNoLeadingZeros
            [formField]="form.endLayer"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.END_LAYER.PLACEHOLDER' | translate"
          />
        </mat-form-field>
        @if (form.calculationType().dirty() && form.endLayer().errors()) {
          @for (error of form.endLayer().errors(); track error.kind) {
            <mat-error>{{ error.message | translate }}</mat-error>
          }
        }
      </div>

      <div>
        <mat-form-field appearance="outline" class="w-full">
          <textarea
            matInput
            [formField]="form.name.es"
            [placeholder]="'MASTER_DATA.STANAG.DIALOGS.UPSERT.DESCRIPTION' | translate"
          ></textarea>
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
  readonly #translate = inject(TranslateService);

  readonly variableNamesList = [
    {
      id: 'WIND_DIRECTION',
      name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE.WIND_DIRECTION'),
    },
    { id: 'WIND_SPEED', name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE.WIND_SPEED') },
    {
      id: 'TEMPERATURE',
      name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE.TEMPERATURE'),
    },
    { id: 'PRESSURE', name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE.PRESSURE') },
    { id: 'DENSITY ', name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.VARIABLE.VALUE.DENSITY') },
  ];

  readonly measureUnitsList = toUnitOptions(Object.keys(MeasureUnitEnum) as MeasureUnitEnum[]);

  readonly calcTypeList = [
    {
      id: 'SINGLE_VALUE',
      name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.VALUE.SINGLE_VALUE'),
    },
    {
      id: 'LAYER_DIFFERENCE',
      name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.VALUE.LAYER_DIFFERENCE'),
    },
    {
      id: 'CONSECUTIVE_LAYERS',
      name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.CALC_TYPE.VALUE.CONSECUTIVE_LAYERS'),
    },
  ];

  readonly involvedLayersList = computed(() => {
    const options = [
      { id: 'SURFACE', name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE.SURFACE') },
      {
        id: 'APPROXIMATE_HEIGHT',
        name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE.APPROXIMATE_HEIGHT'),
      },
      {
        id: 'MAX_WIND_LEVEL',
        name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE.MAX_WIND_LEVEL'),
      },
      {
        id: 'CONSECUTIVE_LAYERS',
        name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE.CONSECUTIVE_LAYERS'),
      },
      {
        id: 'BETWEEN_TWO_HEIGHTS',
        name: this.#translate.instant('MASTER_DATA.STANAG.DIALOGS.UPSERT.INV_LAYERS.VALUE.BETWEEN_TWO_HEIGHTS'),
      },
    ];

    const calcType = this.formModel().calculationType;

    const filteredOptions: Record<string, { id: string; name: string }[]> = {
      SINGLE_VALUE: options.filter((item) => !['CONSECUTIVE_LAYERS', 'BETWEEN_TWO_HEIGHTS'].includes(item.id)),
      LAYER_DIFFERENCE: options.filter((item) => ['CONSECUTIVE_LAYERS', 'BETWEEN_TWO_HEIGHTS'].includes(item.id)),
      CONSECUTIVE_LAYERS: options.filter((item) => ['CONSECUTIVE_LAYERS', 'BETWEEN_TWO_HEIGHTS'].includes(item.id)),
    };

    return filteredOptions[calcType] ?? options;
  });

  constructor() {
    effect(() => {
      if (!this.data) return;

      const data = this.data;

      if (data)
        this.formModel.set({
          ...data,
        });
    });

    effect(() => {
      const involvedLayer = this.form.involvedLayer().value();
      const startLayer = this.form.startLayer().value();

      if (involvedLayer !== 'CONSECUTIVE_LAYERS' || (!startLayer && startLayer !== 0)) return;

      untracked(() => {
        this.formModel.update((current) => {
          return {
            ...current,
            endLayer: +startLayer + 1,
          };
        });
      });
    });
  }

  readonly defaultFormValues = {
    variable: '',
    name: { es: '', en: '' },
    numericThreshold: 0,
    unit: '',
    calculationType: '',
    involvedLayer: '',
    startLayer: null,
    endLayer: null,
  };

  readonly formModel = signal<Omit<MasterDataUpsertDialogType<MasterDataStanag>, 'id' | 'action'>>(
    this.defaultFormValues,
  );

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.variable);
    required(schemaPath.numericThreshold);
    required(schemaPath.unit);
    required(schemaPath.calculationType);
    required(schemaPath.involvedLayer);
    validate(schemaPath.startLayer, ({ value, valueOf }) => {
      const calculationType = valueOf(schemaPath.calculationType);
      const startLayerTouched = this.form.startLayer().touched();

      if (!calculationType || !startLayerTouched) return null;

      const startLayer = value();

      if (!startLayer && startLayer !== 0) return { kind: 'required', message: 'COMMONS.REQUIRED_FIELD' };

      const startLayerNumber = +startLayer!;
      const endLayer = valueOf(schemaPath.endLayer);

      if (endLayer === null) return;

      if (calculationType === 'SINGLE_VALUE' && startLayerNumber !== +endLayer) {
        return { kind: 'equal_layers', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.EQUAL_LAYERS' };
      }

      const involvedLayer = valueOf(schemaPath.involvedLayer);

      if (involvedLayer === 'BETWEEN_TWO_HEIGHTS' && startLayerNumber > +endLayer) {
        return { kind: 'greater_end_layer', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_END_LAYER' };
      }

      return null;
    });
    validate(schemaPath.endLayer, ({ value, valueOf }) => {
      const calculationType = valueOf(schemaPath.calculationType);
      const endLayerTouched = this.form.endLayer().touched();

      if (!calculationType || !endLayerTouched) return null;

      const endLayer = value();

      if (!endLayer && endLayer !== 0) return { kind: 'required', message: 'COMMONS.REQUIRED_FIELD' };

      const endLayerNumber = +endLayer!;
      const startLayer = valueOf(schemaPath.startLayer);

      if (startLayer === null) return;

      if (calculationType === 'SINGLE_VALUE' && endLayerNumber !== +startLayer) {
        return { kind: 'equal_layers', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.EQUAL_LAYERS' };
      }

      const involvedLayer = valueOf(schemaPath.involvedLayer);

      if (involvedLayer === 'BETWEEN_TWO_HEIGHTS' && endLayerNumber < +startLayer) {
        return { kind: 'greater_end_layer', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_END_LAYER' };
      }
      return null;
    });
  });

  protected sendData() {
    const { variable, name, numericThreshold, unit, calculationType, involvedLayer, startLayer, endLayer } =
      this.formModel();

    const dataToSend =
      this.form().touched() && this.form().dirty()
        ? {
            ...this.data,
            variable,
            name: { es: name.es, en: name.es },
            numericThreshold,
            unit,
            calculationType,
            involvedLayer,
            startLayer,
            endLayer,
          }
        : null;

    this.dialogRef.close(dataToSend);
  }
}
