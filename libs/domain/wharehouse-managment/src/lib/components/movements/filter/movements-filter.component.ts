import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, disabled, form, min, schema, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MovementsListStore } from '../../../+state/movements-list.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MovementListSearch } from '../../../models/movements.model';

type FilterForm = {
  dateTimeFrom: string | Date;
  timeFrom: string | Date;
  dateTimeTo: string | Date;
  timeTo: string | Date;
  movementTypes: string[];
  userId: string;
  originMunitionDumpIds: string[];
  destinationMunitionDumpIds: string[];
  quantityMin: number | null;
  quantityMax: number | null;
  affectedNeq: number;
  associatedFireTrialIds: string[];
};

@Component({
  selector: 'inta-movements-filter',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTimepickerModule,
    JsonPipe,
  ],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">{{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TITLE' | translate }}</h2>
    <div class="w-full bg-white rounded-lg border border-gray-200 rounded-b-none border-b-0">
      <div class="pl-6 pt-6 space-y-6">
        <h3 class="text-base font-medium text-gray-900">
          {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TITLE' | translate }}
        </h3>
      </div>
      <div class="p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div>
          <label for="dateTimeFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_FROM' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="dateTimeFrom"
              matInput
              [formField]="filterForm.dateTimeFrom"
              [matDatepicker]="pickerDateFrom"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_PLACEHOLDER' | translate"
              (click)="pickerDateFrom.open()"
              #dateTimeFrom
            />
            <mat-datepicker-toggle matIconSuffix [for]="pickerDateFrom"></mat-datepicker-toggle>
            <mat-datepicker (closed)="dateTimeFrom.blur()" #pickerDateFrom></mat-datepicker>
          </mat-form-field>
          @if (filterForm.dateTimeFrom().touched() && filterForm.dateTimeFrom().errors().length) {
            <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.DATE_TIME_INTERVAL_WRONG' | translate }}</mat-error>
          }
        </div>
        <div>
          <label for="timeFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.HOUR_FROM' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="timeFrom" matInput [formField]="filterForm.timeFrom" [matTimepicker]="timePickerFrom" />
            <mat-timepicker-toggle matIconSuffix [for]="timePickerFrom" />
            <mat-timepicker #timePickerFrom />
          </mat-form-field>
        </div>
        <div>
          <label for="dateTimeFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_TO' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="requested-date"
              matInput
              [formField]="filterForm.dateTimeTo"
              [matDatepicker]="pickerDateTo"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_PLACEHOLDER' | translate"
              (click)="pickerDateTo.open()"
              #dateTimeTo
            />
            <mat-datepicker-toggle matIconSuffix [for]="pickerDateTo"></mat-datepicker-toggle>
            <mat-datepicker (closed)="dateTimeTo.blur()" #pickerDateTo></mat-datepicker>
          </mat-form-field>
        </div>
        <div>
          <label for="dateTimeTo" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.HOUR_TO' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="dateTimeTo" matInput [formField]="filterForm.timeTo" [matTimepicker]="timePickerTo" />
            <mat-timepicker-toggle matIconSuffix [for]="timePickerTo" />
            <mat-timepicker #timePickerTo />
          </mat-form-field>
        </div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'client'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'label'"
          [formField]="filterForm.movementTypes"
          [label]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MOVEMENT_TYPE_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MOVEMENT_TYPE_PLACEHOLDER' | translate"
          [options]="movementTypesOptions"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'originMunitionDumpIds'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'munitionDumpId'"
          [formField]="filterForm.originMunitionDumpIds"
          [label]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_ORIGIN' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_ORIGIN' | translate"
          [options]="munitionDumpsStore.items()"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'destinationMunitionDumpIds'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'munitionDumpId'"
          [formField]="filterForm.destinationMunitionDumpIds"
          [label]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_DESTINATION' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_DESTINATION' | translate"
          [options]="munitionDumpsStore.items()"
        />
        <div>
          <label for="quantityMin" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.QUANTITY_MIN' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMin" type="number" matInput [formField]="filterForm.quantityMin" />
          </mat-form-field>
          @if (filterForm.quantityMin().touched() && filterForm.quantityMin().errors()) {
            @for (error of filterForm.quantityMin().errors(); track error) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="quantityMax" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.QUANTITY_MAX' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMax" type="number" matInput [formField]="filterForm.quantityMax" />
          </mat-form-field>
          @if (filterForm.quantityMax().touched() && filterForm.quantityMax().errors()) {
            @for (error of filterForm.quantityMax().errors(); track error) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="affectedNeq" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.NEQ_AFECTED' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="affectedNeq" type="number" matInput [formField]="filterForm.affectedNeq" />
          </mat-form-field>
        </div>
      </div>
      <div class="flex justify-end px-6 pb-6">
        <button
          mat-flat-button
          type="button"
          role="button"
          [disabled]="!(filterForm().dirty() && filterForm().errorSummary().length === 0)"
          (click)="search()"
        >
          {{ 'COMMONS.SEARCH' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
})
export class MovementsFilterComponent {
  readonly #movementsListStore = inject(MovementsListStore, { skipSelf: true });
  readonly munitionDumpsStore = inject(MunitionsDumpsStore);

  constructor() {
    this.munitionDumpsStore.search({});
  }

  #translate = inject(TranslateService);
  readonly formModel = signal<FilterForm>({
    affectedNeq: 0,
    associatedFireTrialIds: [],
    dateTimeFrom: '',
    timeFrom: '',
    dateTimeTo: '',
    timeTo: '',
    destinationMunitionDumpIds: [],
    movementTypes: [],
    originMunitionDumpIds: [],
    quantityMax: null,
    quantityMin: null,
    userId: '',
  });

  schemaForm = schema<FilterForm>((rootPath) => {
    min(rootPath.quantityMax, 0);
    min(rootPath.quantityMin, 0);
    disabled(rootPath.timeFrom, () => !this.formModel().dateTimeFrom);
    disabled(rootPath.timeTo, () => !this.formModel().dateTimeTo);
    validate(rootPath.quantityMin, ({ value, valueOf }) => {
      const quantityMin = value();
      if (quantityMin === null) {
        return null;
      }
      const quantityMinNumber = Number(quantityMin);

      if (quantityMinNumber < 0) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }
      const quantityMax = valueOf(rootPath.quantityMax);
      if (quantityMax !== null && quantityMin > Number(quantityMax)) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG' };
      }
      return null;
    });
    validate(rootPath.quantityMax, ({ value, valueOf }) => {
      const quantityMax = value();
      if (quantityMax === null) {
        return null;
      }
      if (quantityMax < 0) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }
      const quantityMin = valueOf(rootPath.quantityMin);
      if (quantityMin !== null && Number(quantityMin) > quantityMax) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG' };
      }
      return null;
    });
    validate(rootPath.dateTimeFrom, ({ value, valueOf }) => {
      const dateTimeFrom = value();
      const dateTimeTo = valueOf(rootPath.dateTimeTo);
      if (typeof dateTimeFrom === 'string' || typeof dateTimeTo === 'string') {
        return null;
      }

      const timeFrom = valueOf(rootPath.timeFrom);
      let initHours: number;
      let initMinutes: number;
      if (typeof timeFrom === 'string') {
        initHours = 0;
        initMinutes = 0;
      } else {
        initHours = timeFrom.getHours();
        initMinutes = timeFrom.getMinutes();
      }
      dateTimeFrom.setHours(initHours);
      dateTimeFrom.setMinutes(initMinutes);

      const timeTo = valueOf(rootPath.timeTo);
      let toHours: number;
      let toMinutes: number;
      if (typeof timeTo === 'string') {
        toHours = 0;
        toMinutes = 0;
      } else {
        toHours = timeTo.getHours();
        toMinutes = timeTo.getMinutes();
      }
      dateTimeTo.setHours(toHours);
      dateTimeTo.setMinutes(toMinutes);

      if (dateTimeFrom && dateTimeTo) {
        if (dateTimeFrom > dateTimeTo) {
          return { kind: 'invalid_date_interval' };
        }
      }

      return null;
    });
  });
  readonly filterForm = form(this.formModel, this.schemaForm);

  movementTypesOptions = [
    { id: 'TRANSFER', label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MOVEMENTS.MOVEMENT_TRANSFER') },
    { id: 'RETIRE', label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MOVEMENTS.MOVEMENT_RETIRE') },
  ];

  search() {
    const criteria: Record<string, string | number | string[] | Date | null> = this.formModel();
    const params: Record<string, string | number | string[]> = {};
    const timeOnlyKeys = ['timeFrom', 'timeTo'];

    (Object.keys(criteria) as Array<keyof MovementListSearch>).forEach((key) => {
      if (timeOnlyKeys.includes(key)) return;
      const value = criteria[key];

      if (!value || (Array.isArray(value) && !value.length)) return;

      params[key] = value instanceof Date ? this.#join(value, key) : value;
    });

    this.#movementsListStore.search(params as MovementListSearch);
  }

  #join(date: Date, key: string) {
    const time = key === 'dateTimeFrom' ? this.formModel().timeFrom : this.formModel().timeTo;

    if (time && typeof time === 'object') {
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
    }

    const isoDate = date.toISOString().replace('.000', '');
    return isoDate;
  }
}
