import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoLeadingZerosDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { ReconditioningData } from '../../../utils-models/munitions.model';

type NumericField = 'temperature' | 'tolerance' | 'timeMin' | 'timeMax';

@Component({
  selector: 'inta-conditioning-fields',
  imports: [MatFormFieldModule, MatInputModule, NoLeadingZerosDirective, TranslateModule, NoNegativeValuesDirective],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div>
        <label for="conditioning-temperature" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL' | translate }}
        </label>
        <mat-form-field
          appearance="outline"
          class="w-full temperature-field"
          [class.cond-invalid]="showFieldError('temperature')"
          [style.--temp-color]="temperatureColor()"
        >
          <input
            placeholder="0"
            id="conditioning-temperature"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().temperature ?? ''"
            [style.color]="temperatureColor()"
            (input)="onFieldChange('temperature', $any($event.target).valueAsNumber)"
            (blur)="onFieldBlur('temperature')"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-tolerance" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [class.cond-invalid]="showFieldError('tolerance')">
          <input
            placeholder="0"
            id="conditioning-tolerance"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().tolerance ?? ''"
            (input)="onFieldChange('tolerance', $any($event.target).valueAsNumber)"
            (blur)="onFieldBlur('tolerance')"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-time-min" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [class.cond-invalid]="showFieldError('timeMin')">
          <input
            placeholder="0"
            id="conditioning-time-min"
            matInput
            type="number"
            libNoLeadingZeros
            libNoNegativeValues
            [value]="formModel().timeMin ?? ''"
            (input)="onFieldChange('timeMin', $any($event.target).valueAsNumber)"
            (blur)="onFieldBlur('timeMin')"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-time-max" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [class.cond-invalid]="showFieldError('timeMax')">
          <input
            placeholder="0"
            id="conditioning-time-max"
            matInput
            type="number"
            libNoLeadingZeros
            libNoNegativeValues
            [value]="formModel().timeMax ?? ''"
            (input)="onFieldChange('timeMax', $any($event.target).valueAsNumber)"
            (blur)="onFieldBlur('timeMax')"
          />
        </mat-form-field>
      </div>
    </div>

    <div class="mt-4">
      <label for="conditioning-observations" class="block text-xs font-medium text-gray-600 mb-2">
        {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.OBSERVATIONS_LABEL' | translate }}
      </label>
      <mat-form-field appearance="outline" class="w-full">
        <textarea
          id="conditioning-observations"
          matInput
          rows="2"
          [value]="formModel().observations ?? ''"
          [placeholder]="'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.OBSERVATIONS_PLACEHOLDER' | translate"
          (input)="onFieldChange('observations', $any($event.target).value)"
        ></textarea>
      </mat-form-field>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Temperature color override (existing) */
    .temperature-field .mdc-notched-outline__leading,
    .temperature-field .mdc-notched-outline__notch,
    .temperature-field .mdc-notched-outline__trailing {
      border-color: var(--temp-color, inherit) !important;
    }

    .temperature-field.mat-focused .mdc-notched-outline__leading,
    .temperature-field.mat-focused .mdc-notched-outline__notch,
    .temperature-field.mat-focused .mdc-notched-outline__trailing {
      border-color: var(--temp-color, inherit) !important;
    }

    /* Error border override — same technique as temperature color */
    .cond-invalid .mdc-notched-outline__leading,
    .cond-invalid .mdc-notched-outline__notch,
    .cond-invalid .mdc-notched-outline__trailing {
      border-color: #ef4444 !important;
      border-width: 2px !important;
    }

    .cond-invalid.mat-focused .mdc-notched-outline__leading,
    .cond-invalid.mat-focused .mdc-notched-outline__notch,
    .cond-invalid.mat-focused .mdc-notched-outline__trailing {
      border-color: #ef4444 !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditioningFieldsComponent {
  readonly data = input.required<ReconditioningData>();
  /** When true, forces all errors visible regardless of touched state (e.g. on save attempt) */
  readonly showErrors = input<boolean>(false);

  readonly dataChange = output<ReconditioningData>();

  readonly formModel = linkedSignal<ReconditioningData>(() => {
    const original = this.data();
    return {
      ...original,
      timeMin: original.timeMin ?? 24,
    };
  });

  readonly temperatureColor = computed(() => this.#getTemperatureColor(this.formModel().temperature ?? 0));

  /** Fields that have lost focus at least once */
  readonly #touchedFields = signal<Set<NumericField>>(new Set());

  /** Per-field required error flags (true = field is empty/invalid) */
  readonly fieldErrors = computed(() => {
    const d = this.formModel();
    const invalid = (v: number | undefined | null): boolean => v === undefined || v === null || isNaN(v as number);
    return {
      temperature: invalid(d.temperature),
      tolerance: invalid(d.tolerance),
      timeMin: invalid(d.timeMin),
      timeMax: invalid(d.timeMax),
    };
  });

  /** True when all required numeric fields are filled */
  readonly isValid = computed(() => Object.values(this.fieldErrors()).every((e) => !e));

  showFieldError(field: NumericField): boolean {
    return this.fieldErrors()[field] && (this.showErrors() || this.#touchedFields().has(field));
  }

  onFieldBlur(field: NumericField): void {
    this.#touchedFields.update((prev) => new Set([...prev, field]));
  }

  onFieldChange(field: keyof ReconditioningData, value: number | string): void {
    this.formModel.update((current) => ({
      ...current,
      [field]: value,
    }));
    this.dataChange.emit(this.formModel());
  }

  #getTemperatureColor(temp: number): string {
    if (temp < 0) return '#3b82f6';
    if (temp >= 0 && temp <= 21) return '#22c55e';
    return '#f97316';
  }
}
