import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { ShotPiezoPressureItem } from '../../../models';
import {
  DEFAULT_PRESSURE_UNIT,
  type InputFieldValue,
  equipmentIdToString,
  equipmentStringToId,
  numToField,
  parseNum,
} from '../piezo-pressure-introduction.mapper';

@Component({
  selector: 'inta-piezo-pressure-sensor-tab',
  imports: [MatFormFieldModule, MatSelectModule, TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 items-start">
      <!-- ── Left: Equipment & Pressure input ───────────────────────────── -->
      <div class="lg:col-span-3 flex flex-col gap-4">
        <!-- Row 1: Captador, Registrador, Amplificador -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Captador piezoeléctrico -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_PLACEHOLDER' | translate"
              [value]="captadorValue()"
              (selectionChange)="onCaptadorChange($event.value)"
            >
              @for (opt of captadorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Registrador -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_PLACEHOLDER' | translate"
              [value]="registradorValue()"
              (selectionChange)="onRegistradorChange($event.value)"
            >
              @for (opt of registradorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Amplificador -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_PLACEHOLDER' | translate"
              [value]="amplificadorValue()"
              (selectionChange)="onAmplificadorChange($event.value)"
            >
              @for (opt of amplificadorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Row 2: Presión máxima -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ui-input-select
            subscriptSizing="dynamic"
            [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_MAXIMA_LABEL' | translate"
            [opciones]="pressureUnitOptions()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.INPUT_PLACEHOLDER_XXX' | translate"
            [value]="presionMaximaField()"
            (valueChange)="onPresionMaximaChange($event)"
          />
        </div>
      </div>

      <!-- ── Right: Observaciones ────────────────────────────────────────── -->
      <div class="lg:col-span-1 h-full min-h-[140px] flex flex-col">
        <div
          class="w-full h-full min-h-[140px] flex flex-col rounded-xl border border-gray-200 bg-white p-3 focus-within:border-[var(--inta-button)] focus-within:ring-1 focus-within:ring-[var(--inta-button)] transition-all"
        >
          <textarea
            rows="5"
            class="w-full h-full resize-none border-none outline-none text-xs text-gray-700 placeholder-gray-400 bg-transparent flex-1"
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
export class PiezoPressureSensorTab {
  readonly position = input.required<string>();
  readonly model = model.required<ShotPiezoPressureItem>();

  readonly captadorOptions = input<Array<{ value: string; label: string }>>([]);
  readonly registradorOptions = input<Array<{ value: string; label: string }>>([]);
  readonly amplificadorOptions = input<Array<{ value: string; label: string }>>([]);
  readonly pressureUnitOptions = input<Array<{ value: string; label: string }>>([]);

  protected readonly captadorValue = computed(() => equipmentIdToString(this.model().piezoelectricSensorId));
  protected readonly registradorValue = computed(() => equipmentIdToString(this.model().dataAcquisitionSystemId));
  protected readonly amplificadorValue = computed(() => equipmentIdToString(this.model().amplifierId));

  protected readonly presionMaximaField = computed(() =>
    numToField(this.model().maxPressure, this.model().maxPressureUnit ?? DEFAULT_PRESSURE_UNIT),
  );

  protected onCaptadorChange(value: string | null): void {
    this.model.update((current) => ({
      ...current,
      piezoelectricSensorId: equipmentStringToId(value),
    }));
  }

  protected onRegistradorChange(value: string | null): void {
    this.model.update((current) => ({
      ...current,
      dataAcquisitionSystemId: equipmentStringToId(value),
    }));
  }

  protected onAmplificadorChange(value: string | null): void {
    this.model.update((current) => ({
      ...current,
      amplifierId: equipmentStringToId(value),
    }));
  }

  protected onPresionMaximaChange(field: InputFieldValue): void {
    this.model.update((current) => ({
      ...current,
      maxPressure: parseNum(field),
      maxPressureUnit: field?.unit ?? DEFAULT_PRESSURE_UNIT,
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
