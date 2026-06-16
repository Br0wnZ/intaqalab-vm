import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionStockFormModel } from '../../../models/munition-stock.model';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';

@Component({
  selector: 'inta-munition-location',
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <h3 class="w-full border-b border-gray-600 pb-1 mb-4 font-semibold text-base">
      {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_LOCATION' | translate }}
    </h3>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionType'"
          [valueKey]="'id'"
          [labelKey]="'munitionDumpId'"
          [formField]="form().location.munitionDumpId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_ARRIVAL_PLACEHOLDER' | translate"
          [options]="munitionsDumpList()"
        />
        @if (form().location.munitionDumpId().touched() && form().location.munitionDumpId().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>
      <div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionType'"
          [valueKey]="'id'"
          [labelKey]="'id'"
          [formField]="form().location.cellName"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.MUNITIONS_DUMPS_CELL_PLACEHOLDER' | translate"
          [options]="cellOptions()"
        />
        @if (form().location.cellName().touched() && form().location.cellName().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionLocationComponent {
  readonly #munitionsDumpsStore = inject(MunitionsDumpsStore);

  form = input.required<FieldTree<MunitionStockFormModel>>();

  readonly munitionsDumpList = computed(() => this.#munitionsDumpsStore.items() as MunitionsDumpModel[]);

  readonly cellOptions = computed(() => {
    const result: { id: string }[] = [];
    const munitionDumpSelected = this.form().location.munitionDumpId().value();

    if (!munitionDumpSelected) return result;

    const records = this.munitionsDumpList();
    const munitionDump = records.find((e) => e.id === munitionDumpSelected);

    return !munitionDump ? result : munitionDump.cells.map((e) => ({ id: e.name }));
  });
}
