import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { CalibryPiquetaOption } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

type InputFieldValue = { value: string; unit: string } | null;

export interface JltMaoMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  piquetaOptions: CalibryPiquetaOption[];
  current: {
    piqueta: string | null;
    velocidadInicial: InputFieldValue;
    distanciaPique: InputFieldValue;
    derivaTabular: InputFieldValue;
    tiempoVuelo: InputFieldValue;
    diferenciaAngular: InputFieldValue;
    anguloTiro: InputFieldValue;
    graduacionEspoleta: InputFieldValue;
    alturaFuncionamiento: InputFieldValue;
    distanciaFuncionamiento: InputFieldValue;
  };
}

export interface JltMaoMassConfigDialogResult {
  action: 'apply' | 'cancel';
  series?: string[];
  piqueta?: string | null;
  velocidadInicial?: InputFieldValue;
  distanciaPique?: InputFieldValue;
  derivaTabular?: InputFieldValue;
  tiempoVuelo?: InputFieldValue;
  diferenciaAngular?: InputFieldValue;
  anguloTiro?: InputFieldValue;
  graduacionEspoleta?: InputFieldValue;
  alturaFuncionamiento?: InputFieldValue;
  distanciaFuncionamiento?: InputFieldValue;
}

interface MassConfigForm {
  series: string[];
  piqueta: string | null;
}

@Component({
  selector: 'inta-jlt-mao-mass-config-dialog',
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
    IntaIconComponent
],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent>
      <!-- Series (full-width multi-select) -->
      <div class="flex flex-col gap-1 mb-2">
        <span class="text-sm font-medium text-gray-700">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_SERIES_LABEL' | translate }}
        </span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_SERIES_PLACEHOLDER' | translate"
            [formField]="massForm.series"
          >
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- 2-column grid: Piqueta + all numeric fields -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <!-- Piqueta -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_PLACEHOLDER' | translate"
            [formField]="massForm.piqueta"
          >
            @for (opt of data.piquetaOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad inicial teórica -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_PLACEHOLDER' | translate"
          [value]="velocidadInicialField()"
          (valueChange)="velocidadInicialField.set($event)"
        />

        <!-- Distancia prevista pique -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_PLACEHOLDER' | translate"
          [value]="distanciaPiqueField()"
          (valueChange)="distanciaPiqueField.set($event)"
        />

        <!-- Deriva tabular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_PLACEHOLDER' | translate"
          [value]="derivaTabularField()"
          (valueChange)="derivaTabularField.set($event)"
        />

        <!-- Tiempo vuelo teórico -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_PLACEHOLDER' | translate"
          [value]="tiempoVueloField()"
          (valueChange)="tiempoVueloField.set($event)"
        />

        <!-- Diferencia angular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_PLACEHOLDER' | translate"
          [value]="diferenciaAngularField()"
          (valueChange)="diferenciaAngularField.set($event)"
        />

        <!-- Ángulo tiro -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_PLACEHOLDER' | translate"
          [value]="anguloTiroField()"
          (valueChange)="anguloTiroField.set($event)"
        />

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaField()"
          (valueChange)="graduacionEspoletaField.set($event)"
        />

        <!-- Altura de explosión -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_EXPLOSION_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_EXPLOSION_PLACEHOLDER' | translate"
          [value]="alturaFuncionamientoField()"
          (valueChange)="alturaFuncionamientoField.set($event)"
        />

        <!-- Distancia de explosión -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_EXPLOSION_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_EXPLOSION_PLACEHOLDER' | translate"
          [value]="distanciaFuncionamientoField()"
          (valueChange)="distanciaFuncionamientoField.set($event)"
        />
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions align="end" class="!px-6 !pb-4 gap-2">
      <button mat-stroked-button type="button" (click)="cancel()">
        {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_CANCEL_BTN' | translate }}
      </button>
      <button mat-flat-button color="primary" type="button" (click)="apply()">
        {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_APPLY_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JltMaoMassConfigDialog {
  readonly #dialogRef = inject<MatDialogRef<JltMaoMassConfigDialog, JltMaoMassConfigDialogResult>>(MatDialogRef);
  protected readonly data = inject<JltMaoMassConfigDialogData>(MAT_DIALOG_DATA);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];
  protected readonly secondsOptions = [{ value: 's', label: 's' }];
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];

  // ── Form (series multi-select + piqueta selector) ─────────────────────────
  protected readonly formModel = signal<MassConfigForm>({
    series: [],
    piqueta: this.data.current.piqueta,
  });
  protected readonly massForm = form(this.formModel);

  // ── Numeric field signals (pre-filled from current values) ────────────────
  protected readonly velocidadInicialField = signal<InputFieldValue>(this.data.current.velocidadInicial);
  protected readonly distanciaPiqueField = signal<InputFieldValue>(this.data.current.distanciaPique);
  protected readonly derivaTabularField = signal<InputFieldValue>(this.data.current.derivaTabular);
  protected readonly tiempoVueloField = signal<InputFieldValue>(this.data.current.tiempoVuelo);
  protected readonly diferenciaAngularField = signal<InputFieldValue>(this.data.current.diferenciaAngular);
  protected readonly anguloTiroField = signal<InputFieldValue>(this.data.current.anguloTiro);
  protected readonly graduacionEspoletaField = signal<InputFieldValue>(this.data.current.graduacionEspoleta);
  protected readonly alturaFuncionamientoField = signal<InputFieldValue>(this.data.current.alturaFuncionamiento);
  protected readonly distanciaFuncionamientoField = signal<InputFieldValue>(this.data.current.distanciaFuncionamiento);

  apply(): void {
    const { series, piqueta } = this.formModel();
    this.#dialogRef.close({
      action: 'apply',
      series,
      piqueta,
      velocidadInicial: this.velocidadInicialField(),
      distanciaPique: this.distanciaPiqueField(),
      derivaTabular: this.derivaTabularField(),
      tiempoVuelo: this.tiempoVueloField(),
      diferenciaAngular: this.diferenciaAngularField(),
      anguloTiro: this.anguloTiroField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
      alturaFuncionamiento: this.alturaFuncionamientoField(),
      distanciaFuncionamiento: this.distanciaFuncionamientoField(),
    });
  }

  cancel(): void {
    this.#dialogRef.close({ action: 'cancel' });
  }
}
