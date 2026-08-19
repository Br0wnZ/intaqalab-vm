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
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
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
import type { MunitionIdentificationForm } from '../../../models/munition-stock.model';
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
          [formField]="form().munitionTypeId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITION_TYPE_PLACEHOLDER' | translate"
          [options]="munitionTypes()"
          (selectionChange)="munitionTypeChangeHandler()"
        />
        @if (form().munitionTypeId().touched() && form().munitionTypeId().errors().length) {
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
            [formField]="form().denominationId"
            [matAutocomplete]="auto"
          />
          <mat-autocomplete [displayWith]="displayFn" #auto="matAutocomplete">
            @for (option of filteredOptions(); track option.id) {
              <mat-option [value]="option">{{ option.name }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
        @if (
          form().denominationId().touched() &&
          (form().denominationId().disabled() || form().denominationId().errors().length)
        ) {
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
            [formField]="form().batch"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.BATCH_LABEL' | translate"
          />
        </mat-form-field>
        @if (form().batch().touched() && form().batch().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>

      @if (this.hasQuantity()) {
        <div>
          <label for="quantity" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="quantity"
              matInput
              type="number"
              [formField]="form().quantity!"
              [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.QUANTITY_LABEL' | translate"
            />
          </mat-form-field>
          @if (form().quantity!().touched() && form().quantity!().errors()) {
            @for (error of form().quantity!().errors(); track error) {
              @if (error.kind === 'greater_than_zero') {
                <mat-error>{{ 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' | translate }}</mat-error>
              }
            }
          }
        </div>
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentMunitionComponent {
  readonly #denominationStore = inject(DenominationsStore);
  readonly #munitionsDumpsStore = inject(MunitionsDumpsStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);

  form = input.required<FieldTree<MunitionIdentificationForm>>();
  hasQuantity = input<boolean>(true);

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

  readonly #repositoryDenominations = signal<RepositoryDenominations>({});

  constructor() {
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
    this.form().denominationId().setControlValue('');
    const munitionTypeId = this.form().munitionTypeId().value();

    this.#denominationStore.search({ munitionTypeId, pageSize: 500, active: true });
  }

  readonly filteredOptions = computed<DenominationModel[]>(() => {
    const denominationValue = this.form().denominationId().value().toString();
    const munitionType = this.form().munitionTypeId().value();

    if (denominationValue.length <= 2) return [];

    const denominations = this.#repositoryDenominations()[munitionType.toLocaleLowerCase()] ?? [];
    const criteria = denominationValue.toLocaleLowerCase();

    return denominations.filter((e) => e.name.toLocaleLowerCase().includes(criteria));
  });
}
