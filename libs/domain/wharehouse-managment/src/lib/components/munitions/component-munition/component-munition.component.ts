import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@intaqalab/theme';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { DenominationModel } from '../../../models/denominations.model';
import type { ComponentListMunitionForm } from '../../../models/munition-stock.model';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { getMunitionsPartitionedByCategory } from '../../../models/utils.model';

type RepositoryDenominations = Record<string, DenominationModel[]>;
@Component({
  selector: 'inta-component-munition',
  imports: [
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    IntaSignalSelectComponent,
    FormField,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatAutocompleteModule,
  ],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionType'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.munitionTypeId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_PLACEHOLDER' | translate"
          [options]="munitionTypes()"
          (valueChange)="onChangeMunitionTypeHandler()"
          (selectionChange)="munitionTypeChangeHandler()"
        />
        @if (touched() && form.munitionTypeId().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>
      <div>
        <label for="denomination" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.DENOMINATION_LABEL' | translate }}
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
            @for (option of filteredOptions(); track option) {
              <mat-option [value]="option">{{ option.name }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
        @if (touched() && (form.denominationId().disabled() || form.denominationId().errors().length)) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>
      <div>
        <label for="batch" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="batch"
            matInput
            [formField]="form.batch"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL' | translate"
          />
        </mat-form-field>
        @if (touched() && form.batch().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>

      @if (this.enterQuantity()) {
        <div>
          <label for="quantity" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="quantity"
              matInput
              type="number"
              [formField]="form.quantity"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate"
            />
          </mat-form-field>
          @if (touched() && form.quantity().errors()) {
            @for (error of form.quantity().errors(); track error) {
              @if (error.kind === 'required') {
                <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
              }
              @if (error.kind === 'min') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' | translate }}</mat-error>
              }
            }
          }
        </div>
      }
      @if (form.showUbication().controlValue()) {
        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionDumpId'"
          [valueKey]="'id'"
          [labelKey]="'munitionDumpId'"
          [formField]="form.munitionDumpId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_PLACEHOLDER' | translate"
          [options]="munitionsDumpList()"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'cellName'"
          [valueKey]="'id'"
          [labelKey]="'id'"
          [formField]="form.cellName"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_PLACEHOLDER' | translate"
          [options]="cellOptions()"
        />
      }
    </div>
    @if (this.enterUbications()) {
      <div class="grid-cols-12 mt-6">
        <mat-checkbox class="!text-gray-700" [formField]="form.showUbication">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SHOW_UBICATON_LABEL' | translate }}
        </mat-checkbox>
      </div>
    }
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentMunitionComponent {
  readonly #denominationStore = inject(DenominationsStore);
  readonly #munitionsDumpsStore = inject(MunitionsDumpsStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);

  enterUbications = input.required<boolean>();
  enterQuantity = input.required<boolean>();

  readonly munitionsDumpList = computed(() => this.#munitionsDumpsStore.items() as MunitionsDumpModel[]);
  readonly munitionTypes = computed(() =>
    getMunitionsPartitionedByCategory(this.#munitionComponentStore.items(), 'MUNITION_COMPONENT'),
  );

  displayFn(option: DenominationModel | string | null): string {
    if (option === null) {
      return '';
    } else if (typeof option === 'string') {
      return option;
    } else {
      return `${option.name}`;
    }
  }

  formModel = signal<ComponentListMunitionForm>({
    batch: '',
    denominationId: '',
    munitionTypeId: '',
    showUbication: false,
    cellName: '',
    munitionDumpId: '',
    quantity: 0,
  });

  form = form(this.formModel, (row) => {
    required(row.munitionTypeId);
    required(row.batch);
    required(row.quantity, { when: () => this.enterQuantity() });
    validate(row.quantity, ({ value }) => {
      const fieldValue = value();
      if (this.enterQuantity() && fieldValue <= 0) {
        return { kind: 'min' };
      }
      return null;
    });
    disabled(row.denominationId, ({ valueOf }) => !valueOf(row.munitionTypeId));
    validate(row.denominationId, ({ value }) => {
      if (typeof value() === 'string') {
        return { kind: 'not_selected', message: 'Seleccione' };
      }
      return null;
    });
  });

  readonly #repositoryDenominations = signal<RepositoryDenominations>({});

  onChangeMunitionTypeHandler() {
    this.form.denominationId().setControlValue('');
  }

  touched = signal(false); // munitiontypeId denominationId doesn't respond to markAsTouched.
  markAsTouched() {
    this.form.batch().markAsTouched();
    this.form.munitionDumpId().markAsTouched();
    this.form.denominationId().markAsTouched();
    this.form.cellName().markAsTouched();
    this.form.munitionDumpId().markAsTouched();
    this.form.quantity().markAsTouched();
    this.touched.set(true);
  }

  readonly #initialized: string[] = [];
  constructor() {
    effect(() => {
      const munitionTypeId = this.form.munitionTypeId().controlValue();
      if (!this.#initialized.includes(munitionTypeId) && munitionTypeId) {
        this.#initialized.push(munitionTypeId);
        this.#denominationStore.search({
          munitionTypeId,
          pageSize: 500,
          active: true,
        });
      }
    });

    effect(() => {
      const newData = this.#denominationStore.items();

      if (newData?.length) {
        const key = newData[0].munitionType.id.toLocaleLowerCase();
        this.#repositoryDenominations.update((repo) => ({
          ...repo,
          [key]: newData,
        }));
      }
    });
  }

  munitionTypeChangeHandler() {
    this.form.denominationId().setControlValue('');
  }

  readonly filteredOptions = computed<DenominationModel[]>(() => {
    const denominationValue = this.form.denominationId().controlValue();
    const munitionType = this.form.munitionTypeId().controlValue();

    if (typeof denominationValue !== 'string') {
      return [denominationValue];
    }

    if (denominationValue.length <= 2) return [];

    const denominations = this.#repositoryDenominations()[munitionType.toLocaleLowerCase()] ?? [];
    const criteria = denominationValue.toLocaleLowerCase();
    return denominations.filter((e) => e.name.toLocaleLowerCase().includes(criteria));
  });

  cellOptions = computed(() => {
    const result: { id: string }[] = [];
    const selected = this.form.munitionDumpId().controlValue();
    if (selected === '') {
      return result;
    }
    const records = this.munitionsDumpList();
    const munitionDump = records.find((e) => e.id === selected);
    if (munitionDump === undefined) {
      return result;
    } else {
      return munitionDump.cells.map((e) => ({ id: e.name }));
    }
  });

  value = computed(() => {
    const result = this.form().controlValue();
    return result;
  });

  errors = computed(() => {
    const size = this.form.length;
    for (let i = 0; i < size; i++) {
      const errorMunition = this.form.munitionTypeId().errors.length > 0;
      const errorDenomination = this.form.denominationId().errors.length > 0;
      const errorBatch = this.form.batch().errors.length > 0;
      if (errorBatch || errorMunition || errorDenomination) {
        return true;
      }
    }
    return false;
  });

  reset() {
    this.formModel.set({
      batch: '',
      denominationId: '',
      munitionTypeId: '',
      showUbication: false,
      cellName: '',
      munitionDumpId: '',
      quantity: 0,
    });
  }
}
