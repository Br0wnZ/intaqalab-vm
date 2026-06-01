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

import { MeasuresService } from '../../../services/measures/measures.service';
import { UserDataService } from '../../../services/user-data.service';
import type { EventLogMeasuresFilters, EventLogMeasuresSearch } from '../../../utils-models/measures.model';
import { castEventLogFiltersToEventLogSearch } from '../../../utils-models/utils.model';

@Component({
  selector: 'inta-event-log-measures-filter',
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
        <div class="flex flex-col">
          <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'EVENT_LOG.FILTERS.DATE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-date-range-input [rangePicker]="picker" [dateFilter]="filterDates">
              <input
                placeholder="{{ 'EVENT_LOG.FILTERS.DATE.PLACEHOLDER_START' | translate }}"
                readonly
                matStartDate
                [formField]="form.dateStart"
              />
              <input
                placeholder="{{ 'EVENT_LOG.FILTERS.DATE.PLACEHOLDER_END' | translate }}"
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
          [formField]="form.action!"
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
          [formField]="form.user!"
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
              [formField]="form.hardwareId!"
              [placeholder]="'EVENT_LOG.FILTERS.HARDWARE.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-instrument'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.instrument!"
          [label]="'EVENT_LOG.MEASURES.FILTERS.INSTRUMENT.LABEL' | translate"
          [placeholder]="'EVENT_LOG.MEASURES.FILTERS.INSTRUMENT.PLACEHOLDER' | translate"
          [options]="availableInstruments"
          [multiple]="true"
        />

        <div>
          <label for="event-filter-value" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'EVENT_LOG.MEASURES.FILTERS.VALUE.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="event-filter-value"
              matInput
              [formField]="form.value!"
              [placeholder]="'EVENT_LOG.MEASURES.FILTERS.VALUE.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-measure'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.measure!"
          [label]="'EVENT_LOG.MEASURES.FILTERS.MEASURE.LABEL' | translate"
          [placeholder]="'EVENT_LOG.MEASURES.FILTERS.MEASURE.PLACEHOLDER' | translate"
          [options]="availableMeasures"
          [multiple]="true"
        />

        <div>
          <label for="event-filter-shoot" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'EVENT_LOG.MEASURES.FILTERS.SHOOT.LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="event-filter-shoot"
              matInput
              [formField]="form.shoot!"
              [placeholder]="'EVENT_LOG.MEASURES.FILTERS.SHOOT.PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        <ui-inta-signal-select
          appearance="outline"
          [id]="'event-filter-serie'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.serie!"
          [label]="'EVENT_LOG.MEASURES.FILTERS.SERIE.LABEL' | translate"
          [placeholder]="'EVENT_LOG.MEASURES.FILTERS.SERIE.PLACEHOLDER' | translate"
          [options]="availableInstruments"
          [multiple]="true"
        />

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
      </div>
    }
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLogEventLogMeasuresFiltersComponent {
  readonly #measuresService = inject(MeasuresService);
  readonly #userDataService = inject(UserDataService);

  readonly showFilters = signal(false);

  usersList = computed(() => {
    const users = this.#userDataService.getUsersResponse.value();

    return users || [];
  });

  readonly defaultFormValues: EventLogMeasuresFilters = {
    dateStart: '' as string,
    dateEnd: '' as string,
    action: [] as string[],
    user: [] as string[],
    hardwareId: '' as string,
    instrument: [] as string[],
    value: '' as string,
    measure: [] as string[],
    shoot: '' as string,
    serie: [] as string[],
  };

  readonly formModel = signal<EventLogMeasuresFilters>(this.defaultFormValues);

  readonly form = form(this.formModel, (schemaPath) => {
    validate(schemaPath, (ctx) => {
      const formValues = ctx.value();

      const startDateFilled = formValues.dateStart instanceof Date;
      const endDateFilled = formValues.dateEnd instanceof Date;
      const dateRangeFilled = startDateFilled && endDateFilled;

      if (startDateFilled && !endDateFilled)
        return { kind: 'required_end_date', message: 'EVENT_LOG.FILTERS.DATE.ERROR' };

      const actionFilled = formValues.action.length > 0;
      const userFilled = formValues.user.length > 0;
      const hardwareIdFilled = formValues.hardwareId.trim().length > 0;
      const instrumentFilled = formValues.instrument.length > 0;
      const valueFilled = formValues.value.trim().length > 0;
      const measuresFilled = formValues.measure.length > 0;
      const shootFilled = formValues.shoot.trim().length > 0;
      const serieFilled = formValues.serie.length > 0;

      if (
        instrumentFilled ||
        dateRangeFilled ||
        actionFilled ||
        userFilled ||
        hardwareIdFilled ||
        valueFilled ||
        shootFilled ||
        measuresFilled ||
        serieFilled
      )
        return undefined;

      return { kind: 'no_filters' };
    });
  });

  protected filterDates = (date: Date | null) => {
    const rangeStart = <Date>this.form.dateStart().value();

    if (!rangeStart || !date) return true;

    const lastSelectableDay = new Date(rangeStart);
    lastSelectableDay.setMonth(rangeStart.getMonth() + 1);

    return date >= rangeStart && date <= lastSelectableDay;
  };

  protected search() {
    const mappedFilters = castEventLogFiltersToEventLogSearch(this.formModel());

    this.#measuresService.filtersItems.set(mappedFilters);
  }

  protected clearFilters() {
    const dataToSend: Partial<EventLogMeasuresSearch> = {};

    this.#measuresService.filtersItems.set(dataToSend);
    this.formModel.set(this.defaultFormValues);
  }

  protected exportPDF() {
    alert('Exportando PDF');
  }

  protected exportExcel() {
    alert('Exportando Excel');
  }

  availableActions = [
    { id: 'create', label: 'Crear' },
    { id: 'edit', label: 'Editar' },
  ];

  availableInstruments = [
    { id: 'coor', label: 'Coordenadas' },
    { id: 'crono', label: 'Crono 3' },
    { id: 'record', label: 'Grabador vídeo digital' },
  ];

  availableMeasures = [
    { id: 'cX', label: 'Coordenada X' },
    { id: 'cY', label: 'Coordenada Y' },
    { id: 'tof', label: 'Tiempo de vuelo' },
    { id: 'fli', label: 'Tiemmpo de vuelo' },
    { id: 'dist', label: 'Distancia' },
  ];
}
