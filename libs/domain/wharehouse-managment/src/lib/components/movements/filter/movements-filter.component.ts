import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
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
import { NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MovementsListStore } from '../../../+state/movements-list.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MovementListSearch } from '../../../models/movements.model';

type FilterForm = {
  dateTimeFrom: Date | null;
  timeFrom: Date | null;
  dateTimeTo: Date | null;
  timeTo: Date | null;
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
    NoNegativeValuesDirective,
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
              [formField]="form.dateTimeFrom"
              [matDatepicker]="pickerDateFrom"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_PLACEHOLDER' | translate"
              (click)="pickerDateFrom.open()"
              #dateTimeFrom
            />
            <mat-datepicker-toggle matIconSuffix [for]="pickerDateFrom"></mat-datepicker-toggle>
            <mat-datepicker (closed)="dateTimeFrom.blur()" #pickerDateFrom></mat-datepicker>
          </mat-form-field>
          @if (form.dateTimeFrom().touched() && form.dateTimeFrom().errors().length) {
            @for (error of form.dateTimeFrom().errors(); track error.kind) {
              @if (error.kind === 'invalid_date_interval') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.DATE_TIME_INTERVAL_WRONG' | translate }}</mat-error>
              }
            }
          }
        </div>
        <div>
          <label for="timeFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.HOUR_FROM' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="timeFrom" matInput [formField]="form.timeFrom" [matTimepicker]="timePickerFrom" />
            <mat-timepicker-toggle matIconSuffix [for]="timePickerFrom" />
            <mat-timepicker #timePickerFrom />
          </mat-form-field>
          @if (form.dateTimeFrom().dirty() && form.timeFrom().errors()) {
            @for (error of form.timeFrom().errors(); track error.kind) {
              @if (error.kind === 'invalid_hour_interval') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.DATE_TIME_INTERVAL_WRONG' | translate }}</mat-error>
              } @else {
                <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
              }
            }
          }
        </div>
        <div>
          <label for="dateTimeFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_TO' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="requested-date"
              matInput
              [formField]="form.dateTimeTo"
              [matDatepicker]="pickerDateTo"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.DATE_PLACEHOLDER' | translate"
              (click)="pickerDateTo.open()"
              #dateTimeTo
            />
            <mat-datepicker-toggle matIconSuffix [for]="pickerDateTo"></mat-datepicker-toggle>
            <mat-datepicker (closed)="dateTimeTo.blur()" #pickerDateTo></mat-datepicker>
          </mat-form-field>
          @if (form.dateTimeTo().touched() && form.dateTimeTo().errors().length) {
            @for (error of form.dateTimeTo().errors(); track error.kind) {
              @if (error.kind === 'invalid_date_interval') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.DATE_TIME_INTERVAL_WRONG' | translate }}</mat-error>
              }
            }
          }
        </div>
        <div>
          <label for="dateTimeTo" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.HOUR_TO' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="dateTimeTo" matInput [formField]="form.timeTo" [matTimepicker]="timePickerTo" />
            <mat-timepicker-toggle matIconSuffix [for]="timePickerTo" />
            <mat-timepicker #timePickerTo />
          </mat-form-field>
          @if (form.dateTimeTo().dirty() && form.timeTo().errors()) {
            @for (error of form.timeTo().errors(); track error.kind) {
              @if (error.kind === 'invalid_hour_interval') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.DATE_TIME_INTERVAL_WRONG' | translate }}</mat-error>
              } @else {
                <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
              }
            }
          }
        </div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'client'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'label'"
          [formField]="form.movementTypes"
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
          [formField]="form.originMunitionDumpIds"
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
          [formField]="form.destinationMunitionDumpIds"
          [label]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_DESTINATION' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.MUNITION_DUMP_DESTINATION' | translate"
          [options]="munitionDumpsStore.items()"
        />
        <div>
          <label for="quantityMin" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.QUANTITY_MIN' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMin" type="number" matInput libNoNegativeValues [formField]="form.quantityMin" />
          </mat-form-field>
          @if (form.quantityMin().touched() && form.quantityMin().errors()) {
            @for (error of form.quantityMin().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="quantityMax" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.QUANTITY_MAX' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMax" type="number" matInput libNoNegativeValues [formField]="form.quantityMax" />
          </mat-form-field>
          @if (form.quantityMax().touched() && form.quantityMax().errors()) {
            @for (error of form.quantityMax().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="affectedNeq" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.FILTER.NEQ_AFECTED' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="affectedNeq" type="number" matInput libNoNegativeValues [formField]="form.affectedNeq" />
          </mat-form-field>
        </div>
      </div>
      <div class="flex justify-end px-6 pb-6">
        <div>
          <button
            mat-stroked-button
            type="button"
            class="mr-4"
            [disabled]="formModel() === defaultFormValues"
            (click)="clearFilters()"
          >
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.CLEAN_FILTERS_BUTTON' | translate }}
          </button>
        </div>
        <button mat-flat-button type="button" role="button" [disabled]="form().invalid()" (click)="search()">
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
  readonly #translate = inject(TranslateService);
  readonly stockId = input.required<string>();

  constructor() {
    this.munitionDumpsStore.search({});

    effect(() => {
      const dateTimeFrom = this.form.dateTimeFrom().value();

      if (!dateTimeFrom) return;

      dateTimeFrom.setHours(0, 0);

      untracked(() => {
        this.formModel.update((current) => {
          return {
            ...current,
            timeFrom: dateTimeFrom,
          };
        });
      });
    });

    effect(() => {
      const dateTimeTo = this.form.dateTimeTo().value();

      if (!dateTimeTo) return;

      dateTimeTo.setHours(23, 30);

      untracked(() => {
        this.formModel.update((current) => {
          return {
            ...current,
            timeTo: dateTimeTo,
          };
        });
      });
    });
  }

  defaultFormValues = {
    affectedNeq: 0,
    associatedFireTrialIds: [],
    dateTimeFrom: null,
    timeFrom: null,
    dateTimeTo: null,
    timeTo: null,
    destinationMunitionDumpIds: [],
    movementTypes: [],
    originMunitionDumpIds: [],
    quantityMax: null,
    quantityMin: null,
    userId: '',
  };

  readonly formModel = signal<FilterForm>(this.defaultFormValues);

  form = form(this.formModel, (schemaPath) => {
    required(schemaPath.timeFrom, { when: () => !!this.formModel().dateTimeFrom });
    required(schemaPath.timeTo, { when: () => !!this.formModel().dateTimeTo });
    disabled(schemaPath.timeFrom, () => !this.formModel().dateTimeFrom);
    disabled(schemaPath.timeTo, () => !this.formModel().dateTimeTo);
    validate(schemaPath.quantityMax, ({ value, valueOf }) => {
      const quantityMax = value();

      if (quantityMax === null) return null;

      const quantityMaxNumber = +quantityMax;

      const quantityMin = valueOf(schemaPath.quantityMin);
      if (quantityMin !== null && +quantityMin > quantityMaxNumber) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG' };
      }
      return null;
    });
    validate(schemaPath.dateTimeFrom, ({ value, valueOf }) => {
      const dateTimeFrom = value();
      const dateTimeTo = valueOf(schemaPath.dateTimeTo);

      if (!dateTimeFrom || !dateTimeTo) return null;

      if (dateTimeFrom > dateTimeTo) return { kind: 'invalid_date_interval' };

      return null;
    });
    validate(schemaPath.dateTimeTo, ({ value, valueOf }) => {
      const dateTimeTo = value();
      const dateTimeFrom = valueOf(schemaPath.dateTimeFrom);

      if (!dateTimeFrom || !dateTimeTo) return null;

      if (dateTimeFrom > dateTimeTo) return { kind: 'invalid_date_interval' };

      return null;
    });
    validate(schemaPath.timeFrom, ({ value, valueOf }) => {
      const timeFrom = value();
      const timeTo = valueOf(schemaPath.dateTimeTo);
      const sameDay = valueOf(schemaPath.dateTimeFrom)?.toISOString() === valueOf(schemaPath.dateTimeTo)?.toISOString();

      if (!timeFrom || !timeTo || !sameDay) return null;

      if (this.form.timeTo().dirty() && timeFrom > timeTo) return { kind: 'invalid_hour_interval' };

      return null;
    });
    validate(schemaPath.timeTo, ({ value, valueOf }) => {
      const timeTo = value();
      const timeFrom = valueOf(schemaPath.timeFrom);
      const sameDay = valueOf(schemaPath.dateTimeFrom)?.toISOString() === valueOf(schemaPath.dateTimeTo)?.toISOString();

      if (!timeTo || !timeFrom || !sameDay) return null;

      if (timeFrom > timeTo) return { kind: 'invalid_hour_interval' };

      return null;
    });
  });

  movementTypesOptions = [
    { id: 'TRANSFER', label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MOVEMENTS.MOVEMENT_TRANSFER') },
    { id: 'RETIRE', label: this.#translate.instant('WHAREHOUSE_MANAGMENT.MOVEMENTS.MOVEMENT_RETIRE') },
  ];

  search() {
    const criteria: Record<string, string | number | string[] | Date | null> = this.formModel();
    const params: Record<string, string | number | string[]> = { stockId: this.stockId() };
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

  clearFilters() {
    this.#movementsListStore.search({ stockId: this.stockId() });

    this.formModel.set(this.defaultFormValues);
  }
}
