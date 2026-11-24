import { Component, ViewEncapsulation, computed, effect, inject, output, signal, untracked } from '@angular/core';
import { FormField, FormRoot, form, pattern, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ClientsDataService } from '@intaqalab/data-access';
import { IntaSignalSelectComponent, NumericRangeInput, ValueTooltip } from '@intaqalab/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListFilterForm, MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import { PLANNED_TRIAL_PATTERN, injectTrialSearch, trialSearchError } from '../../../utils/search-trial.utils';

@Component({
  selector: 'inta-stock-list-filter',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
    FormField,
    FormRoot,
    IntaSignalSelectComponent,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatDatepickerModule,
    NumericRangeInput,
    ValueTooltip,
  ],
  template: `
    <div class="w-full bg-white rounded-lg border border-gray-200">
      <div class="pl-6 pt-6 space-y-6">
        <h3 class="text-base font-medium text-gray-900">
          {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TITLE' | translate }}
        </h3>
      </div>
      <form [formRoot]="form">
        <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ui-inta-signal-select
            appearance="outline"
            [id]="'client'"
            [valueKey]="'id'"
            [multiple]="true"
            [labelKey]="'name'"
            [formField]="form.clientIds"
            [searchable]="true"
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
            [searchable]="true"
            [label]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_LABEL' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_PLACEHOLDER' | translate"
            [options]="munitionComponentStore.items()"
          />

          <ui-inta-signal-select
            uiValueTooltip
            appearance="outline"
            [id]="'denominationIds'"
            [valueKey]="'id'"
            [multiple]="true"
            [labelKey]="'name'"
            [formField]="form.denominationIds"
            [searchable]="true"
            [label]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_DENOMINATION' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_DENOMINATION' | translate"
            [options]="denominationsStore.items()"
            [uiValueTooltipValue]="selectedDenominationNames()"
          />

          <div>
            <label for="batches" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_BATCH' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="batches" matInput [formField]="form.batches" />
            </mat-form-field>
          </div>

          <ui-inta-signal-select
            appearance="outline"
            [id]="'munitionDumpIds'"
            [valueKey]="'id'"
            [multiple]="true"
            [labelKey]="'munitionDumpId'"
            [formField]="form.munitionDumpIds"
            [searchable]="true"
            [label]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.MUNITIONS_DUMP' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.MUNITIONS_DUMP' | translate"
            [options]="munitionDumpsStore.items()"
          />

          <ui-inta-signal-select
            appearance="outline"
            [id]="'cellNames'"
            [valueKey]="'name'"
            [multiple]="true"
            [labelKey]="'name'"
            [formField]="form.cellNames"
            [searchable]="true"
            [label]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_CELL_NAME' | translate"
            [placeholder]="'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_CELL_NAME' | translate"
            [options]="cellOptions()"
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
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.QUANTITY' | translate }}
            </label>
            <ui-numeric-range-input [formField]="form.quantity" />
          </div>

          <div>
            <label for="batches" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_BATCH' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input id="batches" matInput [formField]="form.batches" />
            </mat-form-field>
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
              type="submit"
              [disabled]="!(form().dirty() && form().errorSummary().length === 0) || trialSearchLoading()"
            >
              {{ 'COMMONS.SEARCH' | translate }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: `
    inta-stock-list-filter ui-numeric-range-input > div > div {
      border-radius: 8px !important;
      border-color: var(--inta-neutral-300) !important;
      height: 44px !important;
    }
    inta-stock-list-filter ui-numeric-range-input > div > div:hover {
      border-color: var(--inta-neutral-400) !important;
    }
    inta-stock-list-filter ui-numeric-range-input > div > div:focus-within {
      border-color: var(--inta-button) !important;
      border-width: 2px !important;
      box-shadow: none !important;
      outline: none !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  providers: [provideNativeDateAdapter()],
})
export class StockListFilterComponent {
  store = inject(StockListStore);
  readonly munitionComponentStore = inject(MunitionComponentStore);
  readonly munitionDumpsStore = inject(MunitionsDumpsStore);
  readonly denominationsStore = inject(DenominationsStore);
  readonly clientDataService = inject(ClientsDataService);
  readonly #translate = inject(TranslateService);

  readonly filtersData = output<MunitionStockListSearch>();

  readonly cellOptions = computed(() =>
    [...new Set(this.munitionDumpsStore.items().flatMap((dump) => dump.cells?.map((cell) => cell.name)))].map(
      (name) => ({ name }),
    ),
  );

