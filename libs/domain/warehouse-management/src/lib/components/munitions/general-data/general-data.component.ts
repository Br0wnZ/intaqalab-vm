import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { MatSelectChange } from '@angular/material/select';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

import type { MunitionStockFormModel } from '../../../models/munition-stock.model';

@Component({
  selector: 'inta-general-data',
  imports: [
    IntaSignalSelectComponent,
    FormField,
    MatInputModule,
    TranslatePipe,
    TranslateModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  template: `
    <h3 class="w-full border-b border-gray-600 pb-1 mb-4 font-semibold text-base">
      {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.SECTION_GENERAL_DATA' | translate }}
    </h3>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="form().generalData.clientId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_PLACEHOLDER' | translate"
          [options]="clientsService.clients()"
          (selectionChange)="onClientChangeHandler($event)"
        />
        @if (form().generalData.clientId().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form().generalData.clientId().errors(); track error.kind) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>

      <div>
        <label for="requested-date" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="requested-date"
            matInput
            [formField]="form().generalData.entryDate"
            [matDatepicker]="picker"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_PLACEHOLDER' | translate"
            (click)="picker.open()"
            #dateInput
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker (closed)="dateInput.blur()" #picker></mat-datepicker>
        </mat-form-field>

        @if (form().generalData.entryDate().touched() && form().generalData.entryDate().errors()) {
          @for (error of form().generalData.entryDate().errors(); track error.kind) {
            @if (error.kind === 'required') {
              <mat-error>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</mat-error>
            }
          }
        }
      </div>
      <div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form().generalData.plannedFireTrialId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_PLACEHOLDER' | translate"
          [options]="associatedTrials()"
        />

        @if (form().generalData.entryDate().touched() && form().generalData.plannedFireTrialId().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            <p>{{ 'COMMONS.REQUIRED_FIELD' | translate }}</p>
          </div>
        }
      </div>
      <div>
        <label for="observations" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.OBSERVATIONS_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="observations"
            matInput
            [formField]="form().generalData.observations"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.OBSERVATIONS_PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionGeneralDataComponent {
  protected readonly clientsService = inject(ClientsDataService);
  readonly #trialsDataService = inject(TrialsDataService);

  readonly form = input.required<FieldTree<MunitionStockFormModel>>();
  readonly associatedTrials = input.required<{ id: string; label: string }[]>();

  onClientChangeHandler(data: MatSelectChange) {
    this.#trialsDataService.search({ clientId: data.value, status: [TrialStatus.PLANNED, TrialStatus.UNDER_REVIEW] });
  }
}
