import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, InputSelectInput, IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { JltMaoMassConfigFields, JltMaoMassConfigInputField } from './jlt-mao-mass-config.mapper';
import { canApplyJltMaoMassConfig } from './jlt-mao-mass-config.mapper';

type InputFieldValue = JltMaoMassConfigInputField;

export interface JltMaoMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  planningConditionsReady: boolean;
  seriesOrientations: { seriesId: string; orientations: (number | null)[] }[];
  piquetaOptions: { value: string; label: string; x: number; y: number }[];
  piecePosition: { x: number | null; y: number | null };
  currentPiqueta: string | null;
  current: JltMaoMassConfigFields;
}

export interface JltMaoMassConfigDialogResult {
  action: 'apply' | 'cancel';
  series?: string[];
  velocidadInicial?: InputFieldValue;
  distanciaPique?: InputFieldValue;
  derivaTabular?: InputFieldValue;
  tiempoVuelo?: InputFieldValue;
  diferenciaAngular?: InputFieldValue;
  anguloTiro?: InputFieldValue;
  graduacionEspoleta?: InputFieldValue;
  alturaFuncionamiento?: InputFieldValue;
  distanciaFuncionamiento?: InputFieldValue;
  orientation?: {
    seriesIds: string[];
    lineOfFireOrientation: number;
  };
}

interface MassConfigForm {
  series: string[];
  piqueta: string | null;
}

