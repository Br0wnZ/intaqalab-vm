import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal } from '@angular/core';
import { FormField, debounce, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ClientsDataService } from '@intaqalab/data-access';
import type { TrialSearchFilters, TrialStatus } from '@intaqalab/models';
import { injectTrialStatus } from '@intaqalab/models';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialTypeService } from '../../../../services/trial-type.service';

type TrialListFilterForm = Omit<TrialSearchFilters, 'year' | 'scheduledDateFrom' | 'scheduledDateTo'> & {
  year: string;
  scheduledDateFrom: string | Date;
  scheduledDateTo: string | Date;
};

function toISODateTime(value: string | Date): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return value || undefined;
}

@Component({
  selector: 'inta-trial-list-filter',
  standalone: true,
  imports: [
    TranslateModule,
    MatInputModule,
    MatButtonModule,
    IntaSignalSelectComponent,
    FormField,
    MatSelectModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div>
        <label for="trial-number" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIALS_LIST.FILTERS.TRIAL_NUMBER' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="trial-number"
            matInput
            [formField]="filterForm.trialNumber"
            [placeholder]="'TRIALS_LIST.FILTERS.TRIAL_NUMBER_PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <ui-inta-signal-select
        appearance="outline"
        [id]="'trial-status'"
        [valueKey]="'value'"
        [labelKey]="'label'"
        [formField]="filterForm.status"
        [label]="'TRIALS_LIST.FILTERS.STATUS' | translate"
        [placeholder]="'TRIALS_LIST.FILTERS.STATUS_PLACEHOLDER' | translate"
        [options]="trialStatus()"
        [multiple]="true"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'client'"
        [formField]="filterForm.clientId"
        [valueKey]="'id'"
        [labelKey]="'name'"
        [label]="'TRIALS_LIST.FILTERS.CLIENT' | translate"
        [searchable]="true"
        [placeholder]="'TRIALS_LIST.FILTERS.CLIENT_PLACEHOLDER' | translate"
        [options]="clientsService.clients()"
      />

      <ui-inta-signal-select
        appearance="outline"
        [id]="'trial-type'"
        [valueKey]="'id'"
        [labelKey]="'label'"
        [formField]="filterForm.fireTrialTypeId"
        [label]="'TRIALS_LIST.FILTERS.FIRE_TRIAL_TYPE' | translate"
        [placeholder]="'TRIALS_LIST.FILTERS.FIRE_TRIAL_TYPE_PLACEHOLDER' | translate"
        [options]="trialTypes()"
      />

      <div>
        <label for="year" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIALS_LIST.FILTERS.YEAR' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <mat-select
            id="year"
            [formField]="filterForm.year"
            [placeholder]="'TRIALS_LIST.FILTERS.YEAR_PLACEHOLDER' | translate"
          >
            <mat-option value="">{{ 'TRIALS_LIST.FILTERS.YEAR_ALL' | translate }}</mat-option>
            <mat-option value="2025">2025</mat-option>
            <mat-option value="2026">2026</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIALS_LIST.FILTERS.DESCRIPTION' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="description"
            matInput
            [formField]="filterForm.description"
            [placeholder]="'TRIALS_LIST.FILTERS.DESCRIPTION_PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <div class="lg:col-span-1">
        <label for="scheduled-date-range" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIALS_LIST.FILTERS.SCHEDULED_DATE_RANGE' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <mat-date-range-input [rangePicker]="pickerRange">
            <input
              id="scheduled-date-range"
              matStartDate
              readonly
              [formField]="filterForm.scheduledDateFrom"
              [placeholder]="'TRIALS_LIST.FILTERS.DATE_FROM_PLACEHOLDER' | translate"
              (click)="pickerRange.open()"
              (focus)="$event.target.blur()"
            />
            <input
              matEndDate
              readonly
              [formField]="filterForm.scheduledDateTo"
              [placeholder]="'TRIALS_LIST.FILTERS.DATE_TO_PLACEHOLDER' | translate"
              (click)="pickerRange.open()"
              (focus)="$event.target.blur()"
            />
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="pickerRange"></mat-datepicker-toggle>
          <mat-date-range-picker #pickerRange></mat-date-range-picker>
        </mat-form-field>
      </div>
    </div>

    <div class="flex justify-end my-4 gap-2">
      <button mat-stroked-button type="button" role="button" [disabled]="!filterForm().dirty()" (click)="resetForm()">
        {{ 'TRIALS_LIST.FILTERS.CLEAN_FILTERS' | translate }}
      </button>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialListFilter {
  protected readonly clientsService = inject(ClientsDataService);
  protected readonly trialsTypeResource = inject(TrialTypeService).fireTrialTypesResource;

  readonly trialStatus = injectTrialStatus();

  readonly filtersChange = output<Partial<TrialSearchFilters>>();

  readonly availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const year = String(currentYear - i);
      return { id: year, label: year };
    });
  });

  readonly trialTypes = computed(() => {
    const trialTypesResp = this.trialsTypeResource.value();
    if (!trialTypesResp?.items) {
      return [];
    }
    // Adaptar para usar label como texto visible
    return trialTypesResp.items.map((trialType) => ({
      id: trialType.id,
      label: trialType.label,
      active: trialType.active,
      name: trialType.name,
    }));
  });

  readonly formModel = signal<TrialListFilterForm>({
    trialNumber: '',
    status: [] as TrialStatus[],
    clientId: '',
    fireTrialTypeId: '',
    year: '',
    description: '',
    scheduledDateFrom: '',
    scheduledDateTo: '',
  });

  readonly filterForm = form(this.formModel, (f) => {
    debounce(f.trialNumber, 300);
    debounce(f.description, 300);
    disabled(
      f.clientId,
      () => this.clientsService.clientResource.isLoading() || !!this.clientsService.clientResource.error(),
    );
    disabled(f.fireTrialTypeId, () => this.trialsTypeResource.isLoading() || !!this.trialsTypeResource.error());
  });

  constructor() {
    effect(() => {
      const { scheduledDateFrom, scheduledDateTo, year, ...rest } = this.filterForm().value();
      this.filtersChange.emit({
        ...rest,
        year: year || undefined,
        scheduledDateFrom: toISODateTime(scheduledDateFrom),
        scheduledDateTo: toISODateTime(scheduledDateTo),
      });
    });
  }

  resetForm() {
    this.formModel.set({
      trialNumber: '',
      status: [],
      clientId: '',
      fireTrialTypeId: '',
      year: '',
      description: '',
      scheduledDateFrom: '',
      scheduledDateTo: '',
    });
  }
}
