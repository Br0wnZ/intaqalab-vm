import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { DocumentTypesService } from '../../../services/documents/document-types/document-types.service';
import { DocumentsService } from '../../../services/documents/documents.service';
import { UserDataService } from '../../../services/user-data.service';
import type { EventLogDocumentsFilters, EventLogDocumentsSearch } from '../../../utils-models/documents.model';
import { castEventLogFiltersToEventLogSearch } from '../../../utils-models/utils.model';

@Component({
  selector: 'inta-event-log-documents-filter',
  imports: [
    IntaSignalSelectComponent,
    FormField,
    MatButtonModule,
    MatDatepickerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="w-full flex justify-end mb-4 mt-4 gap-4">
      <button
        matButton="elevated"
        color="primary"
        type="button"
        class="flex justify-center items-center ml-4"
        (click)="exportPDF()"
      >
        <span>{{ 'EVENT_LOG.FILTERS.EXPORT_PDF_BUTTON' | translate }}</span>
      </button>
      <button
        matButton="elevated"
        color="primary"
        type="button"
        class="flex justify-center items-center"
        (click)="exportExcel()"
      >
        <span>{{ 'EVENT_LOG.FILTERS.EXPORT_EXCEL_BUTTON' | translate }}</span>
      </button>
      <button
        mat-flat-button
        type="button"
        class="flex justify-center items-center"
        (click)="this.showFilters.set(!this.showFilters())"
      >
        <mat-icon>filter_alt</mat-icon>
        <span>{{ 'EVENT_LOG.FILTERS.TOGGLE_FILTERS_PANEL_BUTTON' | translate }}</span>
      </button>
    </div>
    @if (showFilters()) {
      <div class="w-full flex gap-4 flex-wrap">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-type'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="form.type"
          [label]="'EVENT_LOG.DOCUMENTS.FILTERS.TYPE.LABEL' | translate"
          [placeholder]="'EVENT_LOG.DOCUMENTS.FILTERS.TYPE.PLACEHOLDER' | translate"
          [options]="documentTypesList()"
          [multiple]="true"
        />

        <div class="flex flex-col">
          <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'EVENT_LOG.FILTERS.DATE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-date-range-input [rangePicker]="picker" [dateFilter]="filterDates">
              <input
                placeholder="{{ 'EVENT_LOG.FILTERS.DATE.PLACEHOLDER_START' | translate }}"
                matInput
                readonly
                matStartDate
                [formField]="form.dateStart"
              />
              <input
                placeholder="{{ 'EVENT_LOG.FILTERS.DATE.PLACEHOLDER_END' | translate }}"
                matInput
                readonly
                matEndDate
                [formField]="form.dateEnd"
              />
            </mat-date-range-input>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>
          @if (form().errors()) {
            @for (error of form().errors(); track error.kind) {
              @if (error.kind === 'required_end_date') {
                <mat-error>{{ error.message | translate }}</mat-error>
              }
            }
          }
        </div>

        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-action'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.action"
          [label]="'EVENT_LOG.FILTERS.ACTION.LABEL' | translate"
          [placeholder]="'EVENT_LOG.FILTERS.ACTION.PLACEHOLDER' | translate"
          [options]="availableActions"
          [multiple]="true"
        />

        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-user'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.user"
          [label]="'EVENT_LOG.FILTERS.USER.LABEL' | translate"
          [placeholder]="'EVENT_LOG.FILTERS.USER.PLACEHOLDER' | translate"
          [options]="usersList()"
          [multiple]="true"
        />

        <div>
          <label for="event-filter-hardware" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'EVENT_LOG.FILTERS.HARDWARE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="event-filter-hardware"
              matInput
              [formField]="form.hardwareId"
              [placeholder]="'EVENT_LOG.FILTERS.HARDWARE.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
      </div>

      <div class="w-full flex justify-end mb-4">
        <div>
          <button
            mat-stroked-button
            type="button"
            class="mr-4"
            [disabled]="formModel() === defaultFormValues"
            (click)="clearFilters()"
          >
            {{ 'EVENT_LOG.FILTERS.CLEAN_BUTTON' | translate }}
          </button>
        </div>

        <div>
          <button mat-flat-button type="button" [disabled]="form().invalid()" (click)="search()">
            {{ 'EVENT_LOG.FILTERS.SEARCH_BUTTON' | translate }}
          </button>
        </div>
      </div>
    }
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLogDocumentsFilterComponent {
  readonly #documentsService = inject(DocumentsService);
  readonly #userDataService = inject(UserDataService);
  readonly #documentTypesService = inject(DocumentTypesService);

  readonly showFilters = signal(false);

  usersList = computed(() => {
    const users = this.#userDataService.getUsersResponse.value();

    return users || [];
  });

  documentTypesList = computed(() => {
    const documents = this.#documentTypesService.getDocumentTypesResponse.value();

    return documents || [];
  });

  readonly defaultFormValues: EventLogDocumentsFilters = {
    type: [],
    dateStart: '',
    dateEnd: '',
    action: [],
    user: [],
    hardwareId: '',
  };

  readonly formModel = signal<EventLogDocumentsFilters>(this.defaultFormValues);

  readonly form = form(this.formModel, (schemaPath) => {
    validate(schemaPath, (ctx) => {
      const formValues = ctx.value();

      const startDateFilled = formValues.dateStart instanceof Date;
      const endDateFilled = formValues.dateEnd instanceof Date;
      const dateRangeFilled = startDateFilled && endDateFilled;

      if (startDateFilled && !endDateFilled)
        return { kind: 'required_end_date', message: 'EVENT_LOG.FILTERS.DATE.ERROR' };

      const typeFilled = formValues.type.length > 0;
      const userFilled = formValues.user.length > 0;
      const hardwareIdFilled = formValues.hardwareId.trim().length > 0;
      const actionFilled = formValues.action.length > 0;

      if (dateRangeFilled || actionFilled || userFilled || hardwareIdFilled || typeFilled) return undefined;

      return { kind: 'no_filters' };
    });
  });

  protected filterDates = (date: Date | null) => {
    const rangeStart = this.form.dateStart().value();

    if (!rangeStart || !date) return true;

    const lastSelectableDay = new Date(rangeStart);
    lastSelectableDay.setMonth(rangeStart.getMonth() + 1);

    return date >= rangeStart && date <= lastSelectableDay;
  };

  protected search() {
    const mappedFilters = castEventLogFiltersToEventLogSearch(this.formModel());

    this.#documentsService.filtersItems.set(mappedFilters);
  }

  protected clearFilters() {
    const dataToSend: Partial<EventLogDocumentsSearch> = {};

    this.#documentsService.filtersItems.set(dataToSend);
    this.formModel.set(this.defaultFormValues);
  }

  protected exportPDF() {
    alert('Exportando PDF');
  }

  protected exportExcel() {
    alert('Exportando Excel');
  }

  availableActions = [
    { id: 'add', label: 'Añadir' },
    { id: 'view', label: 'Visualizar' },
    { id: 'modify', label: 'Modificar' },
    { id: 'link', label: 'Vincular' },
    { id: 'delete', label: 'Eliminar' },
  ];
}
