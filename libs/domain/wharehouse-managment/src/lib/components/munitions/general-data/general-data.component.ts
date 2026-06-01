import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { MatSelectChange } from '@angular/material/select';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

import type { MunitionGeneralDataForm } from '../../../models/munition-stock.model';

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
          [formField]="form.client"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_PLACEHOLDER' | translate"
          [options]="clientsService.clients()"
          (selectionChange)="onClientChangeHandler($event)"
        />
        @if (form.client().errors().length) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.client().errors(); track error) {
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
            [formField]="form.entryDate"
            [matDatepicker]="picker"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.ENTRY_DATE_PLACEHOLDER' | translate"
            (click)="picker.open()"
            #dateInput
          />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker (closed)="dateInput.blur()" #picker></mat-datepicker>
        </mat-form-field>

        @if (touched() && form.entryDate().errors()) {
          @for (error of form.entryDate().errors(); track error) {
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
          [formField]="form.plannedFireTrialId"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.PLANNED_TRIAL_PLACEHOLDER' | translate"
          [options]="optionsTrialCombo()"
        />

        @if (touched() && form.plannedFireTrialId().errors().length) {
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
            [formField]="form.observations"
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

  readonly formModel = signal<MunitionGeneralDataForm>({
    client: '',
    entryDate: '',
    observations: '',
    plannedFireTrialId: '',
  });

  #trialsDataService = inject(TrialsDataService);

  optionsTrialCombo = computed(() => {
    const trialResponse = this.#trialsDataService.source.value();
    if (trialResponse !== undefined) {
      return trialResponse.items.map((e) => {
        return {
          id: e.id,
          label: `${e.trialNumber} - ${e.description || ''}`,
        };
      });
    } else {
      return [];
    }
  });

  onClientChangeHandler(data: MatSelectChange) {
    this.#trialsDataService.search({ clientId: data.value, status: [TrialStatus.PLANNED, TrialStatus.UNDER_REVIEW] });
  }

  urlTrialSearch = injectFireTrialsEndpoint();

  readonly form = form(this.formModel, (schemaPath) => {
    required(schemaPath.client);
    required(schemaPath.entryDate);
    validate(schemaPath.client, ({ value }) => {
      const client = value();
      const associatedTrials = this.optionsTrialCombo();
      const plannedTrialId = this.formModel().plannedFireTrialId;

      if (client && !associatedTrials.length && !plannedTrialId)
        return { kind: 'emptyList', message: 'WHAREHOUSE_MANAGMENT.MUNITION_CREATE.CLIENT_NO_TRIAL_ERROR' };

      if (!client && this.form.client().touched()) return { kind: 'required', message: 'COMMONS.REQUIRED_FIELD' };

      return null;
    });
    disabled(
      schemaPath.plannedFireTrialId,
      () =>
        !!this.form
          .client()
          .errors()
          .find((e) => e.kind === 'emptyList'),
    );
  });

  value = computed(() => {
    if (this.errors()) {
      return false;
    } else {
      return this.form().controlValue();
    }
  });

  touched = signal(false); // munitiontypeId denominationId doesn't respond to markAsTouched.
  markAsTouched() {
    this.form.client().markAsTouched();
    this.form.plannedFireTrialId().markAsTouched();
    this.form.entryDate().markAsTouched();
    this.touched.set(true);
  }

  reset() {
    this.formModel.set({
      client: '',
      entryDate: '',
      observations: '',
      plannedFireTrialId: '',
    });
  }

  errors = computed(() => {
    const errors = this.form().errorSummary();
    return errors.length > 0;
  });
}