  constructor() {
    this.munitionComponentStore.search({ pageSize: 100, active: true });
    this.denominationsStore.search({ pageSize: 500, active: true });
    effect(() => {
      const trialId = this.#trialSearch.hasValue() ? (this.#trialSearch.value().items[0]?.id ?? '') : '';
      if (untracked(() => this.formModel().plannedFireTrialIds) !== trialId) {
        this.form.plannedFireTrialIds().controlValue.set(trialId);
      }
    });
  }

  readonly defaultFormValues = {
    clientIds: [],
    denominationIds: [],
    munitionDumpIds: [],
    cellNames: [],
    munitionTypeIds: [],
    plannedFireTrialIds: '',
    plannedFireTrialView: '',
    entryDateFrom: null,
    entryDateTo: null,
    retirementDateFrom: null,
    retirementDateTo: null,
    quantity: { min: null, max: null },
    batches: '',
  };

  readonly formModel = signal<MunitionStockListFilterForm>(this.defaultFormValues);
  readonly #trialSearch = injectTrialSearch(computed(() => this.formModel().plannedFireTrialView));
  protected readonly trialSearchLoading = this.#trialSearch.isLoading;

  readonly selectedDenominationNames = computed(() => {
    const selectedIds = this.formModel().denominationIds;
    return this.denominationsStore
      .items()
      .filter((denomination) => selectedIds.includes(denomination.id))
      .map((denomination) => denomination.name)
      .join(', ');
  });

  readonly form = form(
    this.formModel,
    (schemaPath) => {
      validate(schemaPath.quantity, ({ value }) => {
        const { min, max } = value();

        if (!min && !max) return null;

        const numMin = min ? +min : null;
        const numMax = max ? +max : null;

        if (numMin && numMin < 0)
          return {
            kind: 'min_greater_than_zero',
            message: this.#translate.instant('WHAREHOUSE_MANAGMENT.VALIDATIONS.MIN_GREATER_THAN_ZERO'),
          };

        if (numMax && numMax < 0)
          return {
            kind: 'max_greater_than_zero',
            message: this.#translate.instant('WHAREHOUSE_MANAGMENT.VALIDATIONS.MAX_GREATER_THAN_ZERO'),
          };

        if (numMin && numMax && numMin > numMax)
          return {
            kind: 'wrong_interval',
            message: this.#translate.instant('WHAREHOUSE_MANAGMENT.VALIDATIONS.NUMERIC_INTERVAL_WRONG'),
          };

        return null;
      });
      pattern(schemaPath.plannedFireTrialView, PLANNED_TRIAL_PATTERN);
      validate(schemaPath.plannedFireTrialView, () => trialSearchError(this.#trialSearch));
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
    },
    {
      submission: {
        action: async () => {
          this.search();
        },
      },
    },
  );

  search() {
    const criteria = this.formModel();

    this.filtersData.emit(this.#castFilterFormIntoListSearch(criteria));
  }

  #castFilterFormIntoListSearch(criteria: MunitionStockListFilterForm) {
    const search = <MunitionStockListSearch>{
      clientIds: criteria.clientIds,
      denominationIds: criteria.denominationIds,
      batches: criteria.batches,
      plannedFireTrialIds: criteria.plannedFireTrialIds.length ? [criteria.plannedFireTrialIds] : '',
      munitionTypeIds: criteria.munitionTypeIds,
      munitionDumpIds: criteria.munitionDumpIds,
      cellNames: criteria.cellNames,
      quantityMin: criteria.quantity.min,
      quantityMax: criteria.quantity.max,
      entryDateFrom: criteria.entryDateFrom ? format(criteria.entryDateFrom, 'yyyy-MM-dd') : null,
      entryDateTo: criteria.entryDateTo ? format(criteria.entryDateTo, 'yyyy-MM-dd') : null,
      retirementDateFrom: criteria.retirementDateFrom ? format(criteria.retirementDateFrom, 'yyyy-MM-dd') : null,
      retirementDateTo: criteria.retirementDateTo ? format(criteria.retirementDateTo, 'yyyy-MM-dd') : null,
    };

    const hasValue = (value: unknown) => (Array.isArray(value) ? value.length > 0 : value);
    const result = Object.fromEntries(Object.entries(search).filter(([, v]) => hasValue(v))) as MunitionStockListSearch;

    return result;
  }

  protected clearFilters() {
    this.formModel.set(this.defaultFormValues);

    this.filtersData.emit({});
  }
}
