import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { ShotDifferentialPressureData } from '../../../models';
import {
  DEFAULT_PRESSURE_UNIT,
  type InputFieldValue,
  numToField,
  parseNum,
} from '../piezo-pressure-introduction.mapper';

@Component({
  selector: 'inta-piezo-pressure-differential-tab',
  imports: [TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 items-start">
      <!-- ── Left: Differential pressure inputs ──────────────────────────── -->
      <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Presión Diferencial Positiva -->
        <ui-input-select
          subscriptSizing="dynamic"
          [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_DIF_POSITIVA_LABEL' | translate"
          [opciones]="pressureUnitOptions()"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.INPUT_PLACEHOLDER_XXX' | translate"
          [value]="positiveField()"
          (valueChange)="onPositiveChange($event)"
        />

        <!-- Presión Diferencial Negativa -->
        <ui-input-select
          subscriptSizing="dynamic"
          [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_DIF_NEGATIVA_LABEL' | translate"
          [opciones]="pressureUnitOptions()"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.INPUT_PLACEHOLDER_XXX' | translate"
          [value]="negativeField()"
          (valueChange)="onNegativeChange($event)"
        />
      </div>

      <!-- ── Right: Observaciones ────────────────────────────────────────── -->
      <div class="lg:col-span-1 h-full min-h-[140px] flex flex-col">
        <div
          class="w-full h-full min-h-[140px] flex flex-col rounded-xl border border-gray-200 bg-white p-3 focus-within:border-[var(--inta-button)] focus-within:ring-1 focus-within:ring-[var(--inta-button)] transition-all"
        >
          <textarea
            rows="5"
            class="w-full h-full !resize-none border-none outline-none text-xs text-gray-700 placeholder-gray-400 bg-transparent flex-1"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="model().observations ?? ''"
            (input)="onObservationsChange($event)"
          ></textarea>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiezoPressureDifferentialTab {
  readonly model = model.required<ShotDifferentialPressureData>();
  readonly pressureUnitOptions = input<Array<{ value: string; label: string }>>([]);

  protected readonly positiveField = computed(() =>
    numToField(
      this.model().positiveDifferentialPressure,
      this.model().positiveDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    ),
  );

  protected readonly negativeField = computed(() =>
    numToField(
      this.model().negativeDifferentialPressure,
      this.model().negativeDifferentialPressureUnit ?? DEFAULT_PRESSURE_UNIT,
    ),
  );

  protected onPositiveChange(field: InputFieldValue): void {
    this.model.update((current) => ({
      ...current,
      positiveDifferentialPressure: parseNum(field),
      positiveDifferentialPressureUnit: field?.unit ?? DEFAULT_PRESSURE_UNIT,
    }));
  }

  protected onNegativeChange(field: InputFieldValue): void {
    this.model.update((current) => ({
      ...current,
      negativeDifferentialPressure: parseNum(field),
      negativeDifferentialPressureUnit: field?.unit ?? DEFAULT_PRESSURE_UNIT,
    }));
  }

  protected onObservationsChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.model.update((current) => ({
      ...current,
      observations: target?.value ?? null,
    }));
  }
}
