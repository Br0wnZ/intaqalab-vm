import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AngleUnitEnum, MEASURE_UNIT_LABELS } from '@intaqalab/models';
import { InputSelect, InputSelectInput, IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { ShotJltMao } from '../../models/shot-jlt-mao.models';
import type { JltMaoMassConfigFields, JltMaoMassConfigInputField } from './jlt-mao-mass-config.mapper';
import { canApplyJltMaoMassConfig } from './jlt-mao-mass-config.mapper';

type InputFieldValue = JltMaoMassConfigInputField;

export interface JltMaoMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  planningConditionsReady: boolean;
  planningConfigurationsReady: boolean;
  seriesConfigurations: { seriesId: string; signature: string | null }[];
  seriesOrientations: {
    seriesId: string;
    orientations: (number | null)[];
    sourceOrientations?: { value: number | null; unit: AngleUnitEnum }[];
  }[];
  seriesPlannedValues?: {
    seriesId: string;
    ranges: (number | null)[];
    shootingAngles: (number | null)[];
    fuseGraduations: (number | null)[];
    functioningHeights: (number | null)[];
  }[];
  seriesExecutionValues?: {
    seriesId: string;
    data: ShotJltMao | null;
  }[];
  fireTrialId?: string | null;
  shotIdsBySeries?: Record<string, string[]>;
  piquetaOptions: { value: string; label: string; x: number; y: number }[];
  piecePosition: { x: number | null; y: number | null };
  currentPiqueta: string | null;
  currentTtn?: string | null;
  current: JltMaoMassConfigFields;
}

export interface JltMaoMassConfigDialogResult {
  action: 'apply' | 'cancel';
  series?: string[];
  ttn?: string | null;
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
    MatInputModule,
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

      <!-- TTN / OLT / Piqueta / Diferencia angular -->
      <div class="my-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-4">
        <!-- TTN (Tabla de tiro numérica) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TTN_LABEL' | translate }}</mat-label>
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TTN_PLACEHOLDER' | translate"
            [value]="ttnField() ?? ''"
            (input)="onTtnInput($event)"
          />
        </mat-form-field>

        <ui-input-select
          label="OLT"
          [opciones]="angleOptions"
          [placeholder]="'0,000'"
          [value]="oltDisplayField()"
          [readOnly]="oltReadOnly()"
          [unitDisabled]="false"
          [variant]="oltReadOnly() ? 'computed' : 'default'"
          (valueChange)="onOltChanged($event)"
        >
          <input
            inputSelectInput
            libLocalDecimal
            [decimals]="2"
            [disabled]="oltReadOnly()"
            [readOnly]="oltReadOnly()"
            [value]="oltDisplayField()?.value ?? ''"
          />
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
          <input
            inputSelectInput
            libLocalDecimal
            [decimals]="2"
            [disabled]="angularDifferenceReadOnly()"
            [readOnly]="angularDifferenceReadOnly()"
            [value]="diferenciaAngularField()?.value ?? ''"
          />
        </ui-input-select>
      </div>
      @if (needsManualOrientation() && calculatedOlt() === null) {
        <p role="status" class="mb-3 text-sm text-gray-600">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_OLT_REQUIRED' | translate }}
        </p>
      }

      <!-- 2-column grid: numeric fields -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-8">
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
          [value]="distanciaPiqueDisplayField()"
          [readOnly]="distanciaPiqueReadOnly()"
          [variant]="distanciaPiqueReadOnly() ? 'computed' : 'default'"
          (valueChange)="onDistanciaPiqueChanged($event)"
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
          [value]="anguloTiroDisplayField()"
          [readOnly]="anguloTiroReadOnly()"
          [variant]="anguloTiroReadOnly() ? 'computed' : 'default'"
          (valueChange)="onAnguloTiroChanged($event)"
        />

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaDisplayField()"
          [readOnly]="graduacionEspoletaReadOnly()"
          [variant]="graduacionEspoletaReadOnly() ? 'computed' : 'default'"
          (valueChange)="onGraduacionEspoletaChanged($event)"
        />

        <!-- Altura de explosión -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_EXPLOSION_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_EXPLOSION_PLACEHOLDER' | translate"
          [value]="alturaFuncionamientoDisplayField()"
          [readOnly]="alturaFuncionamientoReadOnly()"
          [variant]="alturaFuncionamientoReadOnly() ? 'computed' : 'default'"
          (valueChange)="onAlturaFuncionamientoChanged($event)"
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
  readonly #executionService = inject(ExecutionService, { optional: true });
  readonly #store = inject(ExecutionStore, { optional: true });

