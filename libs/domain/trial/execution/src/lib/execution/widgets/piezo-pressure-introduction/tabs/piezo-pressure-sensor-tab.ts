import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 items-start">
      <!-- ── Left: Equipment & Pressure input ───────────────────────────── -->
      <div class="lg:col-span-3 flex flex-col gap-8">
        <!-- Row 1: Captador, Registrador, Amplificador -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-5">
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
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-5">
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="!resize-none"
            [id]="'piezo-pressure-observations-' + position()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="model().observations ?? ''"
            (input)="onObservationsChange($event)"
          ></textarea>
        </mat-form-field>
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
