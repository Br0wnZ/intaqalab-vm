import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { CalibryObserverOption } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

export interface MaoTopographyMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  observadorOptions: CalibryObserverOption[];
  current: {
    xPieza: { value: string; unit: string } | null;
    yPieza: { value: string; unit: string } | null;
    zPieza: { value: string; unit: string } | null;
    xBlanco: { value: string; unit: string } | null;
    yBlanco: { value: string; unit: string } | null;
    zBlanco: { value: string; unit: string } | null;
    olt: { value: string; unit: string } | null;
    observador: string | null;
  };
}

export interface MaoTopographyMassConfigDialogResult {
  action: 'apply' | 'cancel';
  series?: string[];
  xPieza?: { value: string; unit: string } | null;
  yPieza?: { value: string; unit: string } | null;
  zPieza?: { value: string; unit: string } | null;
  xBlanco?: { value: string; unit: string } | null;
  yBlanco?: { value: string; unit: string } | null;
  zBlanco?: { value: string; unit: string } | null;
  olt?: { value: string; unit: string } | null;
  observador?: string | null;
}

interface MassConfigForm {
  series: string[];
  observador: string | null;
}

type InputFieldValue = { value: string; unit: string } | null;

@Component({
  selector: 'inta-mao-topography-mass-config-dialog',
  imports: [
    FormField,
    ReadonlyContentDirective,
    InputSelect,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    SoundLevelMeterInput,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent>
      <!-- Series multi-select -->
      <div class="flex flex-col gap-1">
        <span class="text-sm text-gray-700">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_SERIES_LABEL' | translate }}
        </span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full mb-2">
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_SERIES_PLACEHOLDER' | translate"
            [formField]="massForm.series"
          >
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Fields 3-column layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2 pt-2.5 pb-2">
        <!-- Pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [value]="piezaPosition()"
          (valueChange)="piezaPosition.set($event)"
        />

        <!-- OLT para diferencia angular -->
        <ui-input-select
          class="col-span-1 md:col-span-1"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_PLACEHOLDER' | translate"
          [value]="oltField()"
          (valueChange)="oltField.set($event)"
        />

        <!-- Blanco Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.BLANCO_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [value]="blancoPosition()"
          (valueChange)="blancoPosition.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="col-span-1 md:col-span-1 w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_PLACEHOLDER' | translate"
            [formField]="massForm.observador"
          >
            @for (opt of data.observadorOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!flex gap-2 !justify-center !pb-4">
      <button mat-flat-button color="primary" (click)="apply()">
        {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_APPLY_BTN' | translate }}
      </button>
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
        {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_CANCEL_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaoTopographyMassConfigDialog {
  readonly #dialogRef =
    inject<MatDialogRef<MaoTopographyMassConfigDialog, MaoTopographyMassConfigDialogResult>>(MatDialogRef);
  readonly data = inject<MaoTopographyMassConfigDialogData>(MAT_DIALOG_DATA);

  // ── Unit options ─────────────────────────────────────────────────────────
  readonly metersOptions = [{ value: 'm', label: 'm' }];
  readonly ooOptions = [{ value: 'oo', label: 'ºº' }];

  // ── Select form ──────────────────────────────────────────────────────────
  readonly formModel = signal<MassConfigForm>({
    series: [],
    observador: this.data.current.observador,
  });
  readonly massForm = form(this.formModel);

  // ── Position signals ──────────────────────────────────────────────────────
  readonly piezaPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(this.data.current.xPieza, this.data.current.yPieza, this.data.current.zPieza),
  );
  readonly blancoPosition = signal<SoundLevelMeterValue | null>(
    this.#toPosition(this.data.current.xBlanco, this.data.current.yBlanco, this.data.current.zBlanco),
  );
  readonly oltField = signal<InputFieldValue>(this.data.current.olt);

  // Helper mappings
  #toPosition(x: InputFieldValue, y: InputFieldValue, z: InputFieldValue): SoundLevelMeterValue | null {
    if (!x && !y && !z) return null;
    return {
      x: x?.value ? parseFloat(x.value.replace(',', '.')) : null,
      y: y?.value ? parseFloat(y.value.replace(',', '.')) : null,
      z: z?.value ? parseFloat(z.value.replace(',', '.')) : null,
      unit: x?.unit ?? y?.unit ?? z?.unit ?? 'm',
    };
  }

  #fromPosition(pos: SoundLevelMeterValue | null): { x: InputFieldValue; y: InputFieldValue; z: InputFieldValue } {
    if (!pos) {
      return { x: null, y: null, z: null };
    }
    const unit = pos.unit ?? 'm';
    return {
      x: pos.x !== null ? { value: pos.x.toFixed(1), unit } : null,
      y: pos.y !== null ? { value: pos.y.toFixed(1), unit } : null,
      z: pos.z !== null ? { value: pos.z.toFixed(1), unit } : null,
    };
  }

  apply(): void {
    const pieza = this.#fromPosition(this.piezaPosition());
    const blanco = this.#fromPosition(this.blancoPosition());
    this.#dialogRef.close({
      action: 'apply',
      series: this.formModel().series,
      observador: this.formModel().observador,
      xPieza: pieza.x,
      yPieza: pieza.y,
      zPieza: pieza.z,
      xBlanco: blanco.x,
      yBlanco: blanco.y,
      zBlanco: blanco.z,
      olt: this.oltField(),
    });
  }
}
