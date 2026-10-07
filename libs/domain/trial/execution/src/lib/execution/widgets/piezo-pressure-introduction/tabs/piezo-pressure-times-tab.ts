import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { ShotTimesData } from '../../../models';
import { DEFAULT_TIME_UNIT, type InputFieldValue, numToField, parseNum } from '../piezo-pressure-introduction.mapper';

@Component({
  selector: 'inta-piezo-pressure-times-tab',
  imports: [TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 items-start">
      <!-- ── Left: Time inputs ─────────────────────────────────────────── -->
      <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Tiempo de Acción -->
        <ui-input-select
          subscriptSizing="dynamic"
          [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_ACCION_LABEL' | translate"
          [opciones]="timeUnitOptions()"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.INPUT_PLACEHOLDER_XXX' | translate"
          [value]="actionTimeField()"
          (valueChange)="onActionTimeChange($event)"
        />

        <!-- Tiempo de Retardo -->
        <ui-input-select
          subscriptSizing="dynamic"
          [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TIEMPO_RETARDO_LABEL' | translate"
          [opciones]="timeUnitOptions()"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.INPUT_PLACEHOLDER_XXX' | translate"
          [value]="delayTimeField()"
          (valueChange)="onDelayTimeChange($event)"
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
export class PiezoPressureTimesTab {
  readonly model = model.required<ShotTimesData>();
  readonly timeUnitOptions = input<Array<{ value: string; label: string }>>([]);

  protected readonly actionTimeField = computed(() =>
    numToField(this.model().actionTime, this.model().actionTimeUnit ?? DEFAULT_TIME_UNIT),
  );

  protected readonly delayTimeField = computed(() =>
    numToField(this.model().delayTime, this.model().delayTimeUnit ?? DEFAULT_TIME_UNIT),
  );

  protected onActionTimeChange(field: InputFieldValue): void {
    this.model.update((current) => ({
      ...current,
      actionTime: parseNum(field),
      actionTimeUnit: field?.unit ?? DEFAULT_TIME_UNIT,
    }));
  }

  protected onDelayTimeChange(field: InputFieldValue): void {
    this.model.update((current) => ({
      ...current,
      delayTime: parseNum(field),
      delayTimeUnit: field?.unit ?? DEFAULT_TIME_UNIT,
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