  #lastLoadedSeriesId: string | null = null;
  #loadExecutionTicket = 0;

  constructor() {
    effect(() => {
      const selectedSeries = this.formModel().series;
      untracked(() => {
        void this.#handleSeriesSelectionChange(selectedSeries);
      });
    });
  }

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];
  protected readonly angleOptions = [AngleUnitEnum.DEGREES, AngleUnitEnum.MILS, AngleUnitEnum.RAD].map((unit) => ({
    value: unit,
    label: MEASURE_UNIT_LABELS[unit],
  }));
  protected readonly secondsOptions = [{ value: 's', label: 's' }];
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];

  // ── Form (series multi-select + piqueta selector) ─────────────────────────
  protected readonly formModel = signal<MassConfigForm>({
    series: [],
    piqueta: this.data.currentPiqueta ?? null,
  });
  protected readonly massForm = form(this.formModel, (path) => {
    disabled(path.piqueta, () => !this.needsManualOrientation() || this.hasManualOlt());
  });

  protected readonly oltField = signal<InputFieldValue>(null);

  protected readonly serieSelectOptions = computed(() =>
    this.data.serieOptions.map((option) => ({
      ...option,
      disabled:
        this.#getSeriesOrientationStatus(option.value) === 'inconsistent' || !this.#canSelectSeries(option.value),
    })),
  );

  protected readonly selectedSeriesStatuses = computed(() =>
    this.formModel().series.map((seriesId) => ({
      seriesId,
      status: this.#getSeriesOrientationStatus(seriesId),
    })),
  );
  protected readonly planningConditionsReady = computed(() => this.data.planningConditionsReady);
  protected readonly planningConfigurationsReady = computed(() => this.data.planningConfigurationsReady);
  protected readonly hasIncompatibleSeriesConfigurations = computed(() => {
    if (!this.data.planningConfigurationsReady) return true;
    const signatures = this.formModel().series.map(
      (seriesId) => this.data.seriesConfigurations.find((series) => series.seriesId === seriesId)?.signature,
    );
    return (
      signatures.some((signature) => signature === null || signature === undefined) || new Set(signatures).size > 1
    );
  });
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
  protected readonly plannedOltSource = computed(() => {
    const plannedSeriesId = this.selectedSeriesStatuses().find(({ status }) => status === 'planned')?.seriesId;
    if (!plannedSeriesId) return null;
    return (
      this.data.seriesOrientations.find((series) => series.seriesId === plannedSeriesId)?.sourceOrientations?.[0] ??
      null
    );
  });
  protected readonly oltDisplayUnit = linkedSignal({
    source: () => this.formModel().series.join('|'),
    computation: (): AngleUnitEnum => AngleUnitEnum.MILS,
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
    const unit = this.oltDisplayUnit();
    if (!this.needsManualOrientation()) {
      const source = this.plannedOltSource();
      const value = source?.unit === unit ? source.value : this.plannedOlt();
      return this.#numToField(
        value === null ? null : source?.unit === unit ? value : this.#milsToAngle(value, unit),
        unit,
      );
    }

    const value = this.formModel().piqueta !== null ? this.calculatedOlt() : this.#parseNumber(this.oltField());
    return this.#numToField(value === null ? null : this.#milsToAngle(value, unit), unit);
  });

  protected readonly plannedRange = computed<number | null>(() => {
    const selectedSeries = this.formModel().series;
    if (selectedSeries.length === 0) return null;
    const values = new Set<number>();
    for (const seriesId of selectedSeries) {
      const seriesData = this.data.seriesPlannedValues?.find((s) => s.seriesId === seriesId);
      if (!seriesData) continue;
      for (const val of seriesData.ranges) {
        if (val !== null && val !== undefined) {
          values.add(val);
        }
      }
    }
    if (values.size === 1) {
      const [first] = values;
      return first ?? null;
    }
    return null;
  });

  protected readonly plannedShootingAngle = computed<number | null>(() => {
    const selectedSeries = this.formModel().series;
    if (selectedSeries.length === 0) return null;
    const values = new Set<number>();
    for (const seriesId of selectedSeries) {
      const seriesData = this.data.seriesPlannedValues?.find((s) => s.seriesId === seriesId);
      if (!seriesData) continue;
      for (const val of seriesData.shootingAngles) {
        if (val !== null && val !== undefined) {
          values.add(val);
        }
      }
    }
    if (values.size === 1) {
      const [first] = values;
      return first ?? null;
    }
    return null;
  });

  protected readonly plannedFuseGraduation = computed<number | null>(() => {
    const selectedSeries = this.formModel().series;
    if (selectedSeries.length === 0) return null;
    const values = new Set<number>();
    for (const seriesId of selectedSeries) {
      const seriesData = this.data.seriesPlannedValues?.find((s) => s.seriesId === seriesId);
      if (!seriesData) continue;
      for (const val of seriesData.fuseGraduations) {
        if (val !== null && val !== undefined) {
          values.add(val);
        }
      }
    }
    if (values.size === 1) {
      const [first] = values;
      return first ?? null;
    }
    return null;
  });

  protected readonly plannedFunctioningHeight = computed<number | null>(() => {
    const selectedSeries = this.formModel().series;
    if (selectedSeries.length === 0) return null;
    const values = new Set<number>();
    for (const seriesId of selectedSeries) {
      const seriesData = this.data.seriesPlannedValues?.find((s) => s.seriesId === seriesId);
      if (!seriesData) continue;
      for (const val of seriesData.functioningHeights) {
        if (val !== null && val !== undefined) {
          values.add(val);
        }
      }
    }
    if (values.size === 1) {
      const [first] = values;
      return first ?? null;
    }
    return null;
  });

  protected readonly distanciaPiqueReadOnly = computed(() => this.plannedRange() !== null);
  protected readonly anguloTiroReadOnly = computed(() => this.plannedShootingAngle() !== null);
  protected readonly graduacionEspoletaReadOnly = computed(() => this.plannedFuseGraduation() !== null);
  protected readonly alturaFuncionamientoReadOnly = computed(() => this.plannedFunctioningHeight() !== null);

  protected readonly effectiveDistanciaPique = computed<InputFieldValue>(() => {
    const planned = this.plannedRange();
    return planned !== null ? this.#numToField(planned, 'm') : this.distanciaPiqueField();
  });
  protected readonly distanciaPiqueDisplayField = computed<InputFieldValue>(() => this.effectiveDistanciaPique());

  protected readonly effectiveShootingAngle = computed<InputFieldValue>(() => {
    const planned = this.plannedShootingAngle();
    return planned !== null ? this.#numToField(planned, 'oo') : this.anguloTiroField();
  });
  protected readonly anguloTiroDisplayField = computed<InputFieldValue>(() => this.effectiveShootingAngle());

  protected readonly effectiveFuseGraduation = computed<InputFieldValue>(() => {
    const planned = this.plannedFuseGraduation();
    return planned !== null ? this.#numToField(planned, 's') : this.graduacionEspoletaField();
  });
  protected readonly graduacionEspoletaDisplayField = computed<InputFieldValue>(() => this.effectiveFuseGraduation());

  protected readonly effectiveAlturaFuncionamiento = computed<InputFieldValue>(() => {
    const planned = this.plannedFunctioningHeight();
    return planned !== null ? this.#numToField(planned, 'm') : this.alturaFuncionamientoField();
  });
  protected readonly alturaFuncionamientoDisplayField = computed<InputFieldValue>(() =>
    this.effectiveAlturaFuncionamiento(),
  );

  protected readonly canApply = computed(() => {
    if (
      this.hasInconsistentOrientation() ||
      this.hasUnavailableOrientationData() ||
      this.hasIncompatibleSeriesConfigurations()
    ) {
      return false;
    }
    const hasCalculatedOrientation = this.needsManualOrientation() && this.calculatedOlt() !== null;
    if (this.needsManualOrientation() && !hasCalculatedOrientation) return false;
    const initialTtn = this.data.currentTtn ?? this.#store?.jltMao?.()?.ttn ?? null;
    const hasTtnChange = this.ttnField() !== initialTtn;
    return (
      this.formModel().series.length > 0 &&
      (hasCalculatedOrientation ||
        hasTtnChange ||
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

  // ── TTN signal (pre-filled from store or data, editable) ─────────────────
  protected readonly ttnField = signal<string | null>(this.data.currentTtn ?? this.#store?.jltMao?.()?.ttn ?? null);

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
      ttn: this.ttnField(),
      velocidadInicial: this.velocidadInicialField(),
      distanciaPique: this.effectiveDistanciaPique(),
      derivaTabular: this.derivaTabularField(),
      tiempoVuelo: this.tiempoVueloField(),
      diferenciaAngular: this.diferenciaAngularField(),
      anguloTiro: this.effectiveShootingAngle(),
      graduacionEspoleta: this.effectiveFuseGraduation(),
      alturaFuncionamiento: this.effectiveAlturaFuncionamiento(),
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

  onTtnInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.ttnField.set(target?.value ? target.value : null);
  }

  onDistanciaPiqueChanged(value: InputFieldValue): void {
    if (this.distanciaPiqueReadOnly()) return;
    this.distanciaPiqueField.set(value);
  }

  onAnguloTiroChanged(value: InputFieldValue): void {
    if (this.anguloTiroReadOnly()) return;
    this.anguloTiroField.set(value);
  }

  onGraduacionEspoletaChanged(value: InputFieldValue): void {
    if (this.graduacionEspoletaReadOnly()) return;
    this.graduacionEspoletaField.set(value);
  }

  onAlturaFuncionamientoChanged(value: InputFieldValue): void {
    if (this.alturaFuncionamientoReadOnly()) return;
    this.alturaFuncionamientoField.set(value);
  }

  onOltChanged(olt: InputFieldValue): void {
    const currentUnit = this.oltDisplayUnit();
    if (olt && olt.unit !== currentUnit) {
      this.oltDisplayUnit.set(olt.unit as AngleUnitEnum);
      return;
    }
    if (this.oltReadOnly()) return;

    const value = this.#parseNumber(olt);
    this.oltField.set(value === null ? null : this.#numToField(this.#angleToMils(value, currentUnit)));
  }

  #numToField(value: number | null, unit: string = AngleUnitEnum.MILS): InputFieldValue {
    return value === null ? null : { value: String(value), unit };
  }

  #canSelectSeries(seriesId: string): boolean {
    const selectedSeries = this.formModel().series;
    if (selectedSeries.includes(seriesId)) return true;
    if (!this.data.planningConfigurationsReady) return false;
    const candidate = this.data.seriesConfigurations.find((series) => series.seriesId === seriesId)?.signature;
    if (candidate === null || candidate === undefined) return false;
    if (selectedSeries.length === 0) return true;
    return selectedSeries.every((selectedId) => {
      const selectedSignature = this.data.seriesConfigurations.find(
        (series) => series.seriesId === selectedId,
      )?.signature;
      return selectedSignature !== null && selectedSignature !== undefined && selectedSignature === candidate;
    });
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
    if (field?.value === null || field?.value === undefined || field?.value === '') return null;
    if (typeof field.value === 'number') {
      return Number.isFinite(field.value) ? field.value : null;
    }
    const parsed = Number(field.value.toString().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  #angleToMils(value: number, unit: AngleUnitEnum): number {
    if (unit === AngleUnitEnum.DEGREES) return value * (6400 / 360);
    if (unit === AngleUnitEnum.RAD) return value * (3200 / Math.PI);
    return value;
  }

  #milsToAngle(value: number, unit: AngleUnitEnum): number {
    if (unit === AngleUnitEnum.DEGREES) return value * (360 / 6400);
    if (unit === AngleUnitEnum.RAD) return value * (Math.PI / 3200);
    return value;
  }

  async #handleSeriesSelectionChange(selectedSeries: string[]): Promise<void> {
    const ticket = ++this.#loadExecutionTicket;
    if (selectedSeries.length === 0) {
      this.#lastLoadedSeriesId = null;
      this.#resetToCurrentValues();
      return;
    }

    const seriesId = selectedSeries[0];
    if (seriesId === this.#lastLoadedSeriesId) {
      return;
    }
    this.#lastLoadedSeriesId = seriesId;
    this.#resetToCurrentValues();

    if (this.#store?.jltMao?.()?.serie === seriesId && this.#store?.jltMao?.()?.ttn !== undefined) {
      this.ttnField.set(this.#store.jltMao().ttn ?? null);
    } else {
      this.ttnField.set(null);
    }

    const executionData = this.#getExecutionDataForSeries(seriesId);
    if (executionData) {
      if (ticket !== this.#loadExecutionTicket) return;
      this.#applyExecutionData(executionData);
      return;
    }

    const fireTrialId = this.data.fireTrialId ?? this.#store?.fireTrialId?.();
    const shotId = this.data.shotIdsBySeries?.[seriesId]?.[0] ?? this.#findShotIdForSeries(seriesId);
    if (fireTrialId && shotId && this.#executionService) {
      try {
        const response = await this.#executionService.fetchShotJltMao(fireTrialId, seriesId, shotId);
        if (ticket !== this.#loadExecutionTicket) return;
        if (response?.jltMaoData) {
          this.#applyExecutionData(response.jltMaoData);
        }
      } catch {
        // No execution data: ignore
      }
    }
  }

  #getExecutionDataForSeries(seriesId: string): ShotJltMao | null {
    const values = this.data.seriesExecutionValues;
    if (!values) return null;
    return values.find((item) => item.seriesId === seriesId)?.data ?? null;
  }

  #findShotIdForSeries(seriesId: string): string | null {
    const planningSeries = this.#store?.planningSeries?.() ?? [];
    const plannedShots = planningSeries.find((s) => s.id === seriesId)?.shots;
    if (plannedShots?.length) return plannedShots[0].id;

    const executionSeries = this.#store?.executionProgress?.()?.series ?? [];
    const executedShots = executionSeries.find((s) => s.seriesId === seriesId)?.shots;
    if (executedShots?.length) return executedShots[0].shotId;

    return null;
  }

  #applyExecutionData(data: ShotJltMao): void {
    if (data.numericFiringTable !== undefined) {
      this.ttnField.set(data.numericFiringTable ?? null);
    }
    if (data.theoreticalInitialVelocity !== undefined && data.theoreticalInitialVelocity !== null) {
      this.velocidadInicialField.set(this.#numToField(data.theoreticalInitialVelocity, 'm/s'));
    }
    if (
      this.plannedRange() === null &&
      data.plannedImpactDistance !== undefined &&
      data.plannedImpactDistance !== null
    ) {
      this.distanciaPiqueField.set(this.#numToField(data.plannedImpactDistance, 'm'));
    }
    if (data.tabularDrift !== undefined && data.tabularDrift !== null) {
      this.derivaTabularField.set(this.#numToField(data.tabularDrift, 'oo'));
    }
    if (data.theoreticalFlightTime !== undefined && data.theoreticalFlightTime !== null) {
      this.tiempoVueloField.set(this.#numToField(data.theoreticalFlightTime, 's'));
    }
    if (data.angularDifference !== undefined && data.angularDifference !== null) {
      this.diferenciaAngularField.set(this.#numToField(data.angularDifference, 'oo'));
    }
    if (this.plannedShootingAngle() === null && data.shootingAngle !== undefined && data.shootingAngle !== null) {
      this.anguloTiroField.set(this.#numToField(data.shootingAngle, 'oo'));
    }
    if (this.plannedFuseGraduation() === null && data.fuseGraduation !== undefined && data.fuseGraduation !== null) {
      this.graduacionEspoletaField.set(this.#numToField(data.fuseGraduation, 's'));
    }
    if (
      this.plannedFunctioningHeight() === null &&
      data.functioningHeight !== undefined &&
      data.functioningHeight !== null
    ) {
      this.alturaFuncionamientoField.set(this.#numToField(data.functioningHeight, 'm'));
    }
    if (data.functioningDistance !== undefined && data.functioningDistance !== null) {
      this.distanciaFuncionamientoField.set(this.#numToField(data.functioningDistance, 'm'));
    }
    if (this.needsManualOrientation() && data.stakeId !== undefined && data.stakeId !== null) {
      this.formModel.update((model) => ({ ...model, piqueta: data.stakeId ?? null }));
    }
    if (
      this.needsManualOrientation() &&
      this.formModel().piqueta === null &&
      data.lineOfFireOrientation !== undefined &&
      data.lineOfFireOrientation !== null
    ) {
      this.oltField.set(this.#numToField(data.lineOfFireOrientation, 'oo'));
    }
  }

  #resetToCurrentValues(): void {
    this.ttnField.set(this.data.currentTtn ?? this.#store?.jltMao?.()?.ttn ?? null);
    this.velocidadInicialField.set(this.data.current.velocidadInicial);
    this.distanciaPiqueField.set(this.data.current.distanciaPique);
    this.derivaTabularField.set(this.data.current.derivaTabular);
    this.tiempoVueloField.set(this.data.current.tiempoVuelo);
    this.diferenciaAngularField.set(this.data.current.diferenciaAngular);
    this.anguloTiroField.set(this.data.current.anguloTiro);
    this.graduacionEspoletaField.set(this.data.current.graduacionEspoleta);
    this.alturaFuncionamientoField.set(this.data.current.alturaFuncionamiento);
    this.distanciaFuncionamientoField.set(this.data.current.distanciaFuncionamiento);
  }
}
