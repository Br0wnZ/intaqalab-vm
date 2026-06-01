import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoLeadingZerosDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { ReconditioningData } from '../../../utils-models/munitions.model';

@Component({
  selector: 'inta-conditioning-fields',
  imports: [MatFormFieldModule, MatInputModule, NoLeadingZerosDirective, TranslateModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div>
        <label for="conditioning-temperature" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full temperature-field" [style.--temp-color]="temperatureColor()">
          <input
            placeholder="XX"
            id="conditioning-temperature"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().temperature ?? ''"
            [style.color]="temperatureColor()"
            (input)="onFieldChange('temperature', $any($event.target).valueAsNumber)"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-tolerance" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            placeholder="XX"
            id="conditioning-tolerance"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().tolerance ?? ''"
            (input)="onFieldChange('tolerance', $any($event.target).valueAsNumber)"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-time-min" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            placeholder="XX"
            id="conditioning-time-min"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().timeMin ?? ''"
            (input)="onFieldChange('timeMin', $any($event.target).valueAsNumber)"
          />
        </mat-form-field>
      </div>

      <div>
        <label for="conditioning-time-max" class="block text-xs font-medium text-gray-600 mb-2">
          {{ 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            placeholder="XX"
            id="conditioning-time-max"
            matInput
            type="number"
            libNoLeadingZeros
            [value]="formModel().timeMax ?? ''"
            (input)="onFieldChange('timeMax', $any($event.target).valueAsNumber)"
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
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditioningFieldsComponent {
  readonly data = input.required<ReconditioningData>();

  readonly dataChange = output<ReconditioningData>();

  readonly formModel = linkedSignal(() => this.data());

  readonly temperatureColor = computed(() => this.#getTemperatureColor(this.formModel().temperature ?? 0));

  onFieldChange(field: keyof ReconditioningData, value: number | string): void {
    this.formModel.update((current) => ({
      ...current,
      [field]: value,
    }));
    this.dataChange.emit(this.formModel());
  }

  #getTemperatureColor(temp: number): string {
    if (temp < 0) {
      return '#3b82f6';
    }
    if (temp >= 0 && temp <= 21) {
      return '#22c55e';
    }
    return '#f97316';
  }
}
