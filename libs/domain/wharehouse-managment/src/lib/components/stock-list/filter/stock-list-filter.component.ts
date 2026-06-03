import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, output, signal } from '@angular/core';
import { FormField, form, min, pattern, validate, validateHttp } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import type { SearchByTrialNumberResponse } from '../../../utils/search-trial.utils';
import { PLANNED_TRIAL_PATTERN } from '../../../utils/search-trial.utils';

type FilterForm = {
  clientIds: string[];
  plannedFireTrialIds: string;
  plannedFireTrialView: string;
  munitionTypeIds: string[];
  batch: string;
  munitionDumpIds: string[];
  status: string;
  entryDateFrom: Date | null;
  entryDateTo: Date | null;
  retirementDateFrom: Date | null;
  retirementDateTo: Date | null;
  quantityMin: number | null;
  quantityMax: number | null;
};

@Component({
  selector: 'inta-stock-list-filter',
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
  ],
  template: `
    <div class="w-full bg-white rounded-lg border border-gray-200">
      <div class="pl-6 pt-6 space-y-6">
        <h3 class="text-base font-medium text-gray-900">
          {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TITLE' | translate }}
        </h3>
      </div>
      <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'client'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'name'"
          [formField]="form.clientIds"
          [label]="'WHAREHOUSE_MANAGMENT.LINK.CLIENT_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.CLIENT_PLACEHOLDER' | translate"
          [options]="clientDataService.clients()"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'id'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'label'"
          [formField]="form.munitionTypeIds"
          [label]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_PLACEHOLDER' | translate"
          [options]="munitionComboOptions()"
        />

        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionDumpIds'"
          [valueKey]="'id'"
          [multiple]="true"
          [labelKey]="'munitionDumpId'"
          [formField]="form.munitionDumpIds"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.MUNITIONS_DUMP' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.MUNITIONS_DUMP' | translate"
          [options]="munitionDumpsStore.items()"
        />

        <ui-inta-signal-select
          appearance="outline"
          [id]="'status'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.status"
          [label]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.STATUS' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.STATUS' | translate"
          [options]="statusOptions"
        />

        <div>
          <label for="plannedFireTrialView" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="plannedFireTrialView"
              matInput
              [formField]="form.plannedFireTrialView"
              [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW' | translate"
            />
          </mat-form-field>
          @if (form.plannedFireTrialView().touched() && form.plannedFireTrialView().errors()) {
            @for (error of form.plannedFireTrialView().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>

        <div>
          <label for="entryDateFrom" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.ENTERING_DATE' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-date-range-input [rangePicker]="OnePicker">
              <input
                id="entryDateFrom"
                matStartDate
                [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.FROM' | translate"
                [formField]="form.entryDateFrom"
                (click)="OnePicker.open()"
                (keydown)="$event.preventDefault()"
                #entryDateFromStart
              />
              <input
                matEndDate
                [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.TO' | translate"
                [formField]="form.entryDateTo"
                (click)="OnePicker.open()"
                (keydown)="$event.preventDefault()"
              />
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="OnePicker"></mat-datepicker-toggle>
            <mat-date-range-picker (closed)="entryDateFromStart.blur()" #OnePicker></mat-date-range-picker>
          </mat-form-field>
          @if (form.entryDateFrom().errors()) {
            @for (error of form.entryDateFrom().errors(); track error.kind) {
              @if (error.kind === 'required_end_date') {
                <mat-error>{{ error.message | translate }}</mat-error>
              }
            }
          }
        </div>
        <div>
          <label for="retirementDateTo" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.EXIT_DATE' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-date-range-input [rangePicker]="TwoPicker">
              <input
                id="retirementDateTo"
                matStartDate
                [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.FROM' | translate"
                [formField]="form.retirementDateFrom"
                (click)="TwoPicker.open()"
                (keydown)="$event.preventDefault()"
                #retirementDateToStart
              />
              <input
                matEndDate
                [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.TO' | translate"
                [formField]="form.retirementDateTo"
                (click)="TwoPicker.open()"
                (keydown)="$event.preventDefault()"
              />
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="TwoPicker"></mat-datepicker-toggle>
            <mat-date-range-picker (closed)="retirementDateToStart.blur()" #TwoPicker></mat-date-range-picker>
          </mat-form-field>
          @if (form.retirementDateFrom().errors()) {
            @for (error of form.retirementDateFrom().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="quantityMin" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.QUANTITY_MIN' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMin" type="number" matInput [formField]="form.quantityMin" />
          </mat-form-field>
          @if (form.quantityMin().touched() && form.quantityMin().errors()) {
            @for (error of form.quantityMin().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
        <div>
          <label for="quantityMax" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.QUANTITY_MAX' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input id="quantityMax" type="number" matInput [formField]="form.quantityMax" />
          </mat-form-field>
          @if (form.quantityMax().touched() && form.quantityMax().errors()) {
            @for (error of form.quantityMax().errors(); track error.kind) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
      </div>

      <div class="w-full flex justify-end mb-4 pr-4">
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

        <div>
          <button
            mat-flat-button
            type="button"
            role="button"
            [disabled]="!(form().dirty() && form().errorSummary().length === 0)"
            (click)="search()"
          >
            {{ 'COMMONS.SEARCH' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
})
export class StockListFilterComponent {
  store = inject(StockListStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);
  readonly munitionDumpsStore = inject(MunitionsDumpsStore);
  readonly clientDataService = inject(ClientsDataService);
  readonly #translate = inject(TranslateService);
  readonly filtersData = output<MunitionStockListSearch>();

  constructor() {
    this.#munitionComponentStore.search({ pageSize: 100 });
  }

  readonly defaultFormValues = {
    clientIds: [],
    batch: '',
    munitionDumpIds: [],
    munitionTypeIds: [],
    plannedFireTrialIds: '',
    plannedFireTrialView: '',
    status: '',
    entryDateFrom: null,
    entryDateTo: null,
    retirementDateFrom: null,
    retirementDateTo: null,
    quantityMax: null,
    quantityMin: null,
  };

  readonly formModel = signal<FilterForm>(this.defaultFormValues);

  urlTrialSearch = injectFireTrialsEndpoint();

  readonly form = form(this.formModel, (schemaPath) => {
    min(schemaPath.quantityMax, 0);
    min(schemaPath.quantityMin, 0);
    validate(schemaPath.quantityMin, ({ value, valueOf }) => {
      const quantityMin = value();
      if (quantityMin === null) {
        return null;
      }
      const quantityMinNumber = Number(quantityMin);

      if (quantityMinNumber < 0) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }
      const quantityMax = valueOf(schemaPath.quantityMax);
      if (quantityMax !== null && quantityMin > Number(quantityMax)) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG' };
      }
      return null;
    });
    validate(schemaPath.quantityMax, ({ value, valueOf }) => {
      const quantityMax = value();
      if (quantityMax === null) {
        return null;
      }
      if (quantityMax < 0) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }
      const quantityMin = valueOf(schemaPath.quantityMin);
      if (quantityMin !== null && Number(quantityMin) > quantityMax) {
        return { kind: 'positive', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG' };
      }
      return null;
    });
    pattern(schemaPath.plannedFireTrialView, PLANNED_TRIAL_PATTERN);
    validateHttp(schemaPath.plannedFireTrialView, {
      request: ({ value }) => {
        if (!value()) return undefined;
        return {
          url: this.urlTrialSearch,
          params: { trialNumber: value() },
        };
      },
      onSuccess: (response: SearchByTrialNumberResponse) => {
        if (response.items.length > 0) {
          this.form.plannedFireTrialIds().setControlValue(response.items[0].id);
          return null;
        }
        return {
          kind: 'trialNotFound',
          message: 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND',
        };
      },
      onError: () => ({
        kind: 'networkError',
        message: 'Could not verify existance of trial',
      }),
    });
    validate(schemaPath.entryDateFrom, ({ value, valueOf }) => {
      const startDate = value();
      const endDate = valueOf(schemaPath.entryDateTo);

      const startDateFilled = startDate instanceof Date;
      const endDateFilled = endDate instanceof Date;

      if (startDateFilled && !endDateFilled)
        return { kind: 'required_end_date', message: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.DATE_ERROR' };

      return null;
    });
    validate(schemaPath.retirementDateFrom, ({ value, valueOf }) => {
      const startDate = value();
      const endDate = valueOf(schemaPath.retirementDateTo);

      const startDateFilled = startDate instanceof Date;
      const endDateFilled = endDate instanceof Date;

      if (startDateFilled && !endDateFilled)
        return { kind: 'required_end_date', message: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.DATE_ERROR' };

      const entryStartDate = valueOf(schemaPath.entryDateFrom);
      const entryEndDate = valueOf(schemaPath.entryDateTo);

      const entryDatesFilled = entryStartDate instanceof Date && entryEndDate instanceof Date;
      const retirementDatesFilled = startDateFilled && endDateFilled;

      if (entryDatesFilled && retirementDatesFilled && startDate < entryStartDate)
        return {
          kind: 'retirement_start_date_higher_than_entry',
          message: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.RETIREMENT_FROM_HIGHER_THAN_ENTRY_ERROR',
        };

      if (entryDatesFilled && retirementDatesFilled && endDate < entryEndDate)
        return {
          kind: 'retirement_end_date_higher_than_entry',
          message: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.RETIREMENT_TO_HIGHER_THAN_ENTRY_ERROR',
        };

      return null;
    });
  });

  statusOptions = [
    {
      id: 'AVAILABLE',
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.STOCK_LIST.STATUS_AVAILABLE'),
    },
    {
      id: 'RETIRED',
      label: this.#translate.instant('WHAREHOUSE_MANAGMENT.STOCK_LIST.STATUS_RETIRE'),
    },
  ];

  munitionComboOptions = computed(() => {
    const munitionComponentList = this.#munitionComponentStore.items();

    return (munitionComponentList || []).filter((item) => item.category === 'MUNITION_COMPONENT');
  });

  search() {
    const criteria: Record<string, string | number | string[] | Date | null> = this.formModel();
    const params: Record<string, string | string[] | number> = {};

    Object.keys(criteria).forEach((key) => {
      const value = criteria[key];

      if (!value || (Array.isArray(value) && !value.length) || key === 'plannedFireTrialView') return;

      params[key as keyof MunitionStockListSearch] = value instanceof Date ? format(value, 'yyyy-MM-dd') : value;
    });

    this.store.search(params as MunitionStockListSearch);
    this.filtersData.emit(params as MunitionStockListSearch);
  }

  protected clearFilters() {
    this.store.search({});

    this.formModel.set(this.defaultFormValues);
  }
}
