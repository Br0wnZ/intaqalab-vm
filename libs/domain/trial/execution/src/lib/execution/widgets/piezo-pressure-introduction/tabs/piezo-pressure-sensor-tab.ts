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
  buildPiezoEquipmentCombinedValue,
  equipmentStringToId,
  numToField,
  parseNum,
  splitPiezoEquipmentCombinedValue,
} from '../piezo-pressure-introduction.mapper';

@Component({
  selector: 'inta-piezo-pressure-sensor-tab',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule, InputSelect],
  template: `
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 items-start">
      <!-- ── Left: Equipment & Pressure input ───────────────────────────── -->
      <div class="lg:col-span-3 flex flex-col gap-8">
        <!-- Row 1: Captador / Registrador / Amplificador (selector único combinado) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-5">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full sm:col-span-2">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.EQUIPOS_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.EQUIPOS_PLACEHOLDER' | translate"
              [value]="pressureEquipments()"
              (selectionChange)="onEquiposChange($event.value)"
            >
              @for (opt of equipmentOptions(); track opt.value) {
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
      <div class="lg:col-span-1 h-full flex flex-col">
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

  readonly equipmentOptions = input<Array<{ value: string; label: string }>>([]);
  readonly pressureUnitOptions = input<Array<{ value: string; label: string }>>([]);

  protected readonly pressureEquipments = computed(() => {
    const sensorId = this.model().piezoelectricSensorId;
    const daqId = this.model().dataAcquisitionSystemId;
    const ampId = this.model().amplifierId;
    if (sensorId === null || daqId === null || ampId === null) return null;

    const directCombined = buildPiezoEquipmentCombinedValue(sensorId, daqId, ampId);
    const options = this.equipmentOptions();
    if (options.some((opt) => opt.value === directCombined)) {
      return directCombined;
    }

    const matchingOpt = options.find((opt) => {
      const parts = splitPiezoEquipmentCombinedValue(opt.value);
      return (
        equipmentStringToId(parts.captadorId) === sensorId &&
        equipmentStringToId(parts.registradorId) === daqId &&
        equipmentStringToId(parts.amplificadorId) === ampId
      );
    });

    return matchingOpt ? matchingOpt.value : null;
  });

  protected readonly presionMaximaField = computed(() =>
    numToField(this.model().maxPressure, this.model().maxPressureUnit ?? DEFAULT_PRESSURE_UNIT),
  );

  protected onEquiposChange(value: string | null): void {
    const { captadorId, registradorId, amplificadorId } = splitPiezoEquipmentCombinedValue(value);
    this.model.update((current) => ({
      ...current,
      piezoelectricSensorId: equipmentStringToId(captadorId),
      dataAcquisitionSystemId: equipmentStringToId(registradorId),
      amplifierId: equipmentStringToId(amplificadorId),
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