type SeriesOrientationStatus = 'missing' | 'planned' | 'inconsistent' | 'unavailable';

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
    IntaIconComponent,
    InputSelectInput,
    LocaleDecimalInputDirective,
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
            @for (opt of serieSelectOptions(); track opt.value) {
              <mat-option [value]="opt.value" [disabled]="opt.disabled">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (selectedSeriesStatuses().length > 0 && !planningConditionsReady()) {
        <p role="alert" class="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_ORIENTATION_UNAVAILABLE' | translate }}
        </p>
      }

      <!-- OLT / Piqueta / Diferencia angular -->
      <div class="mb-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
        <ui-input-select
          label="OLT"
          [opciones]="ooOptions"
          [placeholder]="'0,000'"
          [value]="oltDisplayField()"
          [readOnly]="oltReadOnly()"
          [variant]="oltReadOnly() ? 'computed' : 'default'"
          (valueChange)="onOltChanged($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_PLACEHOLDER' | translate"
            [formField]="massForm.piqueta"
          >
            <mat-option [value]="null">—</mat-option>
            @for (option of data.piquetaOptions; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_PLACEHOLDER' | translate"
          [value]="diferenciaAngularField()"
          [readOnly]="angularDifferenceReadOnly()"
          [variant]="angularDifferenceReadOnly() ? 'computed' : 'default'"
          (valueChange)="diferenciaAngularField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>
      </div>
      @if (needsManualOrientation() && calculatedOlt() === null) {
        <p role="status" class="mb-3 text-sm text-gray-600">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_OLT_REQUIRED' | translate }}
        </p>
      }

      <!-- 2-column grid: numeric fields -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
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
      <button mat-flat-button color="primary" type="button" [disabled]="!canApply()" (click)="apply()">
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
    piqueta: this.data.currentPiqueta,
  });
  protected readonly massForm = form(this.formModel, (path) => {
    disabled(path.piqueta, () => !this.needsManualOrientation() || this.hasManualOlt());
  });

  protected readonly oltField = signal<InputFieldValue>(null);

  protected readonly serieSelectOptions = computed(() =>
    this.data.serieOptions.map((option) => ({
      ...option,
      disabled: this.#getSeriesOrientationStatus(option.value) === 'inconsistent',
    })),
  );

  protected readonly selectedSeriesStatuses = computed(() =>
    this.formModel().series.map((seriesId) => ({
      seriesId,
      status: this.#getSeriesOrientationStatus(seriesId),
    })),
  );
  protected readonly planningConditionsReady = computed(() => this.data.planningConditionsReady);
  protected readonly hasInconsistentOrientation = computed(() =>
    this.selectedSeriesStatuses().some(({ status }) => status === 'inconsistent'),
  );
  protected readonly hasUnavailableOrientationData = computed(() =>
    this.selectedSeriesStatuses().some(({ status }) => status === 'unavailable'),
  );
  protected readonly needsManualOrientation = computed(() =>
    this.selectedSeriesStatuses().some(({ status }) => status === 'missing'),
  );
  protected readonly manualOrientationSeriesIds = computed(() =>
    this.selectedSeriesStatuses()
      .filter(({ status }) => status === 'missing')
      .map(({ seriesId }) => seriesId),
  );
  protected readonly hasManualOlt = computed(() => this.#parseNumber(this.oltField()) !== null);
  protected readonly plannedOlt = computed(() => {
    const values = new Set(
      this.selectedSeriesStatuses()
        .filter(({ status }) => status === 'planned')
        .map(
          ({ seriesId }) => this.data.seriesOrientations.find((s) => s.seriesId === seriesId)?.orientations[0] ?? null,
        ),
    );
    const [value] = [...values];
    return values.size === 1 && value !== null && value !== undefined ? value : null;
  });
  protected readonly oltReadOnly = computed(() => !this.needsManualOrientation() || this.formModel().piqueta !== null);
  protected readonly angularDifferenceReadOnly = computed(() => !this.needsManualOrientation() || this.hasManualOlt());
  protected readonly calculatedOlt = computed(() => {
    if (!this.needsManualOrientation()) return null;
    const selectedPiqueta = this.formModel().piqueta;
    if (selectedPiqueta === null) return this.#parseNumber(this.oltField());
    const piqueta = this.data.piquetaOptions.find((option) => option.value === selectedPiqueta);
    const { x, y } = this.data.piecePosition;
    const angularDifference = this.#parseNumber(this.diferenciaAngularField());
    if (!piqueta || x === null || y === null || angularDifference === null) return null;
    const bearing = Math.atan2(piqueta.y - y, piqueta.x - x) * (3200 / Math.PI);
    return angularDifference + bearing;
  });
  protected readonly oltDisplayField = computed<InputFieldValue>(() => {
    if (!this.needsManualOrientation()) return this.#numToField(this.plannedOlt());
    return this.formModel().piqueta !== null ? this.#numToField(this.calculatedOlt()) : this.oltField();
  });

  protected readonly canApply = computed(() => {
    if (this.hasInconsistentOrientation() || this.hasUnavailableOrientationData()) return false;
    const hasCalculatedOrientation = this.needsManualOrientation() && this.calculatedOlt() !== null;
    if (this.needsManualOrientation() && !hasCalculatedOrientation) return false;
    return (
      this.formModel().series.length > 0 &&
      (hasCalculatedOrientation ||
        canApplyJltMaoMassConfig(
          {
            velocidadInicial: this.velocidadInicialField(),
            distanciaPique: this.distanciaPiqueField(),
            derivaTabular: this.derivaTabularField(),
            tiempoVuelo: this.tiempoVueloField(),
            diferenciaAngular: this.diferenciaAngularField(),
            anguloTiro: this.anguloTiroField(),
            graduacionEspoleta: this.graduacionEspoletaField(),
            alturaFuncionamiento: this.alturaFuncionamientoField(),
            distanciaFuncionamiento: this.distanciaFuncionamientoField(),
          },
          this.data.current,
        ))
    );
  });

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
    if (!this.canApply()) return;
    const { series } = this.formModel();
    const lineOfFireOrientation = this.calculatedOlt();
    this.#dialogRef.close({
      action: 'apply',
      series,
      velocidadInicial: this.velocidadInicialField(),
      distanciaPique: this.distanciaPiqueField(),
      derivaTabular: this.derivaTabularField(),
      tiempoVuelo: this.tiempoVueloField(),
      diferenciaAngular: this.diferenciaAngularField(),
      anguloTiro: this.anguloTiroField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
      alturaFuncionamiento: this.alturaFuncionamientoField(),
      distanciaFuncionamiento: this.distanciaFuncionamientoField(),
      ...(this.needsManualOrientation() && lineOfFireOrientation !== null
        ? {
            orientation: {
              seriesIds: this.manualOrientationSeriesIds(),
              lineOfFireOrientation,
            },
          }
        : {}),
    });
  }

  cancel(): void {
    this.#dialogRef.close({ action: 'cancel' });
  }

  onOltChanged(olt: InputFieldValue): void {
    if (!this.oltReadOnly()) this.oltField.set(olt);
  }

  #numToField(value: number | null): InputFieldValue {
    return value === null ? null : { value: String(value), unit: 'oo' };
  }

  #getSeriesOrientationStatus(seriesId: string): SeriesOrientationStatus {
    if (!this.data.planningConditionsReady) return 'unavailable';
    const orientations =
      this.data.seriesOrientations.find((series) => series.seriesId === seriesId)?.orientations ?? [];
    if (orientations.length === 0 || orientations.every((orientation) => orientation === null)) return 'missing';
    const plannedOrientation = orientations[0];
    if (plannedOrientation === null || orientations.some((orientation) => orientation !== plannedOrientation)) {
      return 'inconsistent';
    }
    return 'planned';
  }

  #parseNumber(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const parsed = Number(field.value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
}
