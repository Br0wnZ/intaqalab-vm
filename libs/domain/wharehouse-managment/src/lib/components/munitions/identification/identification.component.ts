import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, disabled, form, min, required, validate } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { DenominationsStore } from '../../../+state/denominations.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type { DenominationModel } from '../../../models/denominations.model';
import type { MunitionComponentsModel } from '../../../models/munition-components.model';
import type { MunitionIdentificationForm } from '../../../models/munition-stock.model';

type RepositoryDenominations = Record<string, DenominationModel[]>;

@Component({
  selector: 'inta-munition-identification',
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
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
          [options]="munitionTypeOptions()"
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
      <div>
        <label for="quantity" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input id="quantity" type="number" matInput [formField]="form.quantity" />
        </mat-form-field>
        @if (touched() && form.quantity().errors().length) {
          @for (error of form.quantity().errors(); track error.kind) {
            @if (error.kind === 'min') {
              <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' | translate }}</mat-error>
            }
            @if (error.kind === 'required') {
              <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
            }
          }
        }
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionIdentificationComponent {
  readonly #denominationStore = inject(DenominationsStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);

  munitionTypeOptions = computed(() =>
    this.#munitionComponentStore.items().filter((item) => item.category === 'MUNITION'),
  );

  readonly formModel = signal<MunitionIdentificationForm>({
    batch: '',
    denominationId: '',
    munitionTypeId: '',
    quantity: null,
  });

  readonly form = form(this.formModel, (f) => {
    required(f.batch);
    validate(f.denominationId, ({ value }) => {
      if (typeof value() === 'string') {
        return { kind: 'not_selected', message: 'Seleccione' };
      }
      return null;
    });
    required(f.munitionTypeId);
    required(f.quantity);
    min(f.quantity, 1);
    disabled(f.denominationId, ({ valueOf }) => !valueOf(f.munitionTypeId));
  });

  readonly #repositoryDenominations = signal<RepositoryDenominations>({});

  readonly filteredOptions = computed<DenominationModel[]>(() => {
    const denominationValue = this.formModel().denominationId;
    const munitionTypeId = this.formModel().munitionTypeId;

    if (typeof denominationValue !== 'string') {
      return [denominationValue];
    }

    if (denominationValue.length <= 2) return [];

    const denominations = this.#repositoryDenominations()[munitionTypeId.toLocaleLowerCase()] ?? [];
    const criteria = denominationValue.toLocaleLowerCase();
    return denominations.filter((e) => e.name.toLocaleLowerCase().includes(criteria));
  });

  displayFn(option: DenominationModel | string | null): string {
    if (option === null) {
      return '';
    } else if (typeof option === 'string') {
      return option;
    } else {
      return `${option.name}`;
    }
  }

  readonly #initialized: string[] = [];

  constructor() {
    effect(() => {
      const munitionTypeId = this.formModel().munitionTypeId;

      if (!this.#initialized.includes(munitionTypeId)) {
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
    this.formModel.update((m) => ({ ...m, denominationId: '' }));
  }

  value = computed(() => {
    if (this.errors()) {
      return false;
    } else {
      return this.formModel();
    }
  });

  touched = signal(false); // munitiontypeId denominationId doesn't respond to markAsTouched.
  markAsTouched() {
    this.form.batch().markAsTouched();
    this.form.quantity().markAsTouched();
    this.touched.set(true);
  }

  reset() {
    this.formModel.set({ batch: '', denominationId: '', munitionTypeId: '', quantity: 0 });
  }

  errors = computed(() => {
    const errorDenomination = this.form.denominationId().errors().length > 0;
    const errorMunition = this.form.munitionTypeId().errors().length > 0;
    const errorBatch = this.form.batch().errors().length > 0;
    const errorQuantity = this.form.quantity().errors().length > 0;
    return errorDenomination || errorMunition || errorBatch || errorQuantity;
  });
}
