import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
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

      <!-- Fields 2-column grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <!-- Pieza X -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_PIEZA_PLACEHOLDER' | translate"
          [value]="xPiezaField()"
          (valueChange)="xPiezaField.set($event)"
        />

        <!-- Pieza Y -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_PIEZA_PLACEHOLDER' | translate"
          [value]="yPiezaField()"
          (valueChange)="yPiezaField.set($event)"
        />

        <!-- Pieza Z -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_PIEZA_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_PIEZA_PLACEHOLDER' | translate"
          [value]="zPiezaField()"
          (valueChange)="zPiezaField.set($event)"
        />

        <!-- Blanco X -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.X_BLANCO_PLACEHOLDER' | translate"
          [value]="xBlancoField()"
          (valueChange)="xBlancoField.set($event)"
        />

        <!-- Blanco Y -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Y_BLANCO_PLACEHOLDER' | translate"
          [value]="yBlancoField()"
          (valueChange)="yBlancoField.set($event)"
        />

        <!-- Blanco Z -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_BLANCO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.Z_BLANCO_PLACEHOLDER' | translate"
          [value]="zBlancoField()"
          (valueChange)="zBlancoField.set($event)"
        />

        <!-- OLT para diferencia angular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OLT_PLACEHOLDER' | translate"
          [value]="oltField()"
          (valueChange)="oltField.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
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

  // ── Numeric field signals ─────────────────────────────────────────────────
  readonly xPiezaField = signal<InputFieldValue>(this.data.current.xPieza);
  readonly yPiezaField = signal<InputFieldValue>(this.data.current.yPieza);
  readonly zPiezaField = signal<InputFieldValue>(this.data.current.zPieza);
  readonly xBlancoField = signal<InputFieldValue>(this.data.current.xBlanco);
  readonly yBlancoField = signal<InputFieldValue>(this.data.current.yBlanco);
  readonly zBlancoField = signal<InputFieldValue>(this.data.current.zBlanco);
  readonly oltField = signal<InputFieldValue>(this.data.current.olt);

  apply(): void {
    this.#dialogRef.close({
      action: 'apply',
      series: this.formModel().series,
      observador: this.formModel().observador,
      xPieza: this.xPiezaField(),
      yPieza: this.yPiezaField(),
      zPieza: this.zPiezaField(),
      xBlanco: this.xBlancoField(),
      yBlanco: this.yBlancoField(),
      zBlanco: this.zBlancoField(),
      olt: this.oltField(),
    });
  }
}
