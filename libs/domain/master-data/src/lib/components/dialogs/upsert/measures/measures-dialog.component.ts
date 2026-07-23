import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MeasureUnitEnum, toUnitOptions } from '@intaqalab/models';
import { MatButtonModule, MatIconModule, MatInputModule } from '@intaqalab/theme';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MEASUREMENTS_AND_RECORDS_UNITS } from '../../../../data/measures.constants';
import {
  type MasterDataMeasures,
  type MeasureQualitativeValue,
  type MeasurementsAndRecordsQualificationType,
  injectMeasuresEquipments,
} from '../../../../models/master-data-measures.model';

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
    MatRadioModule,
    MatExpansionModule,
    MatCheckbox,
    MatSelectModule,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
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
      <div class="mb-4">
        <label for="unit" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNIT.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-select
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNIT.PLACEHOLDER' | translate"
            [formField]="form.unit"
          >
            @for (opt of unitOptions; track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
      <div>
        <label for="measurementAreaCode" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MEASUREMENT_AREA_CODE.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="measurementAreaCode"
            matInput
            [formField]="form.measurementAreaCode"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MEASUREMENT_AREA_CODE.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="magnitudeCode" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_CODE.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="magnitudeCode"
            matInput
            [formField]="form.magnitudeCode"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_CODE.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="magnitude" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_ES.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="magnitude"
            matInput
            [formField]="form.magnitude.es"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_ES.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="magnitude" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_EN.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="magnitude"
            matInput
            [formField]="form.magnitude.en"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAGNITUDE_EN.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="procedure" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.PROCEDURE_ES.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="procedure"
            matInput
            [formField]="form.procedure.es"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.PROCEDURE_ES.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <div>
        <label for="procedure" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.PROCEDURE_EN.LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="procedure"
            matInput
            [formField]="form.procedure.en"
            [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.PROCEDURE_EN.PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
      <ui-inta-signal-select
        appearance="outline"
        [id]="'qualificationType'"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [formField]="form.qualificationType"
        [label]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.QUALIFICATION_TYPE.TITLE' | translate"
        [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.QUALIFICATION_TYPE.PLACEHOLDER' | translate"
        [options]="qualificationTypeList"
      />
      @if (formModel().qualificationType === 'QUANTITATIVE') {
        <ui-inta-signal-select
          appearance="outline"
          [id]="'measureUnit'"
          [valueKey]="'value'"
          [labelKey]="'label'"
          [formField]="form.measureUnit!"
          [label]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MEASURE_UNIT.LABEL' | translate"
          [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MEASURE_UNIT.PLACEHOLDER' | translate"
          [options]="measureUnitsList"
        />

        <div>
          <label for="minValue" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MIN_VALUE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="minValue"
              type="number"
              matInput
              libLocalDecimal
              [formField]="form.minValue!"
              [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MIN_VALUE.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        <div>
          <label for="maxValue" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAX_VALUE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="maxValue"
              type="number"
              matInput
              libLocalDecimal
              [formField]="form.maxValue!"
              [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.MAX_VALUE.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        <div>
          <label for="uncertainty" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="uncertainty"
              type="number"
              matInput
              libNoNegativeValues
              libLocalDecimal
              min="0"
              [formField]="form.uncertainty!"
              [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.UNCERTAINTY.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
      } @else if (formModel().qualificationType === 'QUALITATIVE') {
        <div class="flex flex-col items-center gap-4 mt-4 border border-gray-200 rounded-lg p-4 pt-1">
          <div class="w-full flex justify-between items-center border-b border-gray-200">
            <span class="block text-center text-sm font-medium text-gray-700">
              {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.TITLE' | translate }}
            </span>
            <button
              type="button"
              class="flex items-center gap-2 bg-[var(--inta-button)] hover:bg-[var(--inta-button-hover)] cursor-pointer text-white px-1 py-1 rounded-lg font-thin mb-1"
              (click)="onAddValueRow(); $event.stopPropagation()"
            >
              <mat-icon class="text-white">add</mat-icon>
            </button>
          </div>
          @for (value of form.values; track $index; let valueIdx = $index) {
            <mat-expansion-panel class="w-full !rounded-none !shadow-none !-mt-1">
              <!-- Value Header -->
              <mat-expansion-panel-header
                class="!h-14 !bg-gray-200 [&>.mat-content]:border-b [&>.mat-content]:border-gray-700 [&>.mat-content]:-mr-3 [&>.mat-content]:pb-2"
              >
                <span class="text-sm font-semibold text-gray-900">
                  {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.SUBTITLE' | translate: { index: valueIdx + 1 } }}
                </span>
              </mat-expansion-panel-header>

              <!-- Value Content -->
              <div>
                <label for="value-name-es" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.NAME_ES.LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full">
                  <input
                    id="value-name-es"
                    matInput
                    [formField]="form.values[valueIdx].name.es"
                    [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.NAME_ES.PLACEHOLDER' | translate"
                  />
                </mat-form-field>
              </div>
              <div>
                <label for="value-name-en" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.NAME_EN.LABEL' | translate }}
                </label>
                <mat-form-field appearance="outline" class="w-full">
                  <input
                    id="value-name-en"
                    matInput
                    [formField]="form.values[valueIdx].name.en"
                    [placeholder]="'MASTER_DATA.MEASURES.DIALOGS.UPSERT.VALUES.NAME_EN.PLACEHOLDER' | translate"
                  />
                </mat-form-field>
              </div>
            </mat-expansion-panel>
          }
          @if (form.values().dirty() && form.values().errors()) {
            @for (error of form.values().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
      }

      @for (equipmentType of form.equipmentTypes; track $index; let equipmentTypeIdx = $index) {
        <div class="mb-4">
          <label for="unit" class="block text-sm font-medium text-gray-700 mb-2">
            {{
              'MASTER_DATA.MEASURES.DIALOGS.UPSERT.EQUIPMENT_TYPES.LABEL' | translate: { index: equipmentTypeIdx + 1 }
            }}
          </label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select
              [placeholder]="
                'MASTER_DATA.MEASURES.DIALOGS.UPSERT.EQUIPMENT_TYPES.LABEL' | translate: { index: equipmentTypeIdx + 1 }
              "
              [formField]="form.equipmentTypes[equipmentTypeIdx]"
            >
              @for (opt of equipmentOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label | translate }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      }

      <mat-checkbox
        data-testid="conditioning-checkbox"
        class="!text-gray-700"
        [checked]="formModel().accreditation"
        (change)="accreditationValueChanges()"
      >
        {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.ACCREDITATION' | translate }}
      </mat-checkbox>

      @if (formModel().qualificationType === 'QUANTITATIVE') {
        <mat-checkbox
          data-testid="conditioning-checkbox"
          class="!text-gray-700"
          [checked]="formModel().grubbs"
          (change)="grubbsValueChanges()"
        >
          {{ 'MASTER_DATA.MEASURES.DIALOGS.UPSERT.GRUBBS' | translate }}
        </mat-checkbox>
      }
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
export class MeasurementsAndRecordsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MeasurementsAndRecordsDialogComponent>);
  readonly data = inject<MasterDataMeasures | null>(MAT_DIALOG_DATA);
  readonly #translate = inject(TranslateService);

  constructor() {
    effect(() => {
      const data = this.data;

      if (data) this.formModel.set(data);
    });
  }

  readonly unitOptions = MEASUREMENTS_AND_RECORDS_UNITS;

  readonly qualificationTypeList = [
    {
      id: 'QUANTITATIVE',
      name: this.#translate.instant('MASTER_DATA.MEASURES.DIALOGS.UPSERT.QUALIFICATION_TYPE.VALUES.QUANTITATIVE'),
    },
    {
      id: 'QUALITATIVE',
      name: this.#translate.instant('MASTER_DATA.MEASURES.DIALOGS.UPSERT.QUALIFICATION_TYPE.VALUES.QUALITATIVE'),
    },
  ];

  readonly measureUnitsList = toUnitOptions(Object.keys(MeasureUnitEnum) as MeasureUnitEnum[]);

  readonly equipmentOptions = injectMeasuresEquipments();

  readonly defaultFormValues = {
    unit: '',
    measurementAreaCode: '',
    magnitudeCode: '',
    magnitude: { es: '', en: '' },
    procedure: { es: '', en: '' },
    qualificationType: '' as MeasurementsAndRecordsQualificationType,
    measureUnit: '', // QUANTITATIVE
    minValue: 0, // QUANTITATIVE
    maxValue: 0, // QUANTITATIVE
    uncertainty: '', // QUANTITATIVE
    values: [
      // QUALITATIVE
      {
        code: '',
        name: { es: '', en: '' },
        active: true,
      },
    ],
    equipmentTypes: Array(3).fill(''),
    accreditation: false,
    grubbs: false, // QUANTITATIVE
  };

  readonly formModel = signal<MasterDataMeasures>(this.defaultFormValues);

  readonly #isQuantitative = () => this.formModel().qualificationType === 'QUANTITATIVE';

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.unit);
    disabled(schemaPath.unit, () => this.data !== null);
    required(schemaPath.measurementAreaCode);
    disabled(schemaPath.measurementAreaCode, () => this.data !== null);
    required(schemaPath.magnitudeCode);
    disabled(schemaPath.magnitudeCode, () => this.data !== null);
    required(schemaPath.magnitude.es);
    required(schemaPath.magnitude.en);
    required(schemaPath.qualificationType);
    required(schemaPath.measureUnit, { when: () => this.#isQuantitative() });
    required(schemaPath.minValue, { when: () => this.#isQuantitative() });
    required(schemaPath.maxValue, { when: () => this.#isQuantitative() });
    required(schemaPath.uncertainty, { when: () => this.#isQuantitative() });
    validate(schemaPath.values, ({ value }) => {
      if (this.#isQuantitative()) return null;

      const values = value();

      const notFullFilled = values.some((value) => {
        const hasEs = !!value.name.es?.trim();
        const hasEn = !!value.name.en?.trim();
        return !hasEs && !hasEn;
      });

      if (notFullFilled) return { kind: 'required', message: 'COMMONS.REQUIRED_FIELD' };

      const hasIncompleteValues = values.some((value) => {
        const hasEs = !!value.name.es?.trim();
        const hasEn = !!value.name.en?.trim();
        return (hasEs && !hasEn) || (!hasEs && hasEn);
      });

      return hasIncompleteValues
        ? { kind: 'namesIncomplete', message: 'MASTER_DATA.MEASURES.VALIDATION.BOTH_FIELDS' }
        : null;
    });
    disabled(schemaPath.values, () => this.data !== null);
  });

  protected sendData() {
    const form = this.formModel();

    if (!form.qualificationType) return;

    const keysToExclude = {
      QUALITATIVE: ['measureUnit', 'minValue', 'maxValue', 'grubbs', 'uncertainty'],
      QUANTITATIVE: ['values'],
    };

    const excludedKeys = keysToExclude[form.qualificationType];

    const dataToSend: Record<string, unknown> = {};

    Object.entries(form).forEach(([key, value]) => {
      if (excludedKeys.includes(key)) return;

      const specialOptionsToCast: Record<string, (value: unknown) => unknown> = {
        values: (value: unknown) =>
          (value as MeasureQualitativeValue[])
            .filter((v) => v.name.en)
            .map((v) => ({ ...v, code: this.#castToValueCode(v.name.en) })),
        equipmentTypes: (value: unknown) =>
          (value as string[]).length && (value as string[])[0] ? (value as string[]).filter((v) => v) : null,
      };

      dataToSend[key as keyof MasterDataMeasures] =
        key in specialOptionsToCast ? specialOptionsToCast[key as string](value) : value;

      // REMOVE WITH NEW API
      if (form.qualificationType === 'QUALITATIVE') {
        dataToSend['uncertainty' as keyof MasterDataMeasures] = 'string';
        dataToSend['grubbs' as keyof MasterDataMeasures] = false;
      }
    });

    this.dialogRef.close(dataToSend);
  }

  #castToValueCode(nameEn: string) {
    return nameEn
      .toUpperCase()
      .replace(/[-\s]+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onAddValueRow(): void {
    const emptyElement = { code: '', name: { es: '', en: '' }, active: true };
    this.formModel.update((model) => ({
      ...model,
      values: [...model.values, emptyElement],
    }));
  }

  accreditationValueChanges() {
    this.formModel.update((model) => ({
      ...model,
      accreditation: !model.accreditation,
    }));
  }

  grubbsValueChanges() {
    this.formModel.update((model) => ({
      ...model,
      grubbs: !model.grubbs,
    }));
  }
}
